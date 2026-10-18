// Legacy check for components/selection-sort-visualization.tsx (git HEAD).
// generateSortingSteps below is spliced verbatim from the component (lines 68-174); setSortingSteps captures the result.
import { allArrays, rng, sortedCopy, sameMultiset, Tally } from "../_util_batch5.ts"

interface SortingStep {
  array: number[]
  currentIndex: number
  minIndex: number
  comparingIndex: number | null
  sortedUpTo: number
  description: string
  isSwapping: boolean
}
let captured: SortingStep[] = []
const setSortingSteps = (s: SortingStep[]) => { captured = s }
  const generateSortingSteps = (inputArray: number[]) => {
    const steps: SortingStep[] = []
    const arr = [...inputArray]

    // Initial state
    steps.push({
      array: [...arr],
      currentIndex: 0,
      minIndex: 0,
      comparingIndex: null,
      sortedUpTo: -1,
      description: "Starting Selection Sort. We'll find the minimum element and place it at the beginning.",
      isSwapping: false,
    })

    // Selection sort algorithm
    for (let i = 0; i < arr.length - 1; i++) {
      let minIndex = i

      // Start looking for minimum
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex: minIndex,
        comparingIndex: null,
        sortedUpTo: i - 1,
        description: `Looking for the minimum element in the unsorted portion starting at index ${i}.`,
        isSwapping: false,
      })

      // Find the minimum element
      for (let j = i + 1; j < arr.length; j++) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: minIndex,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Comparing ${arr[j]} with current minimum ${arr[minIndex]}.`,
          isSwapping: false,
        })

        if (arr[j] < arr[minIndex]) {
          minIndex = j

          steps.push({
            array: [...arr],
            currentIndex: i,
            minIndex: minIndex,
            comparingIndex: null,
            sortedUpTo: i - 1,
            description: `Found a new minimum: ${arr[minIndex]} at index ${minIndex}.`,
            isSwapping: false,
          })
        }
      }

      // Swap if needed
      if (minIndex !== i) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: minIndex,
          comparingIndex: null,
          sortedUpTo: i - 1,
          description: `Swapping ${arr[i]} with the minimum value ${arr[minIndex]}.`,
          isSwapping: true,
        })

        // Perform the swap
        ;[arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]

        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: i,
          comparingIndex: null,
          sortedUpTo: i,
          description: `Placed ${arr[i]} at position ${i}. This element is now in its correct sorted position.`,
          isSwapping: false,
        })
      } else {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: i,
          comparingIndex: null,
          sortedUpTo: i,
          description: `${arr[i]} is already the minimum, so it stays at position ${i}.`,
          isSwapping: false,
        })
      }
    }

    // Final state
    steps.push({
      array: [...arr],
      currentIndex: arr.length - 1,
      minIndex: arr.length - 1,
      comparingIndex: null,
      sortedUpTo: arr.length - 1,
      description: "Array is now sorted using Selection Sort!",
      isSwapping: false,
    })

    setSortingSteps(steps)
  }

function check(input: number[]): string[] {
  const d: string[] = []
  try { generateSortingSteps(input) } catch (e) { return ["crash: " + (e as Error).message] }
  const steps = captured
  const n = input.length
  const target = sortedCopy(input)
  if (steps[steps.length - 1].array.join() !== target.join()) d.push("final frame not sorted")
  let cmp = 0
  for (const s of steps) {
    if (!sameMultiset(s.array, input)) d.push("frame loses/invents elements")
    for (const k of [s.currentIndex, s.minIndex]) if (k < 0 || k >= n) d.push("index out of range")
    if (s.comparingIndex !== null) {
      cmp++
      if (s.comparingIndex <= s.currentIndex || s.comparingIndex >= n) d.push("comparing index outside unsorted part")
      // minIndex must hold the minimum of arr[currentIndex .. comparingIndex-1]
      const seg = s.array.slice(s.currentIndex, s.comparingIndex)
      if (s.array[s.minIndex] !== Math.min(...seg)) d.push("minIndex is not the running minimum")
    }
    for (let k = 0; k <= s.sortedUpTo; k++) if (s.array[k] !== target[k]) d.push("sorted prefix not final")
    if (s.isSwapping && s.minIndex === s.currentIndex) d.push("self-swap frame")
  }
  if (cmp !== (n * (n - 1)) / 2) d.push("comparison frames != n(n-1)/2")
  return d
}

const ui = new Tally()
const r = rng(2024)
for (let t = 0; t < 20000; t++) { const len = Math.floor(r() * 6) + 5; const a = Array.from({ length: len }, () => Math.floor(r() * 50) + 1); ui.record(a, check(a)) }
ui.report("UI Random Array button (5..10 values in 1..50), 20000 draws (the component has no default array)")
const ex = new Tally()
for (let len = 1; len <= 7; len++) for (const a of allArrays(len, [-2, -1, 0, 1, 2])) ex.record(a, check(a))
ex.report("exhaustive, lengths 1..7 over {-2..2}")
const rr = new Tally()
const r2 = rng(8)
for (let t = 0; t < 20000; t++) { const len = 1 + Math.floor(r2() * 20); const a = Array.from({ length: len }, () => (r2() < 0.5 ? Math.floor(r2() * 11) - 5 : Math.round((r2() * 200 - 100) * 10) / 10)); rr.record(a, check(a)) }
rr.report("random, lengths 1..20 (no length limit in the UI), integers and decimals (20000)")
