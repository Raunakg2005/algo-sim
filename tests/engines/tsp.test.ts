import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { solveTSP } from "@/lib/engines/tsp"
import { calculateDistances, generateRandomCities, type City } from "@/lib/tsp-utils"
import { bruteForcePath, bruteForceTour, tourCost } from "../reference/tsp"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

// The three ways the UI produces a distance matrix:
//  - matrix tab: symmetric non-negative integers, 2..8 cities (new cells default to 0);
//  - coordinates tab: arbitrary (also fractional / negative / coincident) coordinates, rounded distances;
//  - asymmetric integer matrices are not enterable but the solver handles them, so they are tested too.
const symmetricArb = (minN: number, maxN: number) =>
  fc.integer({ min: minN, max: maxN }).chain((n) =>
    fc.array(fc.integer({ min: 0, max: 30 }), { minLength: n * n, maxLength: n * n }).map((v) => {
      const D = Array.from({ length: n }, () => new Array<number>(n).fill(0))
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = v[i * n + j]
      return D
    }),
  )
const asymmetricArb = (minN: number, maxN: number) =>
  fc.integer({ min: minN, max: maxN }).chain((n) =>
    fc.array(fc.integer({ min: 0, max: 30 }), { minLength: n * n, maxLength: n * n }).map((v) =>
      Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : v[i * n + j]))),
    ),
  )
const coordArb = (minN: number, maxN: number) =>
  fc
    .array(fc.tuple(fc.integer({ min: -500, max: 900 }), fc.integer({ min: -500, max: 900 }), fc.boolean()), { minLength: minN, maxLength: maxN })
    .map((pts) => calculateDistances(pts.map(([x, y, half], i): City => ({ id: i, name: `C${i}`, x: x + (half ? 0.5 : 0), y }))))
const matrixArb = (minN: number, maxN: number) => fc.oneof(symmetricArb(minN, maxN), asymmetricArb(minN, maxN), coordArb(minN, maxN))

const withStart = (arb: fc.Arbitrary<number[][]>) => arb.chain((D) => fc.tuple(fc.constant(D), fc.nat(D.length - 1)))

describe("TSP engine (Held-Karp) against brute force", () => {
  it("optimal tour cost equals the brute-force optimum; the tour is a permutation from the start city", () => {
    fc.assert(
      fc.property(withStart(matrixArb(2, 7)), ([D, s]) => {
        const steps = solveTSP(D, s)
        const f = steps[steps.length - 1]
        expect(f.type).toBe("final")
        expect(f.tourCost).toBe(bruteForceTour(D, s))
        expect(f.tour![0]).toBe(s)
        expect([...f.tour!].sort((a, b) => a - b)).toEqual(D.map((_, i) => i))
        expect(tourCost(D, f.tour!)).toBe(f.tourCost)
      }),
      { numRuns: 1000 },
    )
  }, 30000)

  it("is also optimal for 8 cities (the UI maximum)", () => {
    fc.assert(
      fc.property(withStart(matrixArb(8, 8)), ([D, s]) => {
        const f = solveTSP(D, s).at(-1)!
        expect(f.tourCost).toBe(bruteForceTour(D, s))
        expect(tourCost(D, f.tour!)).toBe(f.tourCost)
      }),
      { numRuns: 60 },
    )
  }, 30000)

  it("every DP entry is the brute-force cheapest path through its subset, and its parent is consistent", () => {
    fc.assert(
      fc.property(withStart(matrixArb(2, 6)), ([D, s]) => {
        const f = solveTSP(D, s).at(-1)!
        const n = D.length
        const keys = Object.keys(f.dpTable!)
        // one entry per (subset containing s, end != s in subset)
        ok(keys.length === (n - 1) * 2 ** (n - 2), "number of DP states")
        for (const key of keys) {
          const [mask, end] = key.split(",").map(Number)
          ok((mask & (1 << s)) !== 0 && (mask & (1 << end)) !== 0 && end !== s, "state shape")
          ok(f.dpTable![key] === bruteForcePath(D, s, mask, end), `dp[${key}]`)
          const p = f.dpParent![key]
          const prevMask = mask & ~(1 << end)
          const base = p === s ? (prevMask === 1 << s ? 0 : NaN) : f.dpTable![`${prevMask},${p}`]
          ok(base + D[p][end] === f.dpTable![key], `parent of ${key}`)
        }
      }),
      { numRuns: 800 },
    )
  }, 30000)
})

