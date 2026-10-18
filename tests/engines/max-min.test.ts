import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateMaxMinSteps, type MaxMinStep } from "@/lib/engines/max-min"
import { dcComparisons, dcTree, rangeMaxMin } from "../reference/max-min"

// inputs the UI accepts: 1..12 finite numbers (any sign, decimals); the New Array button makes 6..10 values in 10..99
const value = fc.oneof(fc.integer({ min: -20, max: 20 }), fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }))
const uiArrays = fc.array(value, { minLength: 1, maxLength: 12 })
const dupArrays = fc.array(fc.integer({ min: -2, max: 2 }), { minLength: 1, maxLength: 12 })
const arrays = fc.oneof(uiArrays, dupArrays)

function frameProblems(s: MaxMinStep, a: number[]): string[] {
  const p: string[] = []
  const n = a.length
  const segs = s.segments
  const key = (lo: number, hi: number, lv: number) => `${lo}:${hi}:${lv}`
  const keys = new Set(segs.map((g) => key(g.start, g.end, g.level)))
  if (keys.size !== segs.length) p.push("duplicate segment")
  for (const g of segs) {
    if (g.start < 0 || g.end >= n || g.start > g.end) p.push(`segment ${g.start}..${g.end} out of range`)
    if (g.isResult) {
      const r = rangeMaxMin(a, g.start, g.end)
      if (g.max !== r.max) p.push(`wrong max for ${g.start}..${g.end}`)
      if (g.min !== r.min) p.push(`wrong min for ${g.start}..${g.end}`)
    }
    if (g.comparingIndices) {
      if (!g.isComparing) p.push("stale comparing highlight")
      for (const k of g.comparingIndices) if (k < g.start || k > g.end) p.push("comparing index outside its segment")
    }
    // every segment below the root hangs under its parent (one row per recursion level, no empty rows)
    if (g.level === 0 && (g.start !== 0 || g.end !== n - 1)) p.push("level-0 segment is not the whole array")
    if (g.level > 0 && !segs.some((q) => q.level === g.level - 1 && q.start <= g.start && g.end <= q.end)) p.push(`segment ${g.start}..${g.end} has no parent`)
  }
  // segments on the same level do not overlap
  for (const x of segs) for (const y of segs) if (x !== y && x.level === y.level && x.start <= y.end && y.start <= x.end) p.push("overlapping segments on one level")
  if (!segs.some((g) => g.level === 0)) p.push("root row empty")
  return p
}

describe("divide & conquer max-min engine", () => {
  it("final frame reports the true maximum and minimum", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateMaxMinSteps(a)
      const last = steps[steps.length - 1]
      const root = last.segments.find((g) => g.level === 0)!
      const ref = rangeMaxMin(a, 0, a.length - 1)
      expect(root.isResult).toBe(true)
      // numeric equality: -0 and 0 are the same value here (both display as "0")
      expect(root.max === ref.max).toBe(true)
      expect(root.min === ref.min).toBe(true)
      expect(last.description).toBe(`Final result: In the entire array, the maximum value is ${ref.max} and the minimum value is ${ref.min}.`)
    }), { numRuns: 5000 })
  })

  it("every frame is a consistent recursion tree with correct partial results", () => {
    fc.assert(fc.property(arrays, (a) => {
      expect(generateMaxMinSteps(a).flatMap((s) => frameProblems(s, a))).toEqual([])
    }), { numRuns: 3000 })
  })

  it("visits exactly the recursion tree of the oracle, with the expected frames per node", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateMaxMinSteps(a)
      const t = dcTree(a.length)
      const count = (prefix: string) => steps.filter((s) => s.description.startsWith(prefix)).length
      expect(count("Base case")).toBe(t.leaves1.length)
      expect(count("Comparing two elements")).toBe(t.leaves2.length)
      expect(count("Divide: Splitting")).toBe(t.internal.length)
      expect(count("Conquer:")).toBe(t.internal.length)
      // frames: initial + final + 1 per single + 2 per pair + 4 per internal node
      expect(steps.length).toBe(2 + t.leaves1.length + 2 * t.leaves2.length + 4 * t.internal.length)
      // the comparisons the frames stand for equal the classic count (3n/2 - 2 for n a power of two)
      expect(count("Comparing two elements") + 2 * count("Conquer:")).toBe(dcComparisons(a.length))
      const last = steps[steps.length - 1]
      const shown = last.segments.map((g) => `${g.start}:${g.end}:${g.level}`).sort()
      const tree = [...t.leaves1, ...t.leaves2, ...t.internal].map((v) => `${v.lo}:${v.hi}:${v.depth}`).sort()
      expect(shown).toEqual(tree)
      expect(last.segments.every((g) => g.isResult && !g.isComparing && !g.isProcessing)).toBe(true)
    }), { numRuns: 3000 })
  })

  it("captions report the values of the frame they belong to", () => {
    fc.assert(fc.property(arrays, (a) => {
      const bad: string[] = []
      for (const s of generateMaxMinSteps(a)) {
        const m = /^For the subarray from index (\d+) to (\d+), the maximum is (.+) and the minimum is (.+)\.$/.exec(s.description)
        if (m) {
          const r = rangeMaxMin(a, +m[1], +m[2])
          if (m[3] !== String(r.max) || m[4] !== String(r.min)) bad.push(s.description)
          const g = s.segments.find((x) => x.start === +m[1] && x.end === +m[2])
          if (!g || !g.isResult) bad.push("described segment not shown as result")
        }
        if (s.description.startsWith("Comparing two elements")) {
          const g = s.segments.find((x) => x.isComparing && x.comparingIndices)
          if (!g || g.end !== g.start + 1 || s.description !== `Comparing two elements: ${a[g.start]} and ${a[g.end]}`) bad.push(s.description)
        }
        if (s.description.startsWith("Conquer:") && s.segments.filter((g) => g.isComparing).length !== 2) bad.push("conquer frame without two halves highlighted")
        if (s.description.startsWith("Divide: Splitting") && s.segments.filter((g) => g.isProcessing).length !== 1) bad.push("divide frame without one processing segment")
      }
      expect(bad).toEqual([])
    }), { numRuns: 2000 })
  })

  it("handles the default example", () => {
    const steps = generateMaxMinSteps([42, 15, 87, 33, 61, 9, 75, 24])
    expect(steps[steps.length - 1].description).toBe("Final result: In the entire array, the maximum value is 87 and the minimum value is 9.")
  })
})
