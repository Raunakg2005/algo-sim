import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  INFINITY,
  generateBellmanFordSteps,
  isMatrixEntryInput,
  parseWeightMatrix,
  reconstructBellmanFordPath,
  type BellmanFordEdge,
} from "@/lib/engines/bellman-ford"
import { bellmanFordReference, bruteForceShortestPaths } from "../reference/bellman-ford"

const lab = (i: number) => String.fromCharCode(65 + i)
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

// Every matrix the input form accepts: 2..10 nodes, integer weights (negative allowed) or ∞.
const matrixArb = (maxN: number, pInf: number) =>
  fc
    .integer({ min: 2, max: maxN })
    .chain((n) =>
      fc.record({
        n: fc.constant(n),
        cells: fc.array(fc.option(fc.integer({ min: -6, max: 14 }), { freq: Math.round(1 / pInf) - 1, nil: null }), {
          minLength: n * n,
          maxLength: n * n,
        }),
        s: fc.nat(n - 1),
      }),
    )
    .map(({ n, cells, s }) => {
      const text = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? "0" : cells[i * n + j] === null ? "∞" : String(cells[i * n + j]))),
      )
      const M = text.map((row, i) => row.map((v, j) => (i === j ? 0 : v === "∞" ? Number.POSITIVE_INFINITY : Number(v))))
      const parsed = parseWeightMatrix(text, n)
      if ("error" in parsed) throw new Error(parsed.error)
      return { n, M, text, edges: parsed.edges, s, labels: Array.from({ length: n }, (_, i) => lab(i)) }
    })

const run = (labels: string[], edges: BellmanFordEdge[], s: number) => generateBellmanFordSteps(labels, edges, lab(s))

describe("Bellman-Ford engine - final result", () => {
  it("matches brute force (simple paths + simple cycles) on small graphs", () => {
    fc.assert(
      fc.property(matrixArb(6, 0.35), ({ M, labels, edges, s }) => {
        const want = bruteForceShortestPaths(M, s)
        const steps = run(labels, edges, s)
        const last = steps[steps.length - 1]
        expect(last.phase).toBe(want.negativeCycle ? "negative-cycle" : "complete")
        if (!want.negativeCycle) expect(labels.map((l) => last.distances[l])).toEqual(want.dist)
      }),
      { numRuns: 4000 },
    )
  })

  it("matches the textbook algorithm on up to 10 nodes, with the full step count", () => {
    fc.assert(
      fc.property(matrixArb(10, 0.5), ({ n, M, labels, edges, s }) => {
        const want = bellmanFordReference(M, s)
        const steps = run(labels, edges, s)
        const last = steps[steps.length - 1]
        expect(last.phase).toBe(want.negativeCycle ? "negative-cycle" : "complete")
        if (!want.negativeCycle) {
          expect(labels.map((l) => last.distances[l])).toEqual(want.dist)
          // |V| passes over all edges (the last pass is the detection pass)
          expect(steps.filter((x) => x.phase === "relax").length).toBe(n * edges.length)
        }
      }),
      { numRuns: 2000 },
    )
  })
})

describe("Bellman-Ford engine - every frame", () => {
  it("frames are consistent: upper bounds only shrink, predecessors are real edges, updates follow their relax frame", () => {
    fc.assert(
      fc.property(matrixArb(7, 0.4), ({ n, M, labels, edges, s }) => {
        const want = bruteForceShortestPaths(M, s)
        const steps = run(labels, edges, s)
        ok(steps[0].phase === "init" && steps[0].distances[lab(s)] === 0, "init frame")
        let prev = steps[0].distances
        let prevIter = 0
        for (let k = 1; k < steps.length; k++) {
          const st = steps[k]
          ok(st.iteration >= prevIter && st.iteration >= 1 && st.iteration <= n, "iteration out of order")
          prevIter = st.iteration
          ok(Object.keys(st.distances).length === n, "lost a node")
          for (const l of labels) {
            const d = st.distances[l]
            ok(d === INFINITY || (Number.isInteger(d) && Math.abs(d) < 1e6), `bad distance ${d}`)
            ok(d <= prev[l], "distance increased")
            if (!want.negativeCycle) ok(d >= want.dist[labels.indexOf(l)], "distance below the true shortest path")
            const p = st.predecessors[l]
            if (p !== null) {
              const w = M[labels.indexOf(p)][labels.indexOf(l)]
              ok(Number.isFinite(w) && st.distances[p] + w <= d, "predecessor is not a tight edge")
            }
          }
          ok(!/\d{12,}/.test(st.description), "sentinel arithmetic leaked into a caption")
          ok(st.phase === "complete" || st.edge !== undefined, "relax/update frames name their edge")
          if (st.phase === "update") {
            const r = steps[k - 1]
            ok(r.phase === "relax" && r.edge!.source === st.edge!.source && r.edge!.target === st.edge!.target, "update without relax")
            const t = st.edge!.target
            ok(st.distances[t] === r.distances[st.edge!.source] + st.edge!.weight, "update value")
            ok(st.previousDistances![t] === r.distances[t] && st.distances[t] < r.distances[t], "previous distance")
            ok(st.iteration < n, "update in the detection pass")
          }
          if (st.phase === "negative-cycle") ok(k === steps.length - 1 && st.iteration === n, "cycle frame position")
          if (st.phase !== "complete") prev = st.distances
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("reconstructed paths are real paths whose weight equals the final distance", () => {
    fc.assert(
      fc.property(matrixArb(8, 0.4), ({ M, labels, edges, s }) => {
        const steps = run(labels, edges, s)
        const last = steps[steps.length - 1]
        fc.pre(last.phase === "complete")
        for (const t of labels) {
          const path = reconstructBellmanFordPath(last, t)
          if (last.distances[t] === INFINITY) {
            expect(path).toEqual([])
            continue
          }
          expect(path[0]).toBe(lab(s))
          expect(path[path.length - 1]).toBe(t)
          let w = 0
          for (let i = 0; i + 1 < path.length; i++) w += M[labels.indexOf(path[i])][labels.indexOf(path[i + 1])]
          expect(w).toBe(last.distances[t])
        }
      }),
      { numRuns: 2000 },
    )
  })
})

describe("matrix input", () => {
  it("lets a negative number be typed character by character and rejects incomplete entries", () => {
    for (const partial of ["", "-", "-1", "-12", "7", "∞"]) expect(isMatrixEntryInput(partial)).toBe(true)
    for (const bad of ["--", "1-", "a", "1.5", "∞1"]) expect(isMatrixEntryInput(bad)).toBe(false)
    expect(parseWeightMatrix([["0", "-"], ["∞", "0"]], 2)).toEqual({ error: "Invalid value at position (1, 2). Please enter a number or ∞." })
    expect(parseWeightMatrix([["0", "-3"], ["", "0"]], 2)).toEqual({ edges: [{ source: "A", target: "B", weight: -3 }] })
  })

  it("source distance 0 stays 0 (it is not a falsy 'missing' value) and a 2-cycle of weight -1 is detected", () => {
    const steps = generateBellmanFordSteps(["A", "B"], [{ source: "A", target: "B", weight: 1 }, { source: "B", target: "A", weight: -2 }], "A")
    expect(steps[0].distances).toEqual({ A: 0, B: INFINITY })
    expect(steps[steps.length - 1].phase).toBe("negative-cycle")
  })
})
