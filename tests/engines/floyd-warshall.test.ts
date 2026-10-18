import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  INFINITY,
  generateFloydWarshallSteps,
  isMatrixEntryInput,
  parseDistanceMatrix,
  reconstructFloydWarshallPath,
} from "@/lib/engines/floyd-warshall"
import { allPairsDijkstra, pathWeight } from "../reference/floyd-warshall"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

// Every matrix the input form accepts: 2..10 nodes, non-negative integers (0 allowed) or ∞.
const matrixArb = (maxN: number) =>
  fc
    .integer({ min: 2, max: maxN })
    .chain((n) =>
      fc.record({
        n: fc.constant(n),
        cells: fc.array(fc.option(fc.integer({ min: 0, max: 12 }), { freq: 2, nil: null }), { minLength: n * n, maxLength: n * n }),
      }),
    )
    .map(({ n, cells }) => {
      const text = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? "0" : cells[i * n + j] === null ? "∞" : String(cells[i * n + j]))),
      )
      const parsed = parseDistanceMatrix(text, n)
      if ("error" in parsed) throw new Error(parsed.error)
      return { n, M: parsed.matrix }
    })

/** shortest distances using only intermediate vertices < limit (reference DP state D_limit) */
function restricted(M: number[][], limit: number): number[][] {
  const n = M.length
  return Array.from({ length: n }, (_, s) => {
    const d = new Array<number>(n).fill(INFINITY)
    const done = new Array<boolean>(n).fill(false)
    d[s] = 0
    for (;;) {
      let u = -1
      for (let v = 0; v < n; v++) if (!done[v] && d[v] < INFINITY && (u === -1 || d[v] < d[u])) u = v
      if (u === -1) break
      done[u] = true
      if (u !== s && u >= limit) continue // may end here but not pass through
      for (let v = 0; v < n; v++) if (v !== u && M[u][v] < INFINITY && d[u] + M[u][v] < d[v]) d[v] = d[u] + M[u][v]
    }
    return d
  })
}

describe("Floyd-Warshall engine", () => {
  it("final matrix equals all-pairs Dijkstra", () => {
    fc.assert(
      fc.property(matrixArb(10), ({ M }) => {
        const steps = generateFloydWarshallSteps(M)
        expect(steps[steps.length - 1].distanceMatrix).toEqual(allPairsDijkstra(M))
      }),
      { numRuns: 3000 },
    )
  })

  it("visits (k, i, j) in order, one compare frame each, and after round k holds the DP state D_k", () => {
    fc.assert(
      fc.property(matrixArb(7), ({ n, M }) => {
        const steps = generateFloydWarshallSteps(M)
        const compares = steps.filter((s) => s.phase === "compare")
        ok(compares.length === n * n * n, "compare frame count")
        compares.forEach((s, idx) => ok(s.k === Math.floor(idx / (n * n)) && s.i === Math.floor(idx / n) % n && s.j === idx % n, "order"))
        const truth = allPairsDijkstra(M)
        let prev = steps[0].distanceMatrix
        ok(JSON.stringify(prev) === JSON.stringify(M), "init frame")
        for (let x = 1; x < steps.length; x++) {
          const s = steps[x]
          const D = s.distanceMatrix
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ok(D[i][j] <= prev[i][j] && D[i][j] >= truth[i][j], "monotone upper bound")
          if (s.phase === "compare") {
            ok(Array.isArray(s.previousMatrix) && JSON.stringify(s.previousMatrix) === JSON.stringify(D), "compare previousMatrix")
            const fin = D[s.i!][s.k] < INFINITY && D[s.k][s.j!] < INFINITY
            ok(fin ? s.newDistance === D[s.i!][s.k] + D[s.k][s.j!] : s.newDistance === undefined, "newDistance")
            // entering round k: the matrix is the DP state with intermediates < k
            if (s.i === 0 && s.j === 0) ok(JSON.stringify(D) === JSON.stringify(restricted(M, s.k)), `D_${s.k} invariant`)
          }
          if (s.phase === "update") {
            const c = steps[x - 1]
            ok(c.phase === "compare" && c.k === s.k && c.i === s.i && c.j === s.j, "update follows its compare frame")
            const P = s.previousMatrix!
            ok(Array.isArray(P) && P.every((r) => Array.isArray(r)), "previousMatrix is a matrix")
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) ok(i === s.i && j === s.j ? D[i][j] === s.newDistance && D[i][j] < P[i][j] : D[i][j] === P[i][j], "only (i,j) changes")
          }
          prev = D
        }
        ok(JSON.stringify(steps[steps.length - 1].distanceMatrix) === JSON.stringify(restricted(M, n)), "D_n")
      }),
      { numRuns: 1500 },
    )
  }, 30000)

  it("reconstructed paths are real directed paths whose weight is the shortest distance", () => {
    fc.assert(
      fc.property(matrixArb(10), ({ n, M }) => {
        const D = generateFloydWarshallSteps(M).at(-1)!.distanceMatrix
        for (let s = 0; s < n; s++)
          for (let t = 0; t < n; t++) {
            const p = reconstructFloydWarshallPath(M, D, s, t)
            if (D[s][t] === INFINITY) ok(p.length === 0, "path to unreachable node")
            else if (s === t) ok(p.length === 1 && p[0] === s, "self path")
            else {
              ok(p[0] === s && p[p.length - 1] === t && new Set(p).size === p.length, "endpoints / simple")
              ok(pathWeight(M, p) === D[s][t], `path weight ${pathWeight(M, p)} != ${D[s][t]}`)
            }
          }
      }),
      { numRuns: 3000 },
    )
  })

  it("shows the whole path when it has several intermediate nodes (legacy showed A → B → D)", () => {
    const M = [
      [0, 1, INFINITY, INFINITY],
      [INFINITY, 0, 1, INFINITY],
      [INFINITY, INFINITY, 0, 1],
      [INFINITY, INFINITY, INFINITY, 0],
    ]
    const D = generateFloydWarshallSteps(M).at(-1)!.distanceMatrix
    expect(reconstructFloydWarshallPath(M, D, 0, 3)).toEqual([0, 1, 2, 3])
    expect(reconstructFloydWarshallPath(M, D, 1, 1)).toEqual([1])
    expect(reconstructFloydWarshallPath(M, D, 3, 0)).toEqual([])
  })

  it("parses only what the matrix input accepts", () => {
    for (const v of ["", "∞", "0", "12"]) expect(isMatrixEntryInput(v)).toBe(true)
    for (const v of ["-1", "1.5", "a", "-"]) expect(isMatrixEntryInput(v)).toBe(false)
    expect(parseDistanceMatrix([["0", "x"], ["", "0"]], 2)).toEqual({ error: "Invalid value at position (1, 2). Please enter a number or ∞." })
    expect(parseDistanceMatrix([["0", "3"], ["", "0"]], 2)).toEqual({ matrix: [[0, 3], [INFINITY, 0]] })
  })
})
