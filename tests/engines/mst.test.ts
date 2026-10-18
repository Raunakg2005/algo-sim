import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { runKruskalsAlgorithm, runPrimsAlgorithm, type AlgorithmStep } from "@/lib/engines/mst"
import { generateRandomGraph, type Graph, type Node, type Edge } from "@/lib/graph-utils"
import { componentCount, isForest, msfWeightReverseDelete, mstWeightBruteForce, type WEdge } from "../reference/mst"

const mkNodes = (n: number): Node[] =>
  Array.from({ length: n }, (_, i) => ({ id: String(i), label: String.fromCharCode(65 + i), x: 0, y: 0 }))

/** Builds a simple graph: optional random spanning tree + random extra edges (no duplicates, no loops). */
function build(n: number, parents: number[], extra: [number, number][], weights: number[], connected: boolean): Graph {
  const nodes = mkNodes(n)
  const edges: Edge[] = []
  const seen = new Set<string>()
  let w = 0
  const add = (a: number, b: number) => {
    if (a === b) return
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ source: nodes[a], target: nodes[b], weight: weights[w++ % weights.length] })
  }
  if (connected) for (let i = 1; i < n; i++) add(parents[i - 1] % i, i)
  for (const [a, b] of extra) add(a % n, b % n)
  return { nodes, edges }
}

const graphArb = (maxW: number, connected = true, maxN = 12) =>
  fc
    .integer({ min: 2, max: maxN })
    .chain((n) =>
      fc.tuple(
        fc.constant(n),
        fc.array(fc.nat(1000), { minLength: n - 1, maxLength: n - 1 }),
        fc.array(fc.tuple(fc.nat(n - 1), fc.nat(n - 1)), { maxLength: (n * (n - 1)) / 2 }),
        fc.array(fc.integer({ min: 1, max: maxW }), { minLength: 1, maxLength: 80 }),
      ),
    )
    .map(([n, p, x, w]) => build(n, p, x, w, connected))

const toW = (g: Graph): WEdge[] => g.edges.map((e) => [+e.source.id, +e.target.id, e.weight])
const pairs = (es: Edge[]): [number, number][] => es.map((e) => [+e.source.id, +e.target.id])
const sum = (es: Edge[]) => es.reduce((s, e) => s + e.weight, 0)
const last = (s: AlgorithmStep[]) => s[s.length - 1]

