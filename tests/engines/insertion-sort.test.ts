import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateInsertionSortSteps, INSERTION_SORT_CODE, type InsertionSortStep } from "@/lib/engines/insertion-sort"
import { multiset, sorted } from "../reference"
import { insertionComparisons, insertionTarget, inversions } from "../reference/insertion-sort"

// inputs the UI accepts: >= 1 finite numbers, no length or value limit; the Random button makes 5..10 values in 1..50
const value = fc.oneof(fc.integer({ min: -5, max: 5 }), fc.integer({ min: 1, max: 50 }), fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }).map((x) => x + 0)) // +0 turns -0 into 0 (identical on screen)
const arrays = fc.array(value, { minLength: 1, maxLength: 20 })

const sameMultiset = (x: number[], y: number[]) => JSON.stringify(multiset(x)) === JSON.stringify(multiset(y))

// control-flow graph of the displayed pseudocode (indices into INSERTION_SORT_CODE)
//  2 for-loop, 4 current = arr[i], 6 j = i - 1, 8 while test, 9 shift, 10 j--, 12 insert, 13 return
// 8 -> 4 / 8 -> 13 is the visualizer's shortcut when current is already in place (the no-op write is not shown);
// 10 -> 12 is only legal when j became -1 (the while test fails on j >= 0 without a key comparison).
const EDGES = new Set(["2>4", "2>13", "4>6", "6>8", "8>9", "8>12", "8>4", "8>13", "9>10", "10>8", "10>12", "12>4", "12>13"])

describe("insertion sort engine", () => {
  it("ends with the sorted input, fully marked sorted", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateInsertionSortSteps(a)
      expect(steps[0].array).toEqual(a)
      const last = steps[steps.length - 1]
      expect(last.array).toEqual(sorted(a))
      expect(last.sortedUpTo).toBe(a.length - 1)
      expect(last.activeCodeLine).toBe(13)
    }), { numRuns: 5000 })
  })

  it("highlighted code lines form a valid execution path of the pseudocode", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateInsertionSortSteps(a)
      const bad: string[] = []
      expect(steps[0].activeCodeLine).toBe(2)
      for (let k = 1; k < steps.length; k++) {
        const e = `${steps[k - 1].activeCodeLine}>${steps[k].activeCodeLine}`
        if (!EDGES.has(e)) bad.push(e)
        if (e === "10>12" && steps[k - 1].comparingIndex !== null) bad.push("left the loop at line 10 with j >= 0")
        if (e === "10>8" && steps[k - 1].comparingIndex === null) bad.push("compared with j = -1")
      }
      for (const s of steps) if (s.activeCodeLine < 0 || s.activeCodeLine >= INSERTION_SORT_CODE.length) bad.push("line out of range")
      expect(bad).toEqual([])
    }), { numRuns: 3000 })
  })

  it("matches the oracle: one frame per key comparison and one shift per inversion", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateInsertionSortSteps(a)
      expect(steps.filter((s) => s.activeCodeLine === 8).length).toBe(insertionComparisons(a))
      expect(steps.filter((s) => s.activeCodeLine === 9).length).toBe(inversions(a))
      expect(steps.filter((s) => s.isSwapping).length).toBe(inversions(a))
    }), { numRuns: 3000 })
  })

  it("each element is inserted where the oracle says, and every frame holds the input except the hole for `current`", () => {
    fc.assert(fc.property(arrays, (a) => {
      const steps = generateInsertionSortSteps(a)
      const bad: string[] = []
      let key = a[0]
      let i = 0
      for (const s of steps) {
        if (s.activeCodeLine === 4) { i = s.currentIndex; key = s.array[i]; if (key !== a[i]) bad.push("current is not the next input element") }
        // positions after i are untouched
        for (let k = i + 1; k < a.length; k++) if (s.array[k] !== a[k]) bad.push(`untouched part changed at ${k}`)
        // filling exactly one position with `current` restores the data (the array itself is intact outside loop frames)
        if (!sameMultiset(s.array, a)) {
          let ok = false
          for (let h = 0; h <= i && !ok; h++) { const t = s.array.slice(); t[h] = key; ok = sameMultiset(t, a) }
          if (!ok || ![9, 10, 8].includes(s.activeCodeLine)) bad.push(`data lost at line ${s.activeCodeLine}`)
        }
        if (s.activeCodeLine === 9) {
          const j = s.comparingIndex!
          if (s.array[j] !== s.array[j + 1] || !(s.array[j] > key)) bad.push("shift frame does not show a copy of a larger element")
          if (s.description !== `Shifted ${s.array[j]} one position to the right.`) bad.push("shift caption")
        }
        if (s.activeCodeLine === 8 && s.comparingIndex !== null) {
          const j = s.comparingIndex
          const greater = s.array[j] > key
          if (greater !== s.description.includes("is greater")) bad.push("comparison caption contradicts the values: " + s.description)
          if (!s.description.startsWith(`Comparing ${key} with ${s.array[j]}.`)) bad.push("comparison caption values")
        }
        if (s.activeCodeLine === 12 || (s.activeCodeLine === 8 && s.sortedUpTo === i && i > 0)) {
          const pos = insertionTarget(a, i)
          if (s.array[pos] !== key) bad.push(`element ${key} not at oracle position ${pos}`)
          const prefix = s.array.slice(0, i + 1)
          if (JSON.stringify(prefix) !== JSON.stringify(sorted(a.slice(0, i + 1)))) bad.push("prefix not sorted after insertion")
          if (s.activeCodeLine === 12 && s.description !== `Inserted ${key} at position ${pos}.`) bad.push("insert caption")
        }
        for (const k of [s.comparingIndex]) if (k !== null && (k < 0 || k >= a.length)) bad.push("comparingIndex out of range")
        if (s.currentIndex < 0 || s.currentIndex > a.length) bad.push("currentIndex out of range")
      }
      expect(bad).toEqual([])
    }), { numRuns: 2000 })
  })
})
