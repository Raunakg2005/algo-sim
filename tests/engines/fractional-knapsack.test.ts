import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  WELCOME_EXPLANATION,
  decimalToRational,
  generateFractionalKnapsackFrames,
  parsePositiveNumber,
  type FractionalItem,
} from "@/lib/engines/fractional-knapsack"
import { dec, greedyKnapsack, rat, ratDiv, ratEq, ratLess, ratStr, type DecItem, type Rat } from "../reference/fractional-knapsack"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

type Case = { dec: DecItem[]; items: FractionalItem[]; cap: number; frac: boolean }

const toNumber = (mant: number, scale: number) => Number((mant / 10 ** scale).toFixed(scale))
const build = (raw: { w: number; ws: number; v: number; vs: number }[], cap: number, frac: boolean): Case => ({
  dec: raw.map((r, i) => ({ id: String(i + 1), w: BigInt(r.w), wScale: r.ws, v: BigInt(r.v), vScale: r.vs })),
  items: raw.map((r, i) => ({
    id: String(i + 1),
    name: `Item ${i + 1}`,
    weight: toNumber(r.w, r.ws),
    value: toNumber(r.v, r.vs),
    ratio: 0,
    selected: false,
  })),
  cap,
  frac,
})
const capacityArb = fc.integer({ min: 2, max: 20 }).map((k) => 5 * k) // slider: 10..100 step 5
const caseArb = (item: fc.Arbitrary<{ w: number; ws: number; v: number; vs: number }>, maxItems = 8) =>
  fc.tuple(fc.array(item, { minLength: 0, maxLength: maxItems }), capacityArb, fc.boolean()).map(([r, c, f]) => build(r, c, f))

const ints = caseArb(fc.record({ w: fc.integer({ min: 1, max: 60 }), ws: fc.constant(0), v: fc.integer({ min: 1, max: 200 }), vs: fc.constant(0) }))
const decimals = caseArb(
  fc.record({ w: fc.integer({ min: 1, max: 6000 }), ws: fc.integer({ min: 0, max: 2 }), v: fc.integer({ min: 1, max: 20000 }), vs: fc.integer({ min: 0, max: 2 }) }),
)
// ratios that agree to two decimals (the original sorted by the rounded ratio)
const closeRatios = caseArb(
  fc.record({ w: fc.integer({ min: 1, max: 60 }), r: fc.integer({ min: 0, max: 400 }) }).map(({ w, r }) => ({
    w,
    ws: 0,
    v: Math.round(w * (10000 + r)) / 1, // value = w * (1 + r/10000), written with 4 decimals
    vs: 4,
  })),
)
// exactly equal ratios (ties) in different decimal spellings
const ties = caseArb(
  fc.record({ w: fc.integer({ min: 1, max: 40 }), k: fc.constantFrom(1, 2, 3), s: fc.constantFrom(0, 1) }).map(({ w, k, s }) => ({
    w: w * 10 ** s,
    ws: s,
    v: w * k * 3 * 10 ** s,
    vs: s,
  })),
)
const anyCase = fc.oneof(ints, decimals, closeRatios, ties)

const rationalOf = (s: string): Rat => {
  const [n, d] = s.split("/")
  return rat(BigInt(n), BigInt(d))
}