describe("TSP engine - step trace", () => {
  it("frame counts match the Held-Karp recurrence; DP entries are written once and never change", () => {
    fc.assert(
      fc.property(withStart(matrixArb(2, 7)), ([D, s]) => {
        const n = D.length
        const steps = solveTSP(D, s)
        const C = (a: number, b: number) => {
          let x = 1
          for (let i = 0; i < b; i++) x = (x * (a - i)) / (i + 1)
          return x
        }
        let considering = 0
        let updates = 0
        for (let k = 3; k <= n; k++) {
          considering += C(n - 1, k - 1) * (k - 1) * (k - 2)
          updates += C(n - 1, k - 1) * (k - 1)
        }
        const msgs = steps.map((x) => x.message)
        ok(msgs.filter((m) => m.startsWith("Considering path")).length === considering, "considering frames")
        ok(msgs.filter((m) => m.startsWith("Updated DP table")).length === updates, "update frames")
        ok(msgs.filter((m) => m.startsWith("Base case")).length === n - 1, "base frames")
        ok(msgs.filter((m) => m.startsWith("Considering return")).length === n - 1, "return frames")
        ok(steps.filter((x) => x.type === "backtrack").length === n - 1, "backtrack frames")
        let seen: Record<string, number> = {}
        for (const st of steps) {
          const t = st.dpTable ?? {}
          for (const k of Object.keys(seen)) ok(t[k] === seen[k], "a DP entry changed or disappeared")
          seen = { ...t }
          if (st.message.startsWith("Updated DP table")) ok(t[`${st.mask},${st.currentCity}`] !== undefined, "update frame points at its entry")
          if (st.message.startsWith("Considering path")) {
            ok(t[`${st.mask},${st.currentCity}`] !== undefined, "considered state exists")
            ok((st.mask! & (1 << st.nextCity!)) === 0, "next city already in the subset")
          }
          for (const c of [st.currentCity, st.nextCity, ...(st.tour ?? []), ...(st.partialTour ?? [])])
            if (c !== undefined) ok(Number.isInteger(c) && c >= 0 && c < n, "frame points at a missing city")
        }
      }),
      { numRuns: 800 },
    )
  }, 30000)

  it("backtracking frames only draw edges of the optimal tour and grow it one city at a time", () => {
    fc.assert(
      fc.property(withStart(matrixArb(3, 7)), ([D, s]) => {
        const steps = solveTSP(D, s)
        const tour = steps.at(-1)!.tour!
        const n = D.length
        const tourEdges = new Set(tour.map((c, i) => `${c}>${tour[(i + 1) % n]}`))
        const back = steps.filter((x) => x.type === "backtrack")
        back.forEach((st, k) => {
          const p = st.partialTour!
          expect(st.tour).toEqual(p)
          expect(p.length).toBe(k + 2)
          expect(p[p.length - 1]).toBe(s)
          expect(p[0]).toBe(st.currentCity)
          for (let i = 0; i + 1 < p.length; i++) expect(tourEdges.has(`${p[i]}>${p[i + 1]}`)).toBe(true)
        })
      }),
      { numRuns: 800 },
    )
  }, 30000)

  it("captions use the city names shown in the UI", () => {
    const D = calculateDistances([
      { id: 1, name: "Paris", x: 0, y: 0 },
      { id: 2, name: "Lyon", x: 3, y: 4 },
      { id: 3, name: "Nice", x: 6, y: 0 },
    ])
    const steps = solveTSP(D, 0, ["Paris", "Lyon", "Nice"])
    for (const st of steps) expect(st.message).not.toMatch(/city \d/)
    expect(steps.at(-1)!.message).toMatch(/^Optimal tour found: Paris → (Lyon → Nice|Nice → Lyon) → Paris with total cost 16.$/)
    expect(solveTSP(D, 1).at(-1)!.message).toMatch(/^Optimal tour found: B → /)
  })

  it("rejects a start city that is not one of the cities instead of crashing", () => {
    const D = [[0, 1, 2], [1, 0, 3], [2, 3, 0]]
    expect(() => solveTSP(D, 3)).toThrow(RangeError)
    expect(() => solveTSP(D, -1)).toThrow(RangeError)
    expect(solveTSP([[0]], 0)).toEqual([])
  })
})

describe("TSP utilities used by the UI", () => {
  it("random cities and distances: zero diagonal, symmetric, integer, metric up to rounding", () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 8 }), (n) => {
        const cities = generateRandomCities(n)
        expect(cities.length).toBe(n)
        for (const c of cities) expect(c.x >= 50 && c.x < 450 && c.y >= 50 && c.y < 450).toBe(true)
        const D = calculateDistances(cities)
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            ok(D[i][j] === D[j][i] && Number.isInteger(D[i][j]) && (i !== j || D[i][j] === 0), "symmetric integer, zero diagonal")
            for (let k = 0; k < n; k++) ok(D[i][j] <= D[i][k] + D[k][j] + 1, "triangle inequality up to rounding")
          }
      }),
      { numRuns: 1000 },
    )
  })
})
