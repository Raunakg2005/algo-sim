// Step generator for the Sum of Subsets (backtracking) visualizer.
// Pure function: given the numbers and the target, returns the sorted numbers and every frame the visualizer plays.
//
// The state-space tree is explored in the textbook order (include x_i, then exclude x_i) over the numbers sorted
// ascending. A branch is cut only when no completion of it can reach the target:
//   include x_i is cut when  sum + x_i + (sum of the negative numbers after i) > target   ("would exceed")
//   exclude x_i is cut when  sum + (sum of the positive numbers after i)       < target   ("insufficient")
// For non-negative inputs these are the textbook tests  sum + x_i > target  and  sum + r_{i+1} < target.

export type SubsetTreeNode = {
  id: string
  parentId: string | null
  level: number
  index: number
  include: boolean
  sum: number
  subset: number[]
  isLeaf: boolean
  isSuccess: boolean
  isFailure: boolean
  isBacktracked: boolean
  children: string[]
}

export type SubsetStep = {
  phase: "init" | "decision" | "backtrack" | "success" | "complete"
  description: string
  currentIndex: number
  currentSum: number
  remainingTarget: number
  currentSubset: number[]
  treeState: { [key: string]: SubsetTreeNode }
  currentNodeId: string
  previousNodeId?: string
  solutions: number[][]
}

export type SumOfSubsetsResult = { sorted: number[]; steps: SubsetStep[] }

