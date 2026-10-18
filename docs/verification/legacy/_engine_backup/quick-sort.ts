// Step generator for the Quick Sort visualizer.
// Pure function: given an input array, returns every frame the visualizer plays.
// Partition scheme: Lomuto (pivot = last element of the subarray, i starts at start - 1,
// elements <= pivot are moved left, finally the pivot is swapped into position i + 1).

export type QuickSortRange = { start: number; end: number }

export type QuickSortStep = {
  type: "initial" | "pivot-selected" | "partitioning" | "partition-complete" | "recursive-call" | "sorted"
  array: number[]
  pivotIndex?: number
  leftPointer?: number
  rightPointer?: number
  swapping?: [number, number]
  subArrays?: QuickSortRange[]
  activeSubArray?: QuickSortRange
  description: string
}

export function generateQuickSortSteps(input: number[]): QuickSortStep[] {
  const steps: QuickSortStep[] = []
  const arr = [...input]

  steps.push({ type: "initial", array: [...arr], description: "Initial unsorted array" })

  const quickSort = (start: number, end: number, subArrays: QuickSortRange[]): void => {
    if (start >= end) return

    const pivotIndex = end
    const pivotValue = arr[pivotIndex]
    const frame = (extra: Omit<QuickSortStep, "array" | "subArrays" | "activeSubArray">): void => {
      steps.push({ ...extra, array: [...arr], subArrays: [...subArrays], activeSubArray: { start, end } })
    }

    frame({
      type: "pivot-selected",
      pivotIndex,
      description: `Select pivot: ${pivotValue} (last element of the current subarray)`,
    })

    let i = start - 1
    for (let j = start; j < end; j++) {
      frame({
        type: "partitioning",
        pivotIndex,
        leftPointer: i,
        rightPointer: j,
        description: `Compare element ${arr[j]} with pivot ${pivotValue}`,
      })

      if (arr[j] <= pivotValue) {
        i++
        if (i !== j) {
          frame({
            type: "partitioning",
            pivotIndex,
            leftPointer: i,
            rightPointer: j,
            swapping: [i, j],
            description: `Swap ${arr[i]} and ${arr[j]} (smaller element moves left)`,
          })
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          frame({
            type: "partitioning",
            pivotIndex,
            leftPointer: i,
            rightPointer: j,
            description: `After swap: ${arr[i]} and ${arr[j]} have been swapped`,
          })
        } else {
          // fixed caption: the element is on the correct side of the partition, not (in general) in its final position
          frame({
            type: "partitioning",
            pivotIndex,
            leftPointer: i,
            rightPointer: j,
            description: `Element ${arr[j]} ≤ pivot ${pivotValue} is already on the left side, so no swap is needed`,
          })
        }
      }
    }

    i++
    if (i !== end) {
      frame({
        type: "partitioning",
        pivotIndex,
        leftPointer: i,
        rightPointer: end,
        swapping: [i, end],
        description: `Move pivot ${arr[end]} to its final position by swapping with element at position ${i}`,
      })
      ;[arr[i], arr[end]] = [arr[end], arr[i]]
    } else {
      // fixed: the original showed a "swap" of the pivot with itself here
      frame({
        type: "partitioning",
        pivotIndex,
        leftPointer: i,
        rightPointer: end,
        description: `Every other element is ≤ pivot ${pivotValue}, so the pivot stays at position ${i} (no swap needed)`,
      })
    }

    frame({ type: "partitioning", pivotIndex: i, description: `Pivot ${arr[i]} is now in its final sorted position` })

    const p = i
    // fixed caption: with repeated values the left part holds elements equal to the pivot
    frame({
      type: "partition-complete",
      pivotIndex: p,
      description: `Partition complete: elements to the left of ${arr[p]} are ≤ ${arr[p]}, elements to the right are > ${arr[p]}`,
    })

    const left: QuickSortRange = { start, end: p - 1 }
    const right: QuickSortRange = { start: p + 1, end }
    const hasLeft = left.start <= left.end

    const leftSubArrays = [...subArrays]
    if (hasLeft) {
      leftSubArrays.push(left)
      steps.push({
        type: "recursive-call",
        array: [...arr],
        subArrays: [...leftSubArrays],
        activeSubArray: left,
        description: `Recursive call on left subarray [${left.start}...${left.end}]`,
      })
    }
    quickSort(start, p - 1, leftSubArrays)

    if (right.start <= right.end) {
      const rightSubArrays = [...subArrays, right]
      steps.push({
        type: "recursive-call",
        array: [...arr],
        subArrays: [...rightSubArrays],
        activeSubArray: right,
        description: `Recursive call on right subarray [${right.start}...${right.end}]`,
      })
      quickSort(p + 1, end, rightSubArrays)
    }
  }

  quickSort(0, arr.length - 1, [])

  steps.push({ type: "sorted", array: [...arr], description: "Array is now fully sorted" })
  return steps
}
