// Legacy harness: sum-of-subsets. Lines 15-49 (types), 83-123 (parseInput) and 152-392 (startAlgorithm) are spliced
// verbatim from `git show HEAD:components/sum-of-subsets.tsx`; React setters are replaced by plain captures.
type SubsetState = {
  include: boolean
  index: number
  currentSum: number
  remainingSum: number
  currentSubset: number[]
}

type TreeNode = {
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

type AlgorithmStep = {
  phase: "init" | "decision" | "backtrack" | "success" | "complete"
  description: string
  currentIndex: number
  currentSum: number
  remainingTarget: number
  currentSubset: number[]
  treeState: { [key: string]: TreeNode }
  currentNodeId: string
  previousNodeId?: string
  solutions: number[][]
}
export type LegacyResult = { steps: AlgorithmStep[]; numbersAfter: number[]; targetAfter: number; numbersInputAfter: string; error: string }
export function legacy(stateNumbers: number[], stateTarget: number, numbersInput: string, targetSumInput: string, cloneTree = true): LegacyResult {
  const numbers = stateNumbers
  const targetSum = stateTarget
  let numbersAfter = stateNumbers, targetAfter = stateTarget, numbersInputAfter = numbersInput, error = ""
  let captured: AlgorithmStep[] = []
  const setInputError = (s: string) => { error = s }
  const setNumbers = (a: number[]) => { numbersAfter = a }
  const setTargetSum = (t: number) => { targetAfter = t }
  const setNumbersInput = (s: string) => { numbersInputAfter = s }
  const setAlgorithmStarted = (_b: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const setCurrentStep = (_n: number) => {}
  const JSON = cloneTree ? globalThis.JSON : { parse: (x: any) => x, stringify: (x: any) => x }
  const parseInput = () => {
    try {
      setInputError("")

      const parsedNumbers = numbersInput
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n !== "")
        .map((n) => {
          const num = Number.parseInt(n)
          if (isNaN(num)) {
            throw new Error(`"${n}" is not a valid number`)
          }
          return num
        })

      if (parsedNumbers.length === 0) {
        throw new Error("Please enter at least one number")
      }

      if (parsedNumbers.length > 10) {
        throw new Error("Please enter 10 or fewer numbers for better visualization")
      }

      const parsedTargetSum = Number.parseInt(targetSumInput)
      if (isNaN(parsedTargetSum)) {
        throw new Error("Target sum must be a valid number")
      }

      setNumbers(parsedNumbers)
      setTargetSum(parsedTargetSum)
      return true
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("An unknown error occurred")
      }
      return false
    }
  }
  const startAlgorithm = () => {
    if (!parseInput()) {
      return
    }

    setAlgorithmStarted(true)

    const sortedNumbers = [...numbers].sort((a, b) => a - b)
    setNumbers(sortedNumbers)
    setNumbersInput(sortedNumbers.join(", "))

    const algorithmSteps: AlgorithmStep[] = []
    const solutions: number[][] = []

    const rootNode: TreeNode = {
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
    }

    const treeState: { [key: string]: TreeNode } = {
      root: rootNode,
    }

    algorithmSteps.push({
      phase: "init",
      description: "Initialize with empty subset. Target sum: " + targetSum,
      currentIndex: -1,
      currentSum: 0,
      remainingTarget: targetSum,
      currentSubset: [],
      treeState,
      currentNodeId: "root",
      solutions: [],
    })

    const generateSteps = (
      index: number,
      currentSum: number,
      currentSubset: number[],
      nodeId: string,
      parentNodeId: string | null,
    ) => {
      if (index === sortedNumbers.length) {
        if (currentSum === targetSum) {
          solutions.push([...currentSubset])

          treeState[nodeId] = {
            ...treeState[nodeId],
            isLeaf: true,
            isSuccess: true,
          }

          algorithmSteps.push({
            phase: "success",
            description: `Found a solution! Subset ${currentSubset.join(", ")} sums to ${targetSum}`,
            currentIndex: index,
            currentSum,
            remainingTarget: targetSum - currentSum,
            currentSubset: [...currentSubset],
            treeState: JSON.parse(JSON.stringify(treeState)),
            currentNodeId: nodeId,
            previousNodeId: parentNodeId || undefined,
            solutions: [...solutions],
          })
        } else {
          treeState[nodeId] = {
            ...treeState[nodeId],
            isLeaf: true,
            isFailure: true,
          }

          algorithmSteps.push({
            phase: "backtrack",
            description: `Not a solution. Sum ${currentSum} ≠ ${targetSum}. Backtracking...`,
            currentIndex: index,
            currentSum,
            remainingTarget: targetSum - currentSum,
            currentSubset: [...currentSubset],
            treeState: JSON.parse(JSON.stringify(treeState)),
            currentNodeId: nodeId,
            previousNodeId: parentNodeId || undefined,
            solutions: [...solutions],
          })
        }
        return
      }

      const remainingSum = sortedNumbers.slice(index + 1).reduce((sum, num) => sum + num, 0)

      if (currentSum + sortedNumbers[index] <= targetSum) {
        const includeNodeId = `${nodeId}-include-${index}`

        treeState[includeNodeId] = {
          id: includeNodeId,
          parentId: nodeId,
          level: treeState[nodeId].level + 1,
          index,
          include: true,
          sum: currentSum + sortedNumbers[index],
          subset: [...currentSubset, sortedNumbers[index]],
          isLeaf: false,
          isSuccess: false,
          isFailure: false,
          isBacktracked: false,
          children: [],
        }

        treeState[nodeId].children.push(includeNodeId)

        algorithmSteps.push({
          phase: "decision",
          description: `Include number ${sortedNumbers[index]} at index ${index}`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: includeNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })

        generateSteps(
          index + 1,
          currentSum + sortedNumbers[index],
          [...currentSubset, sortedNumbers[index]],
          includeNodeId,
          nodeId,
        )

        treeState[includeNodeId].isBacktracked = true
      } else {
        algorithmSteps.push({
          phase: "decision",
          description: `Cannot include ${sortedNumbers[index]} as it would exceed the target sum`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: nodeId,
          solutions: [...solutions],
        })
      }

      if (currentSum + remainingSum - sortedNumbers[index] >= targetSum) {
        const excludeNodeId = `${nodeId}-exclude-${index}`

        treeState[excludeNodeId] = {
          id: excludeNodeId,
          parentId: nodeId,
          level: treeState[nodeId].level + 1,
          index,
          include: false,
          sum: currentSum,
          subset: [...currentSubset],
          isLeaf: false,
          isSuccess: false,
          isFailure: false,
          isBacktracked: false,
          children: [],
        }

        treeState[nodeId].children.push(excludeNodeId)

        algorithmSteps.push({
          phase: "decision",
          description: `Exclude number ${sortedNumbers[index]} at index ${index}`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: excludeNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })

        generateSteps(index + 1, currentSum, [...currentSubset], excludeNodeId, nodeId)

        treeState[excludeNodeId].isBacktracked = true
      } else {
        algorithmSteps.push({
          phase: "decision",
          description: `Cannot exclude ${sortedNumbers[index]} as the remaining sum would be insufficient`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: nodeId,
          solutions: [...solutions],
        })
      }

      if (parentNodeId) {
        algorithmSteps.push({
          phase: "backtrack",
          description: `Backtracking from index ${index}...`,
          currentIndex: index - 1,
          currentSum: treeState[parentNodeId].sum,
          remainingTarget: targetSum - treeState[parentNodeId].sum,
          currentSubset: [...treeState[parentNodeId].subset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: parentNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })
      }
    }

    generateSteps(0, 0, [], "root", null)

    algorithmSteps.push({
      phase: "complete",
      description:
        solutions.length > 0
          ? `Algorithm complete. Found ${solutions.length} solution(s).`
          : "Algorithm complete. No solutions found.",
      currentIndex: sortedNumbers.length,
      currentSum: 0,
      remainingTarget: targetSum,
      currentSubset: [],
      treeState: JSON.parse(JSON.stringify(treeState)),
      currentNodeId: "root",
      solutions,
    })

    setSteps(algorithmSteps)
    setCurrentStep(0)
  }
  startAlgorithm()
  return { steps: captured, numbersAfter, targetAfter, numbersInputAfter, error }
}