export function generateSumOfSubsetsSteps(numbers: number[], targetSum: number): SumOfSubsetsResult {
  const sorted = [...numbers].sort((a, b) => a - b)
  const n = sorted.length
  const steps: SubsetStep[] = []
  const solutions: number[][] = []

  // negAfter[i] / posAfter[i]: sum of the negative / positive numbers in sorted[i..n-1]
  const negAfter: number[] = new Array(n + 1).fill(0)
  const posAfter: number[] = new Array(n + 1).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    negAfter[i] = negAfter[i + 1] + Math.min(0, sorted[i])
    posAfter[i] = posAfter[i + 1] + Math.max(0, sorted[i])
  }

  // Tree nodes are never mutated once created: every change replaces the node object and is appended to `log`.
  // A frame stores only the log length; its `treeState` is rebuilt from the log on first access (and cached), so
  // building all frames costs O(frames + nodes) instead of copying the whole tree into every frame.
  const log: SubsetTreeNode[] = []
  const tree: { [key: string]: SubsetTreeNode } = {
    root: {
      id: "root",
      parentId: null,
      level: 0,
      index: -1,
      include: false,
      sum: 0,
      subset: [],
      isLeaf: false,
      isSuccess: false,
      isFailure: false,
      isBacktracked: false,
      children: [],
    },
  }
  log.push(tree.root)
  const update = (id: string, patch: Partial<SubsetTreeNode>) => {
    tree[id] = { ...tree[id], ...patch }
    log.push(tree[id])
  }
  const addChild = (parentId: string, child: SubsetTreeNode) => {
    tree[child.id] = child
    log.push(child)
    update(parentId, { children: [...tree[parentId].children, child.id] })
  }
  const push = (step: Omit<SubsetStep, "treeState" | "solutions">) => {
    const version = log.length
    let cache: { [key: string]: SubsetTreeNode } | null = null
    const frame = { ...step, solutions: solutions.map((s) => [...s]) } as SubsetStep
    Object.defineProperty(frame, "treeState", {
      enumerable: true,
      get: () => {
        if (!cache) {
          const snapshot: { [key: string]: SubsetTreeNode } = {}
          for (let i = 0; i < version; i++) snapshot[log[i].id] = log[i]
          cache = snapshot
        }
        return cache
      },
    })
    steps.push(frame)
  }

  push({
    phase: "init",
    description: "Initialize with empty subset. Target sum: " + targetSum,
    currentIndex: -1,
    currentSum: 0,
    remainingTarget: targetSum,
    currentSubset: [],
    currentNodeId: "root",
  })

  const visit = (index: number, currentSum: number, currentSubset: number[], nodeId: string, parentNodeId: string | null) => {
    if (index === n) {
      if (currentSum === targetSum) {
        solutions.push([...currentSubset])
        update(nodeId, { isLeaf: true, isSuccess: true })
        push({
          phase: "success",
          description:
            currentSubset.length > 0
              ? `Found a solution! Subset ${currentSubset.join(", ")} sums to ${targetSum}`
              : `Found a solution! The empty subset sums to ${targetSum}`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          currentNodeId: nodeId,
          previousNodeId: parentNodeId || undefined,
        })
      } else {
        update(nodeId, { isLeaf: true, isFailure: true })
        push({
          phase: "backtrack",
          description: `Not a solution. Sum ${currentSum} ≠ ${targetSum}. Backtracking...`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          currentNodeId: nodeId,
          previousNodeId: parentNodeId || undefined,
        })
      }
      return
    }

    const x = sorted[index]
    const level = tree[nodeId].level + 1

    // include x
    if (currentSum + x + negAfter[index + 1] <= targetSum) {
      const includeNodeId = `${nodeId}-include-${index}`
      addChild(nodeId, {
        id: includeNodeId,
        parentId: nodeId,
        level,
        index,
        include: true,
        sum: currentSum + x,
        subset: [...currentSubset, x],
        isLeaf: false,
        isSuccess: false,
        isFailure: false,
        isBacktracked: false,
        children: [],
      })
      push({
        phase: "decision",
        description: `Include number ${x} at index ${index}`,
        currentIndex: index,
        currentSum,
        remainingTarget: targetSum - currentSum,
        currentSubset: [...currentSubset],
        currentNodeId: includeNodeId,
        previousNodeId: nodeId,
      })
      visit(index + 1, currentSum + x, [...currentSubset, x], includeNodeId, nodeId)
      update(includeNodeId, { isBacktracked: true })
    } else {
      push({
        phase: "decision",
        description:
          negAfter[index + 1] < 0
            ? `Cannot include ${x}: even with every remaining negative number the sum would exceed the target sum`
            : `Cannot include ${x} as it would exceed the target sum`,
        currentIndex: index,
        currentSum,
        remainingTarget: targetSum - currentSum,
        currentSubset: [...currentSubset],
        currentNodeId: nodeId,
      })
    }

    // exclude x
    if (currentSum + posAfter[index + 1] >= targetSum) {
      const excludeNodeId = `${nodeId}-exclude-${index}`
      addChild(nodeId, {
        id: excludeNodeId,
        parentId: nodeId,
        level,
        index,
        include: false,
        sum: currentSum,
        subset: [...currentSubset],
        isLeaf: false,
        isSuccess: false,
        isFailure: false,
        isBacktracked: false,
        children: [],
      })
      push({
        phase: "decision",
        description: `Exclude number ${x} at index ${index}`,
        currentIndex: index,
        currentSum,
        remainingTarget: targetSum - currentSum,
        currentSubset: [...currentSubset],
        currentNodeId: excludeNodeId,
        previousNodeId: nodeId,
      })
      visit(index + 1, currentSum, [...currentSubset], excludeNodeId, nodeId)
      update(excludeNodeId, { isBacktracked: true })
    } else {
      push({
        phase: "decision",
        description: `Cannot exclude ${x} as the remaining sum would be insufficient`,
        currentIndex: index,
        currentSum,
        remainingTarget: targetSum - currentSum,
        currentSubset: [...currentSubset],
        currentNodeId: nodeId,
      })
    }

    if (parentNodeId) {
      const parent = tree[parentNodeId]
      push({
        phase: "backtrack",
        description: `Backtracking from index ${index}...`,
        currentIndex: index - 1,
        currentSum: parent.sum,
        remainingTarget: targetSum - parent.sum,
        currentSubset: [...parent.subset],
        currentNodeId: parentNodeId,
        previousNodeId: nodeId,
      })
    }
  }

  visit(0, 0, [], "root", null)

  push({
    phase: "complete",
    description:
      solutions.length > 0
        ? `Algorithm complete. Found ${solutions.length} solution(s).`
        : "Algorithm complete. No solutions found.",
    currentIndex: n,
    currentSum: 0,
    remainingTarget: targetSum,
    currentSubset: [],
    currentNodeId: "root",
  })

  return { sorted, steps }
}
