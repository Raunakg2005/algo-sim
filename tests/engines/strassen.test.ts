import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateStrassenSteps, parseMatrixInput, type Matrix } from "@/lib/engines/strassen"
import { minus, naiveProduct, plus, quadrant, strassenProducts } from "../reference/strassen"

const square = (n: number, v: fc.Arbitrary<number>): fc.Arbitrary<number[][]> =>
  fc.array(fc.array(v, { minLength: n, maxLength: n }), { minLength: n, maxLength: n })
const pair = (sizes: number[], v: fc.Arbitrary<number>): fc.Arbitrary<[number[][], number[][]]> =>
  fc.constantFrom(...sizes).chain((n) => fc.tuple(square(n, v), square(n, v)))

// what the UI produces: sizes 2/4/8; random entries 1..9; custom input accepts any finite numbers
const uiRandom = pair([2, 4, 8], fc.integer({ min: 1, max: 9 }))
const uiInts = pair([2, 4, 8], fc.integer({ min: -1000, max: 1000 }))
const uiDecimals = pair([2, 4, 8], fc.integer({ min: -9999, max: 9999 }).map((x) => x / 100))
// engine contract beyond the UI: any n, odd n padded with zeros
const anySize = pair([1, 2, 3, 4, 5, 6, 7, 8, 9], fc.integer({ min: -50, max: 50 }))

type Framed = { subMatrices?: Record<string, { matrix: Matrix }> }
const get = (s: Framed, k: string): Matrix | undefined => s.subMatrices?.[k]?.matrix

