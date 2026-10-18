import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateSelectionSortSteps, type SelectionSortStep } from "@/lib/engines/selection-sort"
import { multiset, sorted } from "../reference"
import { selectionSortTrace } from "../reference/selection-sort"

// inputs the UI accepts: >= 1 finite numbers, no length or value limit; the Random button makes 5..10 values in 1..50
const value = fc.oneof(fc.integer({ min: -5, max: 5 }), fc.integer({ min: 1, max: 50 }), fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }).map((x) => x + 0)) // +0 turns -0 into 0 (identical on screen)
const arrays = fc.array(value, { minLength: 1, maxLength: 20 })

const sameMultiset = (x: number[], y: number[]) => JSON.stringify(multiset(x)) === JSON.stringify(multiset(y))

function frameProblems(s: SelectionSortStep, a: number[], target: number[]): string[] {
  const p: string[] = []
  const n = a.length
  if (!sameMultiset(s.array, a)) p.push("elements lost or invented")
  for (const k of [s.currentIndex, s.minIndex]) if (k < 0 || k >= n) p.push(`index ${k} out of range`)
  if (s.sortedUpTo < -1 || s.sortedUpTo >= n) p.push("sortedUpTo out of range")
  // the green prefix holds its final values
  for (let k = 0; k <= s.sortedUpTo; k++) if (s.array[k] !== target[k]) p.push(`sorted prefix wrong at ${k}`)
  if (s.minIndex < s.currentIndex) p.push("minimum inside the sorted part")
  if (s.comparingIndex !== null) {
    const j = s.comparingIndex
    if (j <= s.currentIndex || j >= n) p.push("comparing outside the unsorted part")
    // minIndex is the (leftmost) minimum of the part scanned so far
    let m = s.currentIndex
    for (let k = s.currentIndex + 1; k < j; k++) if (s.array[k] < s.array[m]) m = k
    if (m !== s.minIndex) p.push("minIndex is not the running minimum")
    if (s.description !== `Comparing ${s.array[j]} with current minimum ${s.array[s.minIndex]}.`) p.push("caption: " + s.description)
  }
  if (s.isSwapping && s.minIndex === s.currentIndex) p.push("self-swap")
  return p
}

describe("selection sort engine", () => {
  it("ends with the sorted input, fully marked sorted", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateSelectionSortSteps(a)
      expect(steps[0].array).toEqual(a)
      const last = steps[steps.length - 1]
      expect(last.array).toEqual(sorted(a))
      expect(last.sortedUpTo).toBe(a.length - 1)
    }), { numRuns: 5000 })
  })

  it("every frame preserves the data, keeps a final sorted prefix and a correct running minimum", () => {
    fc.assert(fc.property(arrays, (a) => {
      const target = sorted(a)
      expect(generateSelectionSortSteps(a).flatMap((s) => frameProblems(s, a, target))).toEqual([])
    }), { numRuns: 2000 })
  })

  it("matches the oracle: n(n-1)/2 comparisons, same swaps and new-minimum events", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateSelectionSortSteps(a)
      const ref = selectionSortTrace(a)
      expect(steps.filter((s) => s.comparingIndex !== null).length).toBe(ref.comparisons)
      expect(ref.comparisons).toBe((a.length * (a.length - 1)) / 2)
      expect(steps.filter((s) => s.isSwapping).length).toBe(ref.swaps)
      expect(steps.filter((s) => s.description.startsWith("Found a new minimum")).length).toBe(ref.newMinimums)
    }), { numRuns: 3000 })
  })

  it("swap frames are followed by the swapped array and the element placed in its final position", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateSelectionSortSteps(a)
      const target = sorted(a)
      const bad: string[] = []
      steps.forEach((s, k) => {
        if (!s.isSwapping) return
        const next = steps[k + 1]
        const i = s.currentIndex, m = s.minIndex
        if (next.array[i] !== s.array[m] || next.array[m] !== s.array[i]) bad.push("swap not shown")
        if (next.array[i] !== target[i] || next.sortedUpTo !== i) bad.push("placed element not final")
      })
      expect(bad).toEqual([])
    }), { numRuns: 2000 })
  })
})
