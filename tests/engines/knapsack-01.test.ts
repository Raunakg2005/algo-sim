import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  MAX_KNAPSACK_CAPACITY,
  MAX_KNAPSACK_ITEMS,
  generateKnapsackSteps,
  nextItemId,
  parsePositiveInteger,
  type KnapsackItem,
} from "@/lib/engines/knapsack-01"
import { bruteForceBest, bruteForceTable } from "../reference/knapsack-01"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

const itemsArb = (maxN: number, maxW: number, maxV: number): fc.Arbitrary<KnapsackItem[]> =>
  fc
    .array(fc.record({ weight: fc.integer({ min: 1, max: maxW }), value: fc.integer({ min: 1, max: maxV }) }), {
      minLength: 1,
      maxLength: maxN,
    })
    .chain((raw) =>
      // ids as they look after add/remove edits: unique but not necessarily 1..n
      fc.shuffledSubarray([...Array(3 * raw.length).keys()].map((k) => k + 1), { minLength: raw.length, maxLength: raw.length })
        .map((ids) => raw.map((r, i) => ({ id: ids[i], ...r }))),
    )

// UI random generator: 3..5 items, weight 1..5, value 1..10, capacity 5..14
const uiRandom = fc.tuple(
  fc.array(fc.record({ weight: fc.integer({ min: 1, max: 5 }), value: fc.integer({ min: 1, max: 10 }) }), { minLength: 3, maxLength: 5 })
    .map((r) => r.map((x, i) => ({ id: i + 1, ...x }))),
  fc.integer({ min: 5, max: 14 }),
)
// anything the inputs accept: 1..10 items, positive integer weights/values, capacity 1..50
const custom = fc.tuple(itemsArb(MAX_KNAPSACK_ITEMS, 60, 100), fc.integer({ min: 1, max: MAX_KNAPSACK_CAPACITY }))
const smallCustom = fc.tuple(itemsArb(8, 12, 9), fc.integer({ min: 1, max: 20 })) // many ties