describe("strassen engine", () => {
  it("final frame equals the naive product (exact for integers)", () => {
    for (const arb of [uiRandom, uiInts, anySize])
      fc.assert(
        fc.property(arb, ([A, B]) => {
          const last = generateStrassenSteps(A, B).at(-1)!
          expect(last.phase).toBe("result")
          expect(last.resultMatrix).toEqual(naiveProduct(A, B))
        }),
        { numRuns: 700 },
      )
  })

  it("decimal custom input agrees with the naive product up to rounding", () => {
    fc.assert(
      fc.property(uiDecimals, ([A, B]) => {
        const C = generateStrassenSteps(A, B).at(-1)!.resultMatrix!
        const N = naiveProduct(A, B)
        C.forEach((row, i) => row.forEach((v, j) => expect(Math.abs(v - N[i][j])).toBeLessThan(1e-9 * (1 + Math.abs(N[i][j])))))
      }),
      { numRuns: 500 },
    )
  })

  it("shows P1..P7 equal to Strassen's seven products and C11..C22 equal to the quadrants of AB", () => {
    fc.assert(
      fc.property(anySize, ([A, B]) => {
        const steps = generateStrassenSteps(A, B)
        const P = strassenProducts(A, B)
        for (let k = 1; k <= 7; k++) {
          const frame = steps.find((s) => s.operations?.some((o) => o.type === "multiply" && o.result === "P" + k))
          expect(frame).toBeDefined()
          expect(get(frame!, "P" + k)).toEqual(P[k - 1])
        }
        const AB = naiveProduct(A, B)
        const size = A.length % 2 === 0 ? A.length : A.length + 1
        const padded = Array.from({ length: size }, (_, i) =>
          Array.from({ length: size }, (_, j) => (i < A.length && j < A.length ? AB[i][j] : 0)),
        )
        const result = steps.at(-1)!
        const names = ["C11", "C12", "C21", "C22"]
        names.forEach((c, q) => {
          const want = quadrant(padded, q >> 1, q & 1)
          expect(get(result, c)).toEqual(want)
          const combineFrame = steps.find((s) => s.phase === "combine" && s.operations?.some((o) => o.result === c))!
          expect(get(combineFrame, c)).toEqual(want)
        })
      }),
      { numRuns: 600 },
    )
  })

  it("every frame is internally consistent", () => {
    fc.assert(
      fc.property(uiInts, ([A, B]) => {
        const steps = generateStrassenSteps(A, B)
        expect(steps.map((s) => s.phase)).toEqual([
          "initial", "divide", ...Array<string>(14).fill("compute"), ...Array<string>(4).fill("combine"), "result",
        ])
        const divide = steps[1]
        const Q: Record<string, Matrix> = {}
        for (const k of ["A11", "A12", "A21", "A22", "B11", "B12", "B21", "B22"]) Q[k] = get(divide, k)!
        expect(Q.A11).toEqual(quadrant(A, 0, 0))
        expect(Q.A12).toEqual(quadrant(A, 0, 1))
        expect(Q.B21).toEqual(quadrant(B, 1, 0))
        expect(Q.B22).toEqual(quadrant(B, 1, 1))
        for (const s of steps) {
          const keys = Object.keys(s.subMatrices ?? {})
          // highlights point at matrices that are on screen
          for (const h of s.highlightedMatrices ?? []) expect(keys).toContain(h)
          for (const [key, sm] of Object.entries(s.subMatrices ?? {})) {
            // base blocks shown anywhere equal the divide-phase blocks
            if (Q[key]) expect(sm.matrix).toEqual(Q[key])
            // "Sx = Y op Z" captions describe the matrix shown
            const m = /^(S\d+) = (\w+) ([+-]) (\w+)$/.exec(sm.name)
            if (m) {
              expect(m[1]).toBe(key)
              expect(sm.matrix).toEqual(m[3] === "+" ? plus(Q[m[2]], Q[m[4]]) : minus(Q[m[2]], Q[m[4]]))
            }
          }
          // each operation's operands are on screen or produced earlier in the same frame
          const produced = new Set<string>()
          for (const o of s.operations ?? []) {
            for (const x of o.operands) expect(keys.includes(x) || produced.has(x)).toBe(true)
            produced.add(o.result)
          }
        }
      }),
      { numRuns: 500 },
    )
  })

  it("uses seven multiplications and eighteen additions/subtractions", () => {
    fc.assert(
      fc.property(anySize, ([A, B]) => {
        const ops = generateStrassenSteps(A, B).flatMap((s) => s.operations ?? [])
        expect(ops.filter((o) => o.type === "multiply").length).toBe(7)
        expect(ops.filter((o) => o.type !== "multiply").length).toBe(18)
      }),
      { numRuns: 200 },
    )
  })

  it("parses custom input exactly and rejects malformed text", () => {
    const sep = fc.constantFrom(" ", ",", ", ", "  ", "\t", " , ")
    const mat = fc.constantFrom(2, 4, 8).chain((n) => square(n, fc.integer({ min: -999, max: 999 }).map((x) => x / 10)))
    fc.assert(
      fc.property(mat, sep, (M, s) => {
        const text = M.map((r) => r.join(s)).join("\n")
        expect(parseMatrixInput(text, M.length)).toEqual(M)
        expect(parseMatrixInput(text.replace(/\n/g, "\r\n") + "\n", M.length)).toEqual(M)
        expect(parseMatrixInput(text, M.length * 2)).toBeNull()
        // an empty first cell must not be read as 0
        const holed = M.map((r, i) => (i === 0 ? ["", ...r.slice(1)].join(",") : r.join(","))).join("\n")
        expect(parseMatrixInput(holed, M.length)).toBeNull()
      }),
      { numRuns: 300 },
    )
    expect(parseMatrixInput(",1\n2 3", 2)).toBeNull()
    expect(parseMatrixInput("1,\n2 3", 2)).toBeNull()
    expect(parseMatrixInput("Infinity 1\n1 1", 2)).toBeNull()
    expect(parseMatrixInput("1e400 1\n1 1", 2)).toBeNull()
    expect(parseMatrixInput("a 1\n1 1", 2)).toBeNull()
  })

  it("handles the default example", () => {
    const A = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]
    const B = [[17, 18, 19, 20], [21, 22, 23, 24], [25, 26, 27, 28], [29, 30, 31, 32]]
    expect(generateStrassenSteps(A, B).at(-1)!.resultMatrix).toEqual([
      [250, 260, 270, 280],
      [618, 644, 670, 696],
      [986, 1028, 1070, 1112],
      [1354, 1412, 1470, 1528],
    ])
  })
})
