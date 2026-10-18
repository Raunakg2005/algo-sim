// Legacy harness: knapsack-branch-and-bound. Lines 17-44 (types), 82-110 (addItem/removeItem), 140-161 (calculateBound) and
// 163-423 (startAlgorithm) spliced verbatim from `git show HEAD:components/knapsack-branch-and-bound.tsx`.
type Item = {
  id: number
  weight: number
  value: number
  ratio: number
}

type Node = {
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

type AlgorithmStep = {
  phase: "init" | "branch" | "bound" | "prune" | "update" | "complete"
  description: string
  currentNode: number
  bestNode: number | null
  bestValue: number
  nodes: Node[]
  activeNodes: number[]
}
export type { Item, Node, AlgorithmStep }
export function legacy(items: Item[], capacity: number): { steps: AlgorithmStep[]; error: string } {
  let captured: AlgorithmStep[] = []
  let error = ""
  const setInputError = (s: string) => { error = s }
  const setAlgorithmStarted = (_b: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const setCurrentStep = (_n: number) => {}
  const calculateBound = (node: Node, remainingItems: Item[], remainingCapacity: number): number => {
    let bound = node.value
    let totalWeight = node.weight

    const sortedItems = [...remainingItems].sort((a, b) => b.ratio - a.ratio)

    for (const item of sortedItems) {
      if (totalWeight + item.weight <= capacity) {
        bound += item.value
        totalWeight += item.weight
      } else if (totalWeight < capacity) {
        const fraction = (capacity - totalWeight) / item.weight
        bound += item.value * fraction
        totalWeight = capacity
        break
      } else {
        break
      }
    }

    return Math.floor(bound)
  }
  const startAlgorithm = () => {
    if (items.length === 0) {
      setInputError("Please add at least one item")
      return
    }

    if (capacity <= 0) {
      setInputError("Capacity must be a positive number")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const sortedItems = [...items].sort((a, b) => b.ratio - a.ratio)

    const rootNode: Node = {
      id: 1,
      level: 0,
      weight: 0,
      value: 0,
      bound: 0,
      items: [],
      include: null,
      parent: null,
      pruned: false,
    }

    rootNode.bound = calculateBound(rootNode, sortedItems, capacity)

    const nodes: Node[] = [rootNode]
    algorithmSteps.push({
      phase: "init",
      description: "Initialize with root node. Calculate initial bound using fractional knapsack.",
      currentNode: 1,
      bestNode: null,
      bestValue: 0,
      nodes: [...nodes],
      activeNodes: [1],
    })

    const queue: number[] = [1]
    let bestValue = 0
    let bestNode: number | null = null
    let nodeCounter = 1

    while (queue.length > 0) {
      queue.sort((a, b) => {
        const nodeA = nodes.find((n) => n.id === a)!
        const nodeB = nodes.find((n) => n.id === b)!
        return nodeB.bound - nodeA.bound
      })

      const currentNodeId = queue.shift()!
      const currentNode = nodes.find((n) => n.id === currentNodeId)!

      algorithmSteps.push({
        phase: "branch",
        description: `Select node ${currentNodeId} with highest bound (${currentNode.bound})`,
        currentNode: currentNodeId,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [...queue, currentNodeId],
      })

      if (currentNode.bound <= bestValue) {
        currentNode.pruned = true

        algorithmSteps.push({
          phase: "prune",
          description: `Prune node ${currentNodeId} as its bound (${currentNode.bound}) is not better than current best value (${bestValue})`,
          currentNode: currentNodeId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })

        continue
      }

      if (currentNode.level === sortedItems.length) {
        if (currentNode.value > bestValue) {
          bestValue = currentNode.value
          bestNode = currentNodeId

          algorithmSteps.push({
            phase: "update",
            description: `Update best solution: Value = ${bestValue}, Items = [${currentNode.items.join(", ")}]`,
            currentNode: currentNodeId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }

        continue
      }

      const nextItem = sortedItems[currentNode.level]

      const leftChildWeight = currentNode.weight + nextItem.weight
      if (leftChildWeight <= capacity) {
        nodeCounter++
        const leftChildId = nodeCounter

        const leftChild: Node = {
          id: leftChildId,
          level: currentNode.level + 1,
          weight: leftChildWeight,
          value: currentNode.value + nextItem.value,
          bound: 0,
          items: [...currentNode.items, nextItem.id],
          include: true,
          parent: currentNodeId,
          pruned: false,
        }

        const remainingItems = sortedItems.slice(currentNode.level + 1)
        leftChild.bound = calculateBound(leftChild, remainingItems, capacity - leftChild.weight)

        nodes.push(leftChild)

        algorithmSteps.push({
          phase: "branch",
          description: `Create left child (node ${leftChildId}): Include item ${nextItem.id}, Weight = ${leftChild.weight}, Value = ${leftChild.value}, Bound = ${leftChild.bound}`,
          currentNode: leftChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })

        if (leftChild.bound > bestValue) {
          queue.push(leftChildId)

          algorithmSteps.push({
            phase: "bound",
            description: `Add node ${leftChildId} to queue as its bound (${leftChild.bound}) is better than current best value (${bestValue})`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        } else {
          leftChild.pruned = true

          algorithmSteps.push({
            phase: "prune",
            description: `Prune node ${leftChildId} as its bound (${leftChild.bound}) is not better than current best value (${bestValue})`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }

        if (leftChild.level === sortedItems.length && leftChild.value > bestValue) {
          bestValue = leftChild.value
          bestNode = leftChildId

          algorithmSteps.push({
            phase: "update",
            description: `Update best solution: Value = ${bestValue}, Items = [${leftChild.items.join(", ")}]`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }
      }

      nodeCounter++
      const rightChildId = nodeCounter

      const rightChild: Node = {
        id: rightChildId,
        level: currentNode.level + 1,
        weight: currentNode.weight,
        value: currentNode.value,
        bound: 0,
        items: [...currentNode.items],
        include: false,
        parent: currentNodeId,
        pruned: false,
      }

      const remainingItems = sortedItems.slice(currentNode.level + 1)
      rightChild.bound = calculateBound(rightChild, remainingItems, capacity - rightChild.weight)

      nodes.push(rightChild)

      algorithmSteps.push({
        phase: "branch",
        description: `Create right child (node ${rightChildId}): Exclude item ${nextItem.id}, Weight = ${rightChild.weight}, Value = ${rightChild.value}, Bound = ${rightChild.bound}`,
        currentNode: rightChildId,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [...queue],
      })

      if (rightChild.bound > bestValue) {
        queue.push(rightChildId)
        algorithmSteps.push({
          phase: "bound",
          description: `Add node ${rightChildId} to queue as its bound (${rightChild.bound}) is better than current best value (${bestValue})`,
          currentNode: rightChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })
      } else {
        rightChild.pruned = true

        algorithmSteps.push({
          phase: "prune",
          description: `Prune node ${rightChildId} as its bound (${rightChild.bound}) is not better than current best value (${bestValue})`,
          currentNode: rightChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })
      }
    }

    if (bestNode !== null) {
      const bestNodeObj = nodes.find((n) => n.id === bestNode)!
      algorithmSteps.push({
        phase: "complete",
        description: `Algorithm complete. Best solution: Value = ${bestValue}, Weight = ${bestNodeObj.weight}, Items = [${bestNodeObj.items.join(", ")}]`,
        currentNode: bestNode,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [],
      })
    } else {
      algorithmSteps.push({
        phase: "complete",
        description: "Algorithm complete. No solution found.",
        currentNode: 1,
        bestNode: null,
        bestValue: 0,
        nodes: [...nodes],
        activeNodes: [],
      })
    }

    setSteps(algorithmSteps)
    setCurrentStep(0)
  }
  startAlgorithm()
  return { steps: captured, error }
}
// item-list editing, same code as the component
export function editor(initial: Item[]) {
  let items = initial
  let newItemWeight = "", newItemValue = "", inputError = ""
  const setItems = (x: Item[]) => { items = x }
  const setInputError = (s: string) => { inputError = s }
  const setNewItemWeight = (s: string) => { newItemWeight = s }
  const setNewItemValue = (s: string) => { newItemValue = s }
  return {
    add(w: string, v: string) {
      newItemWeight = w; newItemValue = v
    if (!newItemWeight.trim() || !newItemValue.trim()) {
      setInputError("Please enter both weight and value")
      return
    }

    const weight = Number.parseInt(newItemWeight)
    const value = Number.parseInt(newItemValue)

    if (isNaN(weight) || weight <= 0) {
      setInputError("Weight must be a positive number")
      return
    }

    if (isNaN(value) || value <= 0) {
      setInputError("Value must be a positive number")
      return
    }

    setInputError("")
    const ratio = Number.parseFloat((value / weight).toFixed(2))
    setItems([...items, { id: items.length + 1, weight, value, ratio }])
    setNewItemWeight("")
    setNewItemValue("")
    },
    remove(id: number) {
    setItems(items.filter((item) => item.id !== id))
    },
    get items() { return items },
    get error() { return inputError },
  }
}