describe("0/1 knapsack engine", () => {
  it("final DP table equals the brute-force table and the reported value is optimal", () => {
    for (const arb of [uiRandom, smallCustom])
      fc.assert(
        fc.property(arb, ([items, cap]) => {
          const steps = generateKnapsackSteps(items, cap)
          const last = steps[steps.length - 1]
          const want = bruteForceTable(items, cap)
          expect(last.table.map((r) => r.map((c) => c.value))).toEqual(want)
          expect(last.totalValue).toBe(want[items.length][cap])
        }),
        { numRuns: 400 },
      )
    fc.assert(
      fc.property(custom, ([items, cap]) => {
        const last = generateKnapsackSteps(items, cap).at(-1)!
        expect(last.totalValue).toBe(bruteForceBest(items, items.length, cap))
      }),
      { numRuns: 300 },
    )
  })

  it("backtracked item set is feasible, optimal, and its ids identify distinct items", () => {
    fc.assert(
      fc.property(fc.oneof(uiRandom, smallCustom, custom), ([items, cap]) => {
        const last = generateKnapsackSteps(items, cap).at(-1)!
        const chosen = last.selectedItems.map((id) => items.filter((it) => it.id === id))
        for (const c of chosen) expect(c.length).toBe(1)
        expect(new Set(last.selectedItems).size).toBe(last.selectedItems.length)
        const w = chosen.reduce((s, c) => s + c[0].weight, 0)
        const v = chosen.reduce((s, c) => s + c[0].value, 0)
        expect(w).toBeLessThanOrEqual(cap)
        expect(w).toBe(last.totalWeight)
        expect(v).toBe(bruteForceBest(items, items.length, cap))
        expect(last.description).toBe(`Optimal solution: ${chosen.length} items selected with total value ${v} and weight ${w}`)
      }),
      { numRuns: 400 },
    )
  })

  it("every frame is consistent: table shape, filled cells final, highlights in range, captions name real items", () => {
    fc.assert(
      fc.property(fc.oneof(uiRandom, smallCustom), ([items, cap]) => {
        const n = items.length
        const steps = generateKnapsackSteps(items, cap)
        const final = steps[steps.length - 1].table
        const ids = new Set(items.map((it) => String(it.id)))
        let seen = 0
        for (let f = 0; f < steps.length; f++) {
          const s = steps[f]
          ok(s.table.length === n + 1 && s.table.every((r) => r.length === cap + 1), `frame ${f} shape`)
          for (const c of s.comparingCells ?? []) ok(c.row >= 0 && c.row <= n && c.col >= 0 && c.col <= cap && s.table[c.row][c.col].comparing === true, `frame ${f} comparing cell`)
          let highlighted = 0
          for (let i = 0; i <= n; i++)
            for (let c = 0; c <= cap; c++) {
              const cell = s.table[i][c]
              if (cell.highlighted) highlighted++
              // a cell either still holds 0 or already holds its final value (DP never overwrites)
              ok(cell.value === 0 || cell.value === final[i][c].value, `frame ${f} cell [${i}][${c}] = ${cell.value}`)
            }
          ok(highlighted <= 1, `frame ${f} has ${highlighted} highlighted cells`)
          if (s.currentRow !== undefined) {
            ok(s.currentRow >= 1 && s.currentRow <= n && s.currentCol! >= 0 && s.currentCol! <= cap, `frame ${f} current cell`)
            // cells are visited in row-major order
            const key = s.currentRow * (cap + 1) + s.currentCol!
            ok(key >= seen, `frame ${f} out of order`)
            seen = key
          }
          for (const m of s.description.matchAll(/[Ii]tem (\d+)/g)) ok(ids.has(m[1]), `frame ${f} caption "${s.description}" names a missing item`)
          if (s.currentRow !== undefined && /item \d+/i.test(s.description)) {
            ok(new RegExp(`[Ii]tem ${items[s.currentRow - 1].id}\\b`).test(s.description), `frame ${f} caption names the wrong item`)
          }
          ok(s.totalWeight <= cap, `frame ${f} weight over capacity`)
        }
      }),
      { numRuns: 400 },
    )
  })

  it("frame count matches the DP (1 + per row 1 + per column 1, 2 or 3) plus backtracking", () => {
    fc.assert(
      fc.property(fc.oneof(uiRandom, smallCustom), ([items, cap]) => {
        const steps = generateKnapsackSteps(items, cap)
        let dpFrames = 1
        for (const it of items) {
          dpFrames += 1
          for (let j = 0; j <= cap; j++) dpFrames += j === 0 ? 1 : it.weight > j ? 2 : 3
        }
        expect(steps.filter((s) => s.phase === "init" || s.phase === "compute").length).toBe(dpFrames)
        expect(steps.filter((s) => s.phase === "complete").length).toBe(2)
      }),
      { numRuns: 300 },
    )
  })

  it("input helpers: strict integers, unique ids after edits, size limits enforced", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (x) => {
        expect(parsePositiveInteger(String(x))).toBe(x)
        expect(parsePositiveInteger(` ${x} `)).toBe(x)
        expect(parsePositiveInteger(`${x}.5`)).toBeNull()
        expect(parsePositiveInteger(`${x}abc`)).toBeNull()
      }),
      { numRuns: 200 },
    )
    for (const bad of ["", "0", "-3", "2.5", "1e3", "abc"]) expect(parsePositiveInteger(bad)).toBeNull()
    // random add/remove sequences never produce duplicate ids
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constant(-1), fc.nat(20)), { maxLength: 30 }), (ops) => {
        let items: KnapsackItem[] = [1, 2, 3, 4].map((id) => ({ id, weight: 1, value: 1 }))
        for (const op of ops) {
          if (op === -1) items = [...items, { id: nextItemId(items), weight: 1, value: 1 }]
          else if (items.length) items = items.filter((it) => it.id !== items[op % items.length].id)
          expect(new Set(items.map((it) => it.id)).size).toBe(items.length)
        }
      }),
      { numRuns: 300 },
    )
    const one = [{ id: 1, weight: 1, value: 1 }]
    expect(() => generateKnapsackSteps(one, MAX_KNAPSACK_CAPACITY + 1)).toThrow()
    expect(() => generateKnapsackSteps(Array.from({ length: MAX_KNAPSACK_ITEMS + 1 }, (_, i) => ({ id: i + 1, weight: 1, value: 1 })), 5)).toThrow()
    expect(() => generateKnapsackSteps([], 5)).toThrow()
  })

  it("default example: capacity 8, items (2,3) (3,4) (4,5) (5,6)", () => {
    const items = [
      { id: 1, weight: 2, value: 3 },
      { id: 2, weight: 3, value: 4 },
      { id: 3, weight: 4, value: 5 },
      { id: 4, weight: 5, value: 6 },
    ]
    const last = generateKnapsackSteps(items, 8).at(-1)!
    expect(last.totalValue).toBe(10)
    expect([...last.selectedItems].sort()).toEqual([2, 4])
    expect(last.totalWeight).toBe(8)
  })
})
