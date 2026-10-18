import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateMergeSortSteps } from "@/lib/engines/merge-sort"
import { mergeSortComparisons, multiset, sorted } from "../reference"

// inputs the UI accepts: 1..12 numbers; small value range forces many duplicates
const arrays = fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 1, maxLength: 12 })

describe("merge sort engine", () => {
  it("ends with one merged block equal to the sorted input", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateMergeSortSteps(a)
      const last = steps[steps.length - 1]
      expect(last.arrays).toEqual([sorted(a)])
      if (a.length > 1) expect(last.merged).toEqual([true])
    }), { numRuns: 5000 })
  })

  it("never loses or invents elements in any frame", () => {
    fc.assert(fc.property(arrays, (a) => {
      for (const s of generateMergeSortSteps(a)) {
        expect(multiset(s.arrays.flat())).toEqual(multiset(a))
        expect(s.level.length).toBe(s.arrays.length)
        expect(s.merging.length).toBe(s.arrays.length)
        expect(s.merged.length).toBe(s.arrays.length)
      }
    }), { numRuns: 2000 })
  })

  it("shows exactly one frame per key comparison, each pointing at a real element", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateMergeSortSteps(a)
      const cmp = steps.filter((s) => s.comparisons)
      expect(cmp.length).toBe(mergeSortComparisons(a))
      for (const s of cmp) for (const [b, k] of s.comparisons!) {
        expect(b).toBeGreaterThanOrEqual(0)
        expect(k).toBeLessThan(s.arrays[b].length)
        expect(s.merging[b]).toBe(true)
      }
    }), { numRuns: 2000 })
  })

  it("handles the default example from the paper", () => {
    const steps = generateMergeSortSteps([38, 27, 43, 3, 9, 82, 10])
    expect(steps[steps.length - 1].arrays[0]).toEqual([3, 9, 10, 27, 38, 43, 82])
  })
})
