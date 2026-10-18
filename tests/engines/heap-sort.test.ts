import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateHeapSortSteps, type HeapSortStep } from "@/lib/engines/heap-sort"
import { multiset, sorted } from "../reference"
import { heapSortTrace, isMaxHeap } from "../reference/heap-sort"

// inputs the UI accepts: >= 2 integers in 1..9 (no upper length limit; the Random button makes 10)
const uiArrays = fc.array(fc.integer({ min: 1, max: 9 }), { minLength: 2, maxLength: 31 })
const anyArrays = fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 0, maxLength: 20 })

const sameMultiset = (x: number[], y: number[]) => JSON.stringify(multiset(x)) === JSON.stringify(multiset(y))
const isChild = (p: number, c: number) => c === 2 * p + 1 || c === 2 * p + 2
const isSiblingPair = (x: number, y: number) => x > 0 && y === x + 1 && x % 2 === 1

function frameProblems(s: HeapSortStep, input: number[]): string[] {
  const p: string[] = []
  const n = input.length
  if (!sameMultiset(s.array, input)) p.push("elements lost or invented")
  if (s.heapSize < 0 || s.heapSize > n) p.push("heapSize out of range")
  for (const k of [...(s.comparing ?? []), ...(s.swapping ?? [])]) if (k < 0 || k >= s.heapSize) p.push(`highlight ${k} outside heap`)
  if (s.currentNodeIndex !== undefined && (s.currentNodeIndex < 0 || s.currentNodeIndex >= s.heapSize)) p.push("current node outside heap")
  if (s.comparing) {
    const [x, y] = s.comparing
    if (!isChild(x, y) && !isSiblingPair(x, y)) p.push(`compares unrelated nodes ${x},${y}`)
  }
  if (s.type === "heapify" && s.swapping && !isChild(s.swapping[0], s.swapping[1])) p.push("heapify swaps non parent/child")
  // the books marked "sorted" are exactly the ones outside the heap, and they hold their final values
  if (s.sortedIndices) {
    const marked = [...s.sortedIndices].sort((x, y) => x - y)
    const outside = Array.from({ length: n - s.heapSize }, (_, t) => s.heapSize + t)
    if (JSON.stringify(marked) !== JSON.stringify(outside)) p.push("sortedIndices != indices outside the heap")
    const target = sorted(input)
    for (let k = s.heapSize; k < n; k++) if (s.array[k] !== target[k]) p.push(`sorted suffix wrong at ${k}`)
  }
  return p
}

describe("heap sort engine", () => {
  it("ends with a 'sorted' frame equal to the sorted input, every index marked sorted", () => {
    fc.assert(fc.property(anyArrays, (a) => {
      const steps = generateHeapSortSteps(a)
      const last = steps[steps.length - 1]
      expect(steps[0].array).toEqual(a)
      expect(last.type).toBe("sorted")
      expect(last.array).toEqual(sorted(a))
      expect([...last.sortedIndices!].sort((x, y) => x - y)).toEqual(a.map((_, k) => k))
    }), { numRuns: 4000 })
  })

  it("every frame preserves the data, highlights only nodes inside the heap and related nodes", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      expect(generateHeapSortSteps(a).flatMap((s) => frameProblems(s, a))).toEqual([])
    }), { numRuns: 1500 })
  })

  it("has a max heap after the build phase and before every extraction", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const steps = generateHeapSortSteps(a)
      const built = steps.find((s) => s.description === "Max heap built successfully")!
      expect(isMaxHeap(built.array, built.heapSize)).toBe(true)
      expect(built.array).toEqual(heapSortTrace(a).builtHeap)
      const extracts = steps.filter((s) => s.type === "extract-max" && s.swapping)
      expect(extracts.length).toBe(a.length - 1)
      for (const s of extracts) {
        expect(isMaxHeap(s.array, s.heapSize)).toBe(true)
        expect(s.swapping).toEqual([0, s.heapSize - 1])
        expect(s.description).toBe(`Extract max element ${s.array[0]} and place it at the end`)
      }
    }), { numRuns: 2000 })
  })

  it("matches the independent CLRS oracle: same comparisons and exchanges", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const steps = generateHeapSortSteps(a)
      const ref = heapSortTrace(a)
      expect(steps.filter((s) => s.comparing).length).toBe(ref.comparisons)
      expect(steps.filter((s) => s.swapping).length).toBe(ref.exchanges)
    }), { numRuns: 2000 })
  })

  it("comparison and swap captions name the right nodes and relationships", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const bad: string[] = []
      const steps = generateHeapSortSteps(a)
      steps.forEach((s, k) => {
        if (s.comparing) {
          const [x, y] = s.comparing
          const node = s.currentNodeIndex!
          if (y === 2 * node + 1) {
            if (x !== node || s.description !== `Compare node ${s.array[x]} with its left child ${s.array[y]}`) bad.push("left: " + s.description)
          } else if (y === 2 * node + 2) {
            if (x === node) {
              if (s.description !== `Compare node ${s.array[x]} with its right child ${s.array[y]}`) bad.push("right: " + s.description)
            } else if (x === 2 * node + 1) {
              if (s.array[x] <= s.array[node]) bad.push("left child shown as larger but is not")
              if (s.description !== `Left child ${s.array[x]} is larger than node ${s.array[node]}; compare it with the right child ${s.array[y]}`) bad.push("sibling: " + s.description)
            } else bad.push("compared node is neither the parent nor its left child")
          } else bad.push("compared index is not a child of the current node")
        }
        if (s.type === "heapify" && s.swapping) {
          const [i, c] = s.swapping
          const next = steps[k + 1]
          if (s.description !== `Swap ${s.array[i]} with ${s.array[c]} to maintain max-heap property`) bad.push("swap caption")
          if (!(s.array[c] > s.array[i])) bad.push("swap of a child that is not larger")
          if (next.array[i] !== s.array[c] || next.array[c] !== s.array[i] || next.currentNodeIndex !== c) bad.push("next frame does not show the swap")
        }
      })
      expect(bad).toEqual([])
    }), { numRuns: 2000 })
  })

  it("handles the default example", () => {
    const steps = generateHeapSortSteps([8, 3, 5, 4, 7, 6, 1, 2])
    expect(steps[steps.length - 1].array).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})
