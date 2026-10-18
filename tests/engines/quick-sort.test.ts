import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateQuickSortSteps, type QuickSortStep } from "@/lib/engines/quick-sort"
import { multiset, sorted } from "../reference"
import { lomutoQuickSort } from "../reference/quick-sort"

// inputs the UI accepts: 2..10 integers in 1..9 (duplicates are very common)
const uiArrays = fc.array(fc.integer({ min: 1, max: 9 }), { minLength: 2, maxLength: 10 })
// wider: the engine itself, incl. negatives, zero, 0/1 elements
const anyArrays = fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 0, maxLength: 12 })

const sameMultiset = (x: number[], y: number[]) => JSON.stringify(multiset(x)) === JSON.stringify(multiset(y))

// every structural problem of one frame (plain checks, one expect per input keeps the run fast)
function frameProblems(s: QuickSortStep, input: number[]): string[] {
  const p: string[] = []
  const n = input.length
  if (!sameMultiset(s.array, input)) p.push("elements lost or invented")
  for (const k of [s.pivotIndex, s.rightPointer, ...(s.swapping ?? [])]) if (k !== undefined && (k < 0 || k >= n)) p.push(`index ${k} outside array`)
  for (const r of [...(s.subArrays ?? []), ...(s.activeSubArray ? [s.activeSubArray] : [])])
    if (r.start < 0 || r.end >= n || r.start > r.end) p.push(`bad range ${r.start}..${r.end}`)
  const a = s.activeSubArray
  if (a) {
    const inside = (k: number) => k >= a.start && k <= a.end
    if (s.rightPointer !== undefined && !inside(s.rightPointer)) p.push("j outside active subarray")
    // Lomuto's i starts at start - 1 (the empty "<= pivot" region) and never passes end
    if (s.leftPointer !== undefined && (s.leftPointer < a.start - 1 || s.leftPointer > a.end)) p.push("i outside [start-1, end]")
    if (s.pivotIndex !== undefined && !inside(s.pivotIndex)) p.push("pivot outside active subarray")
    for (const k of s.swapping ?? []) if (!inside(k)) p.push("swap outside active subarray")
  }
  if (s.swapping && s.swapping[0] === s.swapping[1]) p.push("self-swap shown as a swap")
  return p
}

describe("quick sort engine (Lomuto)", () => {
  it("ends with a 'sorted' frame equal to the sorted input", () => {
    fc.assert(fc.property(anyArrays, (a) => {
      const steps = generateQuickSortSteps(a)
      expect(steps[0].type).toBe("initial")
      expect(steps[0].array).toEqual(a)
      const last = steps[steps.length - 1]
      expect(last.type).toBe("sorted")
      expect(last.array).toEqual(sorted(a))
    }), { numRuns: 5000 })
  })

  it("never loses or invents elements and every index points inside the array / active subarray", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      expect(generateQuickSortSteps(a).flatMap((s) => frameProblems(s, a))).toEqual([])
    }), { numRuns: 3000 })
  })

  it("matches the independent Lomuto oracle: same partitions, comparisons and exchanges", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const steps = generateQuickSortSteps(a)
      const ref = lomutoQuickSort(a)
      expect(steps.filter((s) => s.description.startsWith("Compare element")).length).toBe(ref.comparisons)
      expect(steps.filter((s) => s.swapping).length).toBe(ref.exchanges)
      const parts = steps.filter((s) => s.type === "partition-complete")
        .map((s) => ({ p: s.activeSubArray!.start, r: s.activeSubArray!.end, q: s.pivotIndex! }))
      expect(parts).toEqual(ref.partitions)
    }), { numRuns: 3000 })
  })

  it("keeps the Lomuto loop invariant on every comparison frame", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const bad: string[] = []
      for (const s of generateQuickSortSteps(a)) {
        if (!s.description.startsWith("Compare element")) continue
        const { start, end } = s.activeSubArray!
        const i = s.leftPointer!, j = s.rightPointer!, x = s.array[end]
        if (s.pivotIndex !== end) bad.push("pivot is not the last element")
        for (let k = start; k <= i; k++) if (s.array[k] > x) bad.push(`A[${k}] > pivot inside the <= region`)
        for (let k = i + 1; k < j; k++) if (s.array[k] <= x) bad.push(`A[${k}] <= pivot inside the > region`)
        if (s.description !== `Compare element ${s.array[j]} with pivot ${x}`) bad.push("caption: " + s.description)
      }
      expect(bad).toEqual([])
    }), { numRuns: 3000 })
  })

  it("partition-complete frames satisfy the partition invariant, place the pivot finally and say so truthfully", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const target = sorted(a)
      const bad: string[] = []
      for (const s of generateQuickSortSteps(a)) {
        if (s.type !== "partition-complete") continue
        const { start, end } = s.activeSubArray!
        const q = s.pivotIndex!, x = s.array[q]
        for (let k = start; k < q; k++) if (s.array[k] > x) bad.push(`left A[${k}] > pivot`)
        for (let k = q + 1; k <= end; k++) if (s.array[k] <= x) bad.push(`right A[${k}] <= pivot`)
        if (x !== target[q]) bad.push("pivot not at its final sorted position")
        if (s.description !== `Partition complete: elements to the left of ${x} are ≤ ${x}, elements to the right are > ${x}`) bad.push("caption")
      }
      expect(bad).toEqual([])
    }), { numRuns: 3000 })
  })

  it("captions agree with the frame they describe", () => {
    fc.assert(fc.property(uiArrays, (a) => {
      const steps = generateQuickSortSteps(a)
      const bad: string[] = []
      steps.forEach((s, k) => {
        const next = steps[k + 1]
        if (s.description.startsWith("Swap ")) {
          const [i, j] = s.swapping!
          if (s.description !== `Swap ${s.array[i]} and ${s.array[j]} (smaller element moves left)`) bad.push("swap caption values")
          if (!(s.array[j] < s.array[i])) bad.push("'smaller element moves left' is false")
          if (next.array[i] !== s.array[j] || next.array[j] !== s.array[i]) bad.push("next frame does not show the swap")
        }
        if (s.description.includes("already on the left side")) {
          if (s.leftPointer !== s.rightPointer) bad.push("'no swap needed' but i != j")
          if (s.array[s.rightPointer!] > s.array[s.pivotIndex!]) bad.push("'<= pivot' is false")
        }
        if (s.description.startsWith("Move pivot")) {
          if (JSON.stringify(s.swapping) !== JSON.stringify([s.leftPointer, s.activeSubArray!.end])) bad.push("pivot move highlights wrong books")
          if (next.pivotIndex !== s.leftPointer) bad.push("pivot not at i afterwards")
        }
        if (s.description.includes("so the pivot stays")) {
          if (s.leftPointer !== s.activeSubArray!.end) bad.push("'pivot stays' but i != end")
        }
        if (s.type === "recursive-call") {
          const r = s.activeSubArray!
          const top = s.subArrays![s.subArrays!.length - 1]
          if (top.start !== r.start || top.end !== r.end) bad.push("active call is not on top of the call stack")
          // a call on >= 2 elements starts by selecting its pivot; size-1 calls return at once
          if (r.end > r.start && (next.type !== "pivot-selected" || next.activeSubArray!.start !== r.start || next.activeSubArray!.end !== r.end)) bad.push("call not followed by its pivot selection")
        }
      })
      expect(bad).toEqual([])
    }), { numRuns: 2000 })
  })

  it("handles the default example", () => {
    const steps = generateQuickSortSteps([8, 3, 5, 4, 7, 6, 1, 2])
    expect(steps[steps.length - 1].array).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})
