// Legacy check for components/insertion-sort-visualization.tsx (git HEAD).
// generateSortingSteps below is spliced verbatim from the component (lines 83-197); setSortingSteps captures the result.
import { allArrays, rng, sortedCopy, Tally } from "../_util_batch5.ts"

interface SortingStep {
  array: number[]
  currentIndex: number
  comparingIndex: number | null
  sortedUpTo: number
  description: string
  isSwapping: boolean
  activeCodeLine: number
}
let captured: SortingStep[] = []
const setSortingSteps = (s: SortingStep[]) => { captured = s }
  const generateSortingSteps = (inputArray: number[]) => {
    const steps: SortingStep[] = []
    const arr = [...inputArray]

    steps.push({
      array: [...arr],
      currentIndex: 1,
      comparingIndex: null,
      sortedUpTo: 0,
      description: "Starting with the first element as sorted.",
      isSwapping: false,
      activeCodeLine: 2, 
    })

    for (let i = 1; i < arr.length; i++) {
      const key = arr[i]

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: null,
        sortedUpTo: i - 1,
        description: `Taking element ${key} to insert into the sorted portion.`,
        isSwapping: false,
        activeCodeLine: 4,
      })

      let j = i - 1

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: j,
        sortedUpTo: i - 1,
        description: `Setting j = ${j} (position before current element).`,
        isSwapping: false,
        activeCodeLine: 6, 
      })

      if (arr[j] <= key) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i,
          description: `Comparing ${key} with ${arr[j]}. ${key} is already in the correct position.`,
          isSwapping: false,
          activeCodeLine: 8, 
        })
        continue
      }

      while (j >= 0 && arr[j] > key) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Comparing ${key} with ${arr[j]}. ${arr[j]} is greater, so we need to shift it right.`,
          isSwapping: false,
          activeCodeLine: 8, 
        })

        arr[j + 1] = arr[j]

        steps.push({
          array: [...arr],
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Shifted ${arr[j]} one position to the right.`,
          isSwapping: true,
          activeCodeLine: 9, 
        })

        j--

        if (j >= 0) {
          steps.push({
            array: [...arr],
            currentIndex: i,
            comparingIndex: j,
            sortedUpTo: i - 1,
            description: `Decremented j to ${j}.`,
            isSwapping: false,
            activeCodeLine: 10, 
          })
        }
      }

      arr[j + 1] = key

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: null,
        sortedUpTo: i,
        description: `Inserted ${key} at position ${j + 1}.`,
        isSwapping: false,
        activeCodeLine: 12, 
      })
    }

    steps.push({
      array: [...arr],
      currentIndex: arr.length,
      comparingIndex: null,
      sortedUpTo: arr.length - 1,
      description: "Array is now sorted using Insertion Sort!",
      isSwapping: false,
      activeCodeLine: 13, 
    })

    setSortingSteps(steps)
  }

// key comparisons made by textbook insertion sort (while j >= 0 and arr[j] > key)
function comparisons(a0: number[]): number {
  const a = [...a0]; let c = 0
  for (let i = 1; i < a.length; i++) { const key = a[i]; let j = i - 1
    while (j >= 0) { c++; if (a[j] > key) { a[j + 1] = a[j]; j-- } else break }
    a[j + 1] = key }
  return c
}
// control-flow edges of the displayed pseudocode (line numbers = index into algorithmCode)
const EDGES = new Set(["2>4", "2>13", "4>6", "6>8", "8>9", "8>12", "8>4", "8>13", "9>10", "10>8", "10>12", "12>4", "12>13"])

function check(input: number[]): string[] {
  const d: string[] = []
  try { generateSortingSteps(input) } catch (e) { return ["crash: " + (e as Error).message] }
  const steps = captured
  const n = input.length
  if (steps[steps.length - 1].array.join() !== sortedCopy(input).join()) d.push("final frame not sorted")
  const cmpFrames = steps.filter((s) => s.activeCodeLine === 8).length
  if (cmpFrames !== comparisons(input)) d.push("a key comparison has no frame (loop exit test arr[j] <= key after a shift is never shown)")
  for (let k = 1; k < steps.length; k++) {
    const e = `${steps[k - 1].activeCodeLine}>${steps[k].activeCodeLine}`
    if (!EDGES.has(e)) d.push(`highlighted code line jumps ${e.replace(">", " -> ")} (not a path through the pseudocode)`)
  }
  for (const s of steps) {
    if (s.comparingIndex !== null && (s.comparingIndex < 0 || s.comparingIndex >= n)) d.push("comparingIndex out of range")
    if (s.currentIndex < 0 || s.currentIndex > n) d.push("currentIndex out of range")
    if (s.currentIndex === n && s !== steps[steps.length - 1] && s !== steps[0]) d.push("currentIndex past end mid-run")
  }
  return d
}

const ui = new Tally()
const r = rng(2025)
for (let t = 0; t < 20000; t++) { const len = Math.floor(r() * 6) + 5; const a = Array.from({ length: len }, () => Math.floor(r() * 50) + 1); ui.record(a, check(a)) }
ui.report("UI Random Array button (5..10 values in 1..50), 20000 draws (the component has no default array)")
const ex = new Tally()
for (let len = 1; len <= 7; len++) for (const a of allArrays(len, [-2, -1, 0, 1, 2])) ex.record(a, check(a))
ex.report("exhaustive, lengths 1..7 over {-2..2}")
const rr = new Tally()
const r2 = rng(9)
for (let t = 0; t < 20000; t++) { const len = 1 + Math.floor(r2() * 20); const a = Array.from({ length: len }, () => (r2() < 0.5 ? Math.floor(r2() * 11) - 5 : Math.round((r2() * 200 - 100) * 10) / 10)); rr.record(a, check(a)) }
rr.report("random, lengths 1..20 (no length limit in the UI), integers and decimals (20000)")
