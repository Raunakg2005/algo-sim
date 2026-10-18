// Legacy check for components/heap-sort-visualizer.tsx (git HEAD).
// generateHeapSortSteps below is spliced verbatim from `git show HEAD:components/heap-sort-visualizer.tsx` (lines 98-248).
import { allArrays, rng, sortedCopy, sameMultiset, Tally } from "../_util_batch5.ts"

type SortingStep = {
  type: "initial" | "build-heap" | "heapify" | "extract-max" | "sorted"
  array: number[]
  heapSize: number
  comparing?: [number, number]
  swapping?: [number, number]
  currentNodeIndex?: number
  extractedIndex?: number
  sortedIndices?: number[]
  description: string
}
  const generateHeapSortSteps = (arr: number[]) => {
    const steps: SortingStep[] = []
    const arrCopy = [...arr]
    const n = arrCopy.length

    steps.push({
      type: "initial",
      array: [...arrCopy],
      heapSize: n,
      description: "Initial unsorted array",
    })

    const getParentIndex = (i: number) => Math.floor((i - 1) / 2)
    const getLeftChildIndex = (i: number) => 2 * i + 1
    const getRightChildIndex = (i: number) => 2 * i + 2

    const heapify = (arr: number[], n: number, i: number, sortedIndices: number[] = []) => {
      let largest = i
      const left = getLeftChildIndex(i)
      const right = getRightChildIndex(i)

      if (left < n) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          comparing: [largest, left],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Compare node ${arr[largest]} with its left child ${arr[left]}`,
        })

        if (arr[left] > arr[largest]) {
          largest = left
        }
      }

      if (right < n) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          comparing: [largest, right],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Compare node ${arr[largest]} with its right child ${arr[right]}`,
        })

        if (arr[right] > arr[largest]) {
          largest = right
        }
      }

      if (largest !== i) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          swapping: [i, largest],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Swap ${arr[i]} with ${arr[largest]} to maintain max-heap property`,
        })

        ;[arr[i], arr[largest]] = [arr[largest], arr[i]]

        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          currentNodeIndex: largest,
          sortedIndices: [...sortedIndices],
          description: `Continue heapify at node ${arr[largest]}`,
        })

        heapify(arr, n, largest, sortedIndices)
      }
    }

    steps.push({
      type: "build-heap",
      array: [...arrCopy],
      heapSize: n,
      description: "Start building max heap",
    })

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      steps.push({
        type: "build-heap",
        array: [...arrCopy],
        heapSize: n,
        currentNodeIndex: i,
        description: `Heapify starting from node at index ${i}`,
      })

      heapify(arrCopy, n, i)
    }

    steps.push({
      type: "build-heap",
      array: [...arrCopy],
      heapSize: n,
      description: "Max heap built successfully",
    })

    const sortedIndices: number[] = []
    for (let i = n - 1; i > 0; i--) {
      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i + 1,
        swapping: [0, i],
        sortedIndices: [...sortedIndices],
        description: `Extract max element ${arrCopy[0]} and place it at the end`,
      })
      ;[arrCopy[0], arrCopy[i]] = [arrCopy[i], arrCopy[0]]
      sortedIndices.push(i)

      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i,
        extractedIndex: i,
        sortedIndices: [...sortedIndices],
        description: `Element ${arrCopy[i]} is now in its sorted position`,
      })

      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i,
        currentNodeIndex: 0,
        sortedIndices: [...sortedIndices],
        description: "Re-heapify the reduced heap",
      })

      heapify(arrCopy, i, 0, sortedIndices)
    }

    sortedIndices.push(0)

    steps.push({
      type: "sorted",
      array: [...arrCopy],
      heapSize: 0,
      sortedIndices: sortedIndices,
      description: "Array is now fully sorted",
    })

    return steps
  }

const isMaxHeap = (a: number[], n: number) => { for (let k = 1; k < n; k++) if (a[Math.floor((k - 1) / 2)] < a[k]) return false; return true }

function check(input: number[]): string[] {
  const d: string[] = []
  let steps: SortingStep[]
  try { steps = generateHeapSortSteps(input) } catch (e) { return ["crash: " + (e as Error).message] }
  const last = steps[steps.length - 1]
  if (last.array.join() !== sortedCopy(input).join()) d.push("final frame not sorted")
  for (const s of steps) if (!sameMultiset(s.array, input)) { d.push("frame loses/invents elements"); break }
  for (const s of steps) {
    if (s.description === "Max heap built successfully" && !isMaxHeap(s.array, s.heapSize)) d.push("heap property broken after build")
    if (s.type === "extract-max" && s.swapping && !isMaxHeap(s.array, s.heapSize)) d.push("heap property broken before extraction")
    for (const k of [...(s.comparing ?? []), ...(s.swapping ?? [])]) if (k < 0 || k >= s.heapSize) d.push("highlighted index outside heap")
    const m = /^Compare node (\S+) with its (left|right) child (\S+)$/.exec(s.description)
    if (m && s.comparing) {
      const [p, c] = s.comparing
      const ok = m[2] === "left" ? c === 2 * p + 1 : c === 2 * p + 2
      if (!ok) d.push(`caption 'Compare node X with its ${m[2]} child' false (X is the left sibling, not the parent)`)
    }
  }
  return d
}

const ui = new Tally()
const def = [8, 3, 5, 4, 7, 6, 1, 2]
ui.record(def, check(def)); console.log("default example defects:", check(def))
const r = rng(4242)
for (let t = 0; t < 20000; t++) { const a = Array.from({ length: 10 }, () => Math.floor(r() * 9) + 1); ui.record(a, check(a)) }
ui.report("UI Random button (10 values in 1..9), 20000 draws + default")

const ex = new Tally()
const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9]
for (let len = 2; len <= 5; len++) for (const a of allArrays(len, vals)) ex.record(a, check(a))
ex.report("exhaustive, lengths 2..5 over 1..9")
const rr = new Tally()
const r2 = rng(99)
for (let t = 0; t < 20000; t++) { const len = 6 + Math.floor(r2() * 25); const a = Array.from({ length: len }, () => Math.floor(r2() * 9) + 1); rr.record(a, check(a)) }
rr.report("random, lengths 6..30 over 1..9 (no upper length limit in the UI) (20000)")