describe("fractional knapsack engine", () => {
  it("total value, remaining capacity and every fraction equal the exact greedy oracle", () => {
    fc.assert(
      fc.property(anyCase, ({ dec: D, items, cap, frac }) => {
        const frames = generateFractionalKnapsackFrames(items, cap, frac)
        const want = greedyKnapsack(D, dec(BigInt(cap), 0), frac)
        for (const f of [frames[2], frames[3]]) {
          expect(f.exact.totalValue).toBe(ratStr(want.total))
          expect(f.exact.remainingCapacity).toBe(ratStr(want.room))
          expect(f.knapsack.map((it) => it.id)).toEqual(want.taken.map((t) => t.id))
          for (const t of want.taken) expect(f.exact.fractions[t.id]).toBe(ratStr(t.fraction))
          expect(Object.keys(f.exact.fractions).length).toBe(want.taken.length)
          // displayed numbers are the exact ones rounded
          // displayed total = exact total rounded half-up to cents
          const cents = (want.total.num * BigInt(100) * BigInt(2) + want.total.den) / (want.total.den * BigInt(2))
          expect(f.totalValue).toBe(Number(cents) / 100)
          expect(Math.abs(f.remainingCapacity - Number(want.room.num) / Number(want.room.den))).toBeLessThan(1e-9)
        }
      }),
      { numRuns: 1500 },
    )
  })

  it("with fractions allowed the result is optimal (no higher-ratio item left out while a lower one is in)", () => {
    fc.assert(
      fc.property(anyCase, ({ dec: D, items, cap }) => {
        const f = generateFractionalKnapsackFrames(items, cap, true)[3]
        const ratio = (id: string) => {
          const it = D.find((d) => d.id === id)!
          return ratDiv(dec(it.v, it.vScale), dec(it.w, it.wScale))
        }
        const frac = (id: string) => (f.exact.fractions[id] ? rationalOf(f.exact.fractions[id]) : rat(BigInt(0), BigInt(1)))
        const one = rat(BigInt(1), BigInt(1))
        for (const a of D)
          for (const b of D)
            if (ratLess(ratio(b.id), ratio(a.id)) && frac(b.id).num > BigInt(0)) ok(ratEq(frac(a.id), one), `item ${a.id} not full although item ${b.id} has a lower ratio`)
        // knapsack full unless every item is in completely
        const allIn = D.every((d) => ratEq(frac(d.id), one))
        ok(allIn || f.exact.remainingCapacity === "0/1", "capacity left over")
      }),
      { numRuns: 800 },
    )
  })

  it("every frame is consistent with its phase", () => {
    fc.assert(
      fc.property(anyCase, ({ dec: D, items, cap, frac }) => {
        const frames = generateFractionalKnapsackFrames(items, cap, frac)
        expect(frames.map((f) => f.phase)).toEqual([0, 1, 2, 3])
        const ids = items.map((it) => it.id)
        // frame 0: input order, nothing selected; frame 1: sorted by exact ratio (stable), nothing selected
        expect(frames[0].list.map((it) => it.id)).toEqual(ids)
        expect(frames[0].explanation).toBe(WELCOME_EXPLANATION)
        expect(frames[1].list.map((it) => it.id)).toEqual(greedyKnapsack(D, dec(BigInt(cap), 0), frac).order)
        for (const f of [frames[0], frames[1]]) {
          ok(f.list.every((it) => !it.selected && it.fraction === undefined), "selection shown before the Select step")
          ok(f.knapsack.length === 0 && f.totalValue === 0 && f.remainingCapacity === cap, "knapsack not empty before selection")
        }
        for (const f of [frames[2], frames[3]]) {
          expect(f.list.map((it) => it.id)).toEqual(frames[1].list.map((it) => it.id))
          expect(f.knapsack.map((it) => it.id)).toEqual(f.list.filter((it) => it.selected).map((it) => it.id))
          let used = rat(BigInt(0), BigInt(1))
          let partial = 0
          for (const it of f.knapsack) {
            const fr = rationalOf(f.exact.fractions[it.id])
            ok(fr.num > BigInt(0) && !ratLess(rat(BigInt(1), BigInt(1)), fr), `fraction ${ratStr(fr)} out of (0,1]`)
            if (!ratEq(fr, rat(BigInt(1), BigInt(1)))) partial++
            ok(Math.abs(it.fraction! - Number(fr.num) / Number(fr.den)) < 1e-12, "numeric fraction differs from exact")
            const d = D.find((x) => x.id === it.id)!
            used = rat(used.num * fr.den * BigInt(10 ** d.wScale) + fr.num * d.w * used.den, used.den * fr.den * BigInt(10 ** d.wScale))
          }
          ok(partial <= (frac ? 1 : 0), `${partial} partial items`)
          ok(!ratLess(dec(BigInt(cap), 0), used), "capacity exceeded")
          // the displayed knapsack contents add up to the displayed total
          const shown = f.knapsack.reduce((s, it) => s + it.value * (it.fraction ?? 1), 0)
          ok(Math.abs(shown - f.totalValue) < 0.006, `knapsack shows ${shown}, total says ${f.totalValue}`)
          // display ratio is the two-decimal rounding of value/weight
          for (const it of f.list) ok(it.ratio === Number.parseFloat((it.value / it.weight).toFixed(2)), "ratio display")
        }
        for (const it of frames[2].knapsack) ok(frames[2].explanation.includes(it.name), `selection caption omits ${it.name}`)
        expect(frames[3].explanation).toBe(`Final result: Total value: ${frames[3].totalValue}. Remaining capacity: ${frames[3].remainingCapacity}.`)
      }),
      { numRuns: 800 },
    )
  })

  it("regressions from the legacy check", () => {
    const mk = (pairs: [number, number][]): FractionalItem[] =>
      pairs.map(([w, v], i) => ({ id: String(i + 1), name: `Item ${i + 1}`, weight: w, value: v, ratio: 0, selected: false }))
    // ratios 0.125 and 0.1333 both display as 0.13; the original kept input order and lost value
    const a = generateFractionalKnapsackFrames(mk([[8, 1], [15, 2]]), 10, true)[3]
    expect(a.exact.totalValue).toBe("4/3")
    expect(a.knapsack.map((it) => it.id)).toEqual(["2"])
    // 10 - 3.3 - 3.3 - 3.4 is not 0 in floating point; the original added "0.0%" of a fourth item
    const b = generateFractionalKnapsackFrames(mk([[3.3, 33], [3.3, 33], [3.4, 34], [5, 1]]), 10, true)[3]
    expect(b.knapsack.map((it) => it.id)).toEqual(["1", "2", "3"])
    expect(b.exact.remainingCapacity).toBe("0/1")
    // default items, capacity 50
    const c = generateFractionalKnapsackFrames(
      mk([[10, 60], [20, 100], [30, 120], [15, 45], [25, 50]]),
      50,
      true,
    )[3]
    expect(c.totalValue).toBe(240)
    expect(c.exact.fractions["3"]).toBe("2/3")
  })

  it("input helpers", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000_000 }), fc.integer({ min: 0, max: 4 }), (m, s) => {
        const x = toNumber(m, s)
        const r = decimalToRational(x)
        expect(ratStr(rat(r.n, r.d))).toBe(ratStr(dec(BigInt(m), s)))
        expect(parsePositiveNumber(String(x))).toBe(x)
      }),
      { numRuns: 500 },
    )
    expect(decimalToRational(1e-7)).toEqual({ n: BigInt(1), d: BigInt(10_000_000) })
    expect(decimalToRational(1e21)).toEqual({ n: BigInt("1000000000000000000000"), d: BigInt(1) })
    for (const bad of ["", " ", "0", "-2", "12abc", "Infinity", "abc"]) expect(parsePositiveNumber(bad)).toBeNull()
    expect(() => generateFractionalKnapsackFrames([], 0, true)).toThrow()
  })
})