describe("MST engine - final result", () => {
  it("Kruskal and Prim reach the oracle MST weight (weights 1..3: many ties)", () => {
    fc.assert(
      fc.property(graphArb(3), (g) => {
        const want = msfWeightReverseDelete(g.nodes.length, toW(g))
        for (const steps of [runKruskalsAlgorithm(g), runPrimsAlgorithm(g, g.nodes[0])]) {
          const f = last(steps)
          expect(f.type).toBe("complete")
          expect(f.totalWeight).toBe(want)
          expect(sum(f.mstEdges)).toBe(want)
          expect(f.mstEdges.length).toBe(g.nodes.length - 1)
          expect(componentCount(g.nodes.length, pairs(f.mstEdges))).toBe(1)
          expect(f.message).toBe("Minimum Spanning Tree is complete.")
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("matches brute-force enumeration of spanning trees on small graphs (weights 1..20)", () => {
    fc.assert(
      fc.property(graphArb(20, true, 7).filter((g) => g.edges.length <= 12), (g) => {
        const want = mstWeightBruteForce(g.nodes.length, toW(g))
        expect(last(runKruskalsAlgorithm(g)).totalWeight).toBe(want)
        for (const start of g.nodes) expect(last(runPrimsAlgorithm(g, start)).totalWeight).toBe(want)
      }),
      { numRuns: 1500 },
    )
  })

  it("on a disconnected graph Kruskal returns a minimum spanning forest and says so", () => {
    fc.assert(
      fc.property(graphArb(5, false), (g) => {
        const n = g.nodes.length
        const comps = componentCount(n, pairs(g.edges))
        const k = last(runKruskalsAlgorithm(g))
        expect(k.totalWeight).toBe(msfWeightReverseDelete(n, toW(g)))
        expect(k.mstEdges.length).toBe(n - comps)
        expect(k.message.includes("disconnected")).toBe(comps > 1)
        const p = last(runPrimsAlgorithm(g, g.nodes[0]))
        expect(isForest(n, pairs(p.mstEdges))).toBe(true)
        expect(p.message.includes("disconnected")).toBe(comps > 1)
      }),
      { numRuns: 1500 },
    )
  })
})

describe("MST engine - every frame", () => {
  it("Kruskal: edges examined in non-decreasing weight, add iff endpoints in different trees", () => {
    fc.assert(
      fc.property(graphArb(4), (g) => {
        const n = g.nodes.length
        const steps = runKruskalsAlgorithm(g)
        expect(steps[0].type).toBe("initial")
        expect(steps[1].type).toBe("sort")
        expect(steps[1].highlightedEdges.map((e) => e.weight)).toEqual(g.edges.map((e) => e.weight).sort((a, b) => a - b))
        let prevW = -Infinity
        let forest: Edge[] = []
        for (let i = 2; i < steps.length - 1; i++) {
          const s = steps[i]
          expect(isForest(n, pairs(s.mstEdges))).toBe(true)
          if (s.type === "check") {
            const e = s.highlightedEdges[0]
            expect(e.weight).toBeGreaterThanOrEqual(prevW)
            prevW = e.weight
            expect(s.mstEdges).toEqual(forest)
            const next = steps[i + 1]
            expect(next.highlightedEdges[0]).toBe(e)
            const wouldCycle = !isForest(n, pairs([...forest, e]))
            expect(next.type).toBe(wouldCycle ? "skip" : "add")
            if (!wouldCycle) {
              expect(next.mstEdges).toEqual([...forest, e])
              expect(next.totalWeight).toBe(sum(next.mstEdges))
              forest = next.mstEdges
            } else expect(next.mstEdges).toEqual(forest)
          }
        }
      }),
      { numRuns: 1500 },
    )
  })

  it("Prim: the tree stays connected and each added edge is a minimum crossing edge", () => {
    fc.assert(
      fc.property(graphArb(4), fc.nat(), (g, startPick) => {
        const n = g.nodes.length
        const start = g.nodes[startPick % n]
        const steps = runPrimsAlgorithm(g, start)
        let inTree = new Set([start.id])
        let checked: Edge[] = []
        for (const s of steps.slice(2, -1)) {
          if (s.type === "check") {
            checked.push(s.highlightedEdges[0])
            continue
          }
          expect(s.type).toBe("add")
          const crossing = g.edges.filter((e) => inTree.has(e.source.id) !== inTree.has(e.target.id))
          expect(checked).toEqual(crossing) // every crossing edge is examined exactly once per round
          const e = s.highlightedEdges[0]
          expect(e.weight).toBe(Math.min(...crossing.map((c) => c.weight)))
          inTree = new Set([...inTree, e.source.id, e.target.id])
          expect(inTree.size).toBe(s.mstEdges.length + 1)
          expect(componentCount(n, pairs(s.mstEdges)) - (n - inTree.size)).toBe(1)
          expect(s.totalWeight).toBe(sum(s.mstEdges))
          checked = []
        }
        expect(inTree.size).toBe(n)
      }),
      { numRuns: 1500 },
    )
  })
})

describe("graph generator used by the UI", () => {
  it("always yields a connected simple graph with integer weights 1..20", () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 12 }), fc.integer({ min: 3, max: 10 }), (n, d) => {
        const g = generateRandomGraph(n, d / 10)
        expect(g.nodes.length).toBe(n)
        expect(componentCount(n, pairs(g.edges))).toBe(1)
        const keys = g.edges.map((e) => [e.source.id, e.target.id].sort().join("-"))
        expect(new Set(keys).size).toBe(keys.length)
        for (const e of g.edges) {
          expect(e.source.id).not.toBe(e.target.id)
          expect(Number.isInteger(e.weight) && e.weight >= 1 && e.weight <= 20).toBe(true)
        }
      }),
      { numRuns: 2000 },
    )
  })
})
