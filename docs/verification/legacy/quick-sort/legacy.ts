// Legacy check for components/quick-sort-visualization.tsx (git HEAD).
// generateQuickSortSteps is copied verbatim from the component (it was already a pure inner function).
import { allArrays, rng, sortedCopy, sameMultiset, Tally } from "../_util_batch5.ts"

type SortingStep = {
  type: "initial" | "pivot-selected" | "partitioning" | "partition-complete" | "recursive-call" | "sorted"
  array: number[]
  pivotIndex?: number
  leftPointer?: number
  rightPointer?: number
  swapping?: [number, number]
  subArrays?: { start: number; end: number }[]
  activeSubArray?: { start: number; end: number }
  description: string
}

  const generateQuickSortSteps = (arr: number[]) => {
    const steps: SortingStep[] = []
    const arrCopy = [...arr]

    steps.push({
      type: "initial",
      array: [...arrCopy],
      description: "Initial unsorted array",
    })

    const quickSort = (arr: number[], start: number, end: number, subArrays: { start: number; end: number }[]) => {
      if (start >= end) {
        return
      }

      const pivotIndex = end
      const pivotValue = arr[pivotIndex]

      steps.push({
        type: "pivot-selected",
        array: [...arr],
        pivotIndex,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Select pivot: ${pivotValue} (last element of the current subarray)`,
      })

      let i = start - 1

      for (let j = start; j < end; j++) {
        steps.push({
          type: "partitioning",
          array: [...arr],
          pivotIndex,
          leftPointer: i,
          rightPointer: j,
          subArrays: [...subArrays],
          activeSubArray: { start, end },
          description: `Compare element ${arr[j]} with pivot ${pivotValue}`,
        })

        if (arr[j] <= pivotValue) {
          i++

          if (i !== j) {
            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              swapping: [i, j],
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `Swap ${arr[i]} and ${arr[j]} (smaller element moves left)`,
            })

            ;[arr[i], arr[j]] = [arr[j], arr[i]]

            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `After swap: ${arr[i]} and ${arr[j]} have been swapped`,
            })
          } else {
            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `Element ${arr[j]} is already in the correct position`,
            })
          }
        }
      }

      i++
      steps.push({
        type: "partitioning",
        array: [...arr],
        pivotIndex,
        leftPointer: i,
        rightPointer: end,
        swapping: [i, end],
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Move pivot ${arr[end]} to its final position by swapping with element at position ${i}`,
      })
      ;[arr[i], arr[end]] = [arr[end], arr[i]]

      steps.push({
        type: "partitioning",
        array: [...arr],
        pivotIndex: i,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Pivot ${arr[i]} is now in its final sorted position`,
      })

      const newPivotIndex = i
      steps.push({
        type: "partition-complete",
        array: [...arr],
        pivotIndex: newPivotIndex,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Partition complete: elements to the left of ${arr[newPivotIndex]} are smaller, elements to the right are larger`,
      })

      const leftSubArray = { start, end: newPivotIndex - 1 }
      const rightSubArray = { start: newPivotIndex + 1, end }

      const newSubArrays = [...subArrays]
      if (leftSubArray.start <= leftSubArray.end) {
        newSubArrays.push(leftSubArray)
        steps.push({
          type: "recursive-call",
          array: [...arr],
          subArrays: [...newSubArrays],
          activeSubArray: leftSubArray,
          description: `Recursive call on left subarray [${leftSubArray.start}...${leftSubArray.end}]`,
        })
      }

      quickSort(arr, start, newPivotIndex - 1, newSubArrays)

      if (rightSubArray.start <= rightSubArray.end) {
        const rightSubArrays = [...newSubArrays]
        if (leftSubArray.start <= leftSubArray.end) {
          rightSubArrays.pop()
        }
        rightSubArrays.push(rightSubArray)
        steps.push({
          type: "recursive-call",
          array: [...arr],
          subArrays: [...rightSubArrays],
          activeSubArray: rightSubArray,
          description: `Recursive call on right subarray [${rightSubArray.start}...${rightSubArray.end}]`,
        })

        quickSort(arr, newPivotIndex + 1, end, rightSubArrays)
      }
    }

    quickSort(arrCopy, 0, arrCopy.length - 1, [])

    steps.push({
      type: "sorted",
      array: [...arrCopy],
      description: "Array is now fully sorted",
    })

    return steps
  }

// ---------------------------------------------------------------- checks
function check(input: number[]): string[] {
  const d: string[] = []
  let steps: SortingStep[]
  try { steps = generateQuickSortSteps(input) } catch (e) { return ["crash: " + (e as Error).message] }
  const last = steps[steps.length - 1]
  const target = sortedCopy(input)
  if (last.array.join() !== target.join()) d.push("final frame not sorted")
  for (const s of steps) if (!sameMultiset(s.array, input)) { d.push("frame loses/invents elements"); break }
  for (const s of steps) {
    const a = s.activeSubArray
    if (s.type === "partition-complete" && a) {
      const p = s.pivotIndex!, pv = s.array[p]
      for (let k = a.start; k < p; k++) if (s.array[k] > pv) d.push("partition invariant broken (left > pivot)")
      for (let k = p + 1; k <= a.end; k++) if (s.array[k] <= pv) d.push("partition invariant broken (right <= pivot)")
      // caption: "elements to the left of p are smaller, elements to the right are larger"
      for (let k = a.start; k < p; k++) if (s.array[k] === pv) { d.push("caption 'left elements are smaller' false (left part holds a copy of the pivot)"); break }
    }
    if (s.description.includes("already in the correct position")) {
      const j = s.rightPointer!
      if (s.array[j] !== target[j]) d.push("caption 'already in the correct position' false (element not at its final sorted position)")
    }
    if (s.swapping && s.swapping[0] === s.swapping[1]) d.push("swap frame swaps an element with itself (pivot already in place)")
    if (s.leftPointer !== undefined && a && s.leftPointer < a.start) {
      if (s.leftPointer >= 0) d.push("note: leftPointer i = start-1 highlights a book outside the active subarray")
    }
  }
  return d
}

// (a) UI inputs: default example and the Random button (8 values 1..9)
const ui = new Tally()
ui.record([8, 3, 5, 4, 7, 6, 1, 2], check([8, 3, 5, 4, 7, 6, 1, 2]))
console.log("default example defects:", check([8, 3, 5, 4, 7, 6, 1, 2]))
const r = rng(12345)
for (let t = 0; t < 20000; t++) {
  const a = Array.from({ length: 8 }, () => Math.floor(r() * 9) + 1)
  ui.record(a, check(a))
}
ui.report("UI Random button (8 values in 1..9), 20000 draws + default")

// (b) everything validation accepts: 2..10 integers in 1..9
const ex = new Tally()
const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9]
for (let len = 2; len <= 5; len++) for (const a of allArrays(len, vals)) ex.record(a, check(a))
ex.report("exhaustive, lengths 2..5 over 1..9")
const rr = new Tally()
const r2 = rng(777)
for (let t = 0; t < 30000; t++) {
  const len = 6 + Math.floor(r2() * 5)
  const a = Array.from({ length: len }, () => Math.floor(r2() * 9) + 1)
  rr.record(a, check(a))
}
rr.report("random, lengths 6..10 over 1..9 (30000)")
