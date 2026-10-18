// Step generator for the 0/1 Knapsack Branch-and-Bound visualizer.
// Pure function: given the items and the capacity, returns every frame the visualizer plays.
//
// Least-cost (best-first) branch and bound: items are considered in decreasing value/weight order; a node's bound
// is the fractional-knapsack (LP relaxation) value of its subtree, rounded down (all values are integers, so the
// integer optimum of the subtree never exceeds it). The live node with the highest bound is expanded next; a node is
// pruned when its bound is not better than the best complete solution found so far. Complete solutions (leaves) are
// evaluated as soon as they are created instead of being queued.

export type KnapsackItem = { id: number; weight: number; value: number; ratio: number }

export type KnapsackNode = {
  id: number
  level: number
  weight: number
  value: number
  bound: number
  items: number[]
  include: boolean | null
  parent: number | null
  pruned: boolean
}

export type KnapsackStep = {
  phase: "init" | "branch" | "bound" | "prune" | "update" | "complete"
  description: string
  currentNode: number
  bestNode: number | null
  bestValue: number
  nodes: KnapsackNode[]
  activeNodes: number[]
}

// items in the order the tree branches on them: decreasing exact value/weight, ties in input order
export function branchingOrder(items: KnapsackItem[]): KnapsackItem[] {
  return [...items].sort((a, b) => b.value / b.weight - a.value / a.weight)
}

// fractional-knapsack upper bound for a node that has decided the first `level` items of `order`
export function fractionalBound(order: KnapsackItem[], capacity: number, level: number, weight: number, value: number): number {
  let bound = value
  let w = weight
  for (let i = level; i < order.length; i++) {
    const item = order[i]
    if (w + item.weight <= capacity) {
      bound += item.value
      w += item.weight
    } else {
      if (w < capacity) bound += (item.value * (capacity - w)) / item.weight
      break
    }
  }
  // the tolerance stops floating-point error (e.g. 4.999999) from rounding a valid bound below the optimum
  return Math.floor(bound + 1e-9)
}

export function generateKnapsackSteps(items: KnapsackItem[], capacity: number): KnapsackStep[] {
  const steps: KnapsackStep[] = []
  const order = branchingOrder(items)
  const n = order.length

  // node objects are never mutated after being stored: a change replaces the object, so `[...nodes]` is a faithful
  // snapshot of the tree at that frame
  const nodes: KnapsackNode[] = []
  const indexOf = new Map<number, number>()
  const add = (node: KnapsackNode) => {
    indexOf.set(node.id, nodes.length)
    nodes.push(node)
  }
  const get = (id: number) => nodes[indexOf.get(id)!]
  const markPruned = (id: number) => {
    nodes[indexOf.get(id)!] = { ...get(id), pruned: true }
  }

  let bestValue = 0
  let bestNode: number | null = null
  const queue: number[] = []
  const push = (phase: KnapsackStep["phase"], description: string, currentNode: number, activeNodes: number[]) => {
    steps.push({ phase, description, currentNode, bestNode, bestValue, nodes: [...nodes], activeNodes })
  }

  add({
    id: 1,
    level: 0,
    weight: 0,
    value: 0,
    bound: fractionalBound(order, capacity, 0, 0, 0),
    items: [],
    include: null,
    parent: null,
    pruned: false,
  })
  queue.push(1)
  push("init", "Initialize with root node. Calculate initial bound using fractional knapsack.", 1, [1])

  let nodeCounter = 1

  // a freshly created child: complete solutions are evaluated at once, partial ones are queued or pruned
  const settleChild = (child: KnapsackNode) => {
    if (child.level === n) {
      if (child.value > bestValue) {
        bestValue = child.value
        bestNode = child.id
        push("update", `Update best solution: Value = ${bestValue}, Items = [${child.items.join(", ")}]`, child.id, [...queue])
      } else {
        markPruned(child.id)
        push(
          "prune",
          `Prune node ${child.id} as its bound (${child.bound}) is not better than current best value (${bestValue})`,
          child.id,
          [...queue],
        )
      }
      return
    }
    if (child.bound > bestValue) {
      queue.push(child.id)
      push(
        "bound",
        `Add node ${child.id} to queue as its bound (${child.bound}) is better than current best value (${bestValue})`,
        child.id,
        [...queue],
      )
    } else {
      markPruned(child.id)
      push(
        "prune",
        `Prune node ${child.id} as its bound (${child.bound}) is not better than current best value (${bestValue})`,
        child.id,
        [...queue],
      )
    }
  }

  while (queue.length > 0) {
    queue.sort((a, b) => get(b).bound - get(a).bound)
    const currentId = queue.shift()!
    const current = get(currentId)

    push("branch", `Select node ${currentId} with highest bound (${current.bound})`, currentId, [...queue, currentId])

    if (current.bound <= bestValue) {
      markPruned(currentId)
      push(
        "prune",
        `Prune node ${currentId} as its bound (${current.bound}) is not better than current best value (${bestValue})`,
        currentId,
        [...queue],
      )
      continue
    }

    if (current.level === n) {
      // not reached (leaves are never queued), kept so a queued leaf could never be lost
      if (current.value > bestValue) {
        bestValue = current.value
        bestNode = currentId
        push("update", `Update best solution: Value = ${bestValue}, Items = [${current.items.join(", ")}]`, currentId, [...queue])
      }
      continue
    }

    const next = order[current.level]

    if (current.weight + next.weight <= capacity) {
      nodeCounter++
      const left: KnapsackNode = {
        id: nodeCounter,
        level: current.level + 1,
        weight: current.weight + next.weight,
        value: current.value + next.value,
        bound: fractionalBound(order, capacity, current.level + 1, current.weight + next.weight, current.value + next.value),
        items: [...current.items, next.id],
        include: true,
        parent: currentId,
        pruned: false,
      }
      add(left)
      push(
        "branch",
        `Create left child (node ${left.id}): Include item ${next.id}, Weight = ${left.weight}, Value = ${left.value}, Bound = ${left.bound}`,
        left.id,
        [...queue],
      )
      settleChild(left)
    }

    nodeCounter++
    const right: KnapsackNode = {
      id: nodeCounter,
      level: current.level + 1,
      weight: current.weight,
      value: current.value,
      bound: fractionalBound(order, capacity, current.level + 1, current.weight, current.value),
      items: [...current.items],
      include: false,
      parent: currentId,
      pruned: false,
    }
    add(right)
    push(
      "branch",
      `Create right child (node ${right.id}): Exclude item ${next.id}, Weight = ${right.weight}, Value = ${right.value}, Bound = ${right.bound}`,
      right.id,
      [...queue],
    )
    settleChild(right)
  }

  if (bestNode !== null) {
    const best = get(bestNode)
    push(
      "complete",
      `Algorithm complete. Best solution: Value = ${bestValue}, Weight = ${best.weight}, Items = [${best.items.join(", ")}]`,
      bestNode,
      [],
    )
  } else {
    push("complete", "Algorithm complete. No item fits in the knapsack, so the best value is 0 (empty knapsack).", 1, [])
  }

  return steps
}
