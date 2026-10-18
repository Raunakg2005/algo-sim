import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  generateMatrixChainSteps,
  parseDimensions,
  printOptimalParens,
  validateMatrixCount,
} from "@/lib/engines/matrix-chain"
import { bruteForceMin, leaves, parseParens, treeCost } from "../reference/matrix-chain"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

const chain = (minN: number, maxN: number, maxDim: number): fc.Arbitrary<number[]> =>
  fc.integer({ min: minN, max: maxN }).chain((n) => fc.array(fc.integer({ min: 1, max: maxDim }), { minLength: n + 1, maxLength: n + 1 }))

// UI random generator: 3..6 matrices, dimensions 5..44; custom input: 2..10 matrices, any positive integers
const uiRandom = fc.integer({ min: 3, max: 6 }).chain((n) => fc.array(fc.integer({ min: 5, max: 44 }), { minLength: n + 1, maxLength: n + 1 }))
const smallTies = chain(2, 8, 4) // tiny dimensions => many equal-cost splits
const custom = chain(2, 8, 500)

describe("matrix chain engine", () => {
  it("every m[i][j] equals the brute-force minimum and every s[i][j] is a valid split", () => {
    for (const arb of [uiRandom, smallTies, custom])
      fc.assert(
        fc.property(arb, (p) => {
          const n = p.length - 1
          const last = generateMatrixChainSteps(p).at(-1)!
          const m = last.costMatrix!
          const s = last.splitMatrix!
          for (let i = 0; i < n; i++)
            for (let j = i; j < n; j++) {
              expect(BigInt(m[i][j])).toBe(bruteForceMin(p, i, j))
              if (j > i) {
                expect(s[i][j]).toBeGreaterThanOrEqual(i)
                expect(s[i][j]).toBeLessThan(j)
                // the stored split achieves the minimum
                expect(m[i][s[i][j]] + m[s[i][j] + 1][j] + p[i] * p[s[i][j] + 1] * p[j + 1]).toBe(m[i][j])
              }
            }
        }),
        { numRuns: 1000 },
      )
  })

  it("prints an optimal parenthesisation of M1..Mn in order", () => {
    fc.assert(
      fc.property(fc.oneof(uiRandom, smallTies, custom, chain(9, 10, 100)), (p) => {
        const n = p.length - 1
        const steps = generateMatrixChainSteps(p)
        const last = steps.at(-1)!
        expect(last.phase).toBe("complete")
        const t = parseParens(last.parenthesization!)
        expect(leaves(t)).toEqual([...Array(n).keys()])
        const best = n <= 8 ? bruteForceMin(p, 0, n - 1) : BigInt(last.costMatrix![0][n - 1])
        expect(treeCost(t, p).cost).toBe(best)
        expect(last.description).toBe(`The optimal parenthesization is: ${last.parenthesization}`)
        expect(steps.at(-3)!.description).toContain(`is ${last.costMatrix![0][n - 1]}`)
      }),
      { numRuns: 1000 },
    )
  })

  it("frames follow the DP: one 'try' frame per (i,j,k), cells and captions consistent", () => {
    fc.assert(
      fc.property(fc.oneof(uiRandom, smallTies), (p) => {
        const n = p.length - 1
        const steps = generateMatrixChainSteps(p)
        const final = steps[steps.length - 1].costMatrix!
        let tries = 0
        let order = 0
        for (let f = 0; f < steps.length; f++) {
          const s = steps[f]
          for (const c of s.highlightCells ?? []) ok(c.i >= 0 && c.i <= c.j && c.j < n, `highlight out of range in frame ${f}`)
          if (s.i === undefined || s.j === undefined) continue
          const { i, j } = s
          if (s.k !== undefined) {
            const k = s.k
            // cells used by the current subproblem are already final
            ok(s.costMatrix![i][k] === final[i][k] && s.costMatrix![k + 1][j] === final[k + 1][j], `frame ${f} uses unfinished cells`)
            ok(s.currentCost === final[i][k] + final[k + 1][j] + p[i] * p[k + 1] * p[j + 1], `frame ${f} cost`)
            if (s.bestK === undefined) {
              tries++
              ok(
                s.description ===
                  `Trying split at matrix ${k + 1}: Cost = m[${i + 1},${k + 1}] + m[${k + 2},${j + 1}] + ${p[i]} × ${p[k + 1]} × ${p[j + 1]}`,
                `frame ${f} caption`,
              )
              ok(s.minCost === s.costMatrix![i][j], `frame ${f} minCost`)
            } else {
              ok(s.costMatrix![i][j] === s.currentCost && s.splitMatrix![i][j] === k, `frame ${f} update`)
              ok(s.currentCost! < steps[f - 1].minCost!, `frame ${f} not an improvement`)
            }
          }
          // subproblems are visited by increasing chain length
          const key = (j - i) * 100 + i
          ok(key >= order, `frame ${f} out of order`)
          order = key
        }
        expect(tries).toBe(((n - 1) * n * (n + 1)) / 6) // sum over len of (n-len+1)(len-1)
      }),
      { numRuns: 1000 },
    )
  })

  it("default example (CLRS-style 30,35,15,5,10)", () => {
    const last = generateMatrixChainSteps([30, 35, 15, 5, 10]).at(-1)!
    // (M1 (M2 M3)) M4: 35*15*5 + 30*35*5 + 30*5*10 = 2625 + 5250 + 1500
    expect(last.costMatrix![0][3]).toBe(9375)
    expect(last.parenthesization).toBe("((M1 × (M2 × M3)) × M4)")
    expect(printOptimalParens([[0]], 0, 0)).toBe("M1")
  })

  it("input parsing accepts exactly the positive whole numbers", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 1_000_000 }), { minLength: 1, maxLength: 11 }), fc.constantFrom(",", ", ", " ,  "), (d, sep) => {
        expect(parseDimensions(d.join(sep))).toEqual(d)
        expect(parseDimensions(d.join(sep) + ",")).toEqual(d)
      }),
      { numRuns: 300 },
    )
    for (const bad of ["30, 35.7, 15", "1e3, 2", "15abc, 3", "0, 4", "-3, 4", "x"]) expect(() => parseDimensions(bad)).toThrow()
    fc.assert(
      fc.property(fc.double({ noNaN: true, min: -20, max: 20 }), (x) => {
        const err = validateMatrixCount(x)
        expect(err === null).toBe(Number.isInteger(x) && x >= 2 && x <= 10)
      }),
      { numRuns: 300 },
    )
  })
})
