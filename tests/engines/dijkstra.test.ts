import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateDijkstraSteps, validateDijkstraInput, type DijkstraGraph } from "@/lib/engines/dijkstra"
import { cheapestEdge, undirectedDistances } from "../reference/dijkstra"

const INF = Number.POSITIVE_INFINITY
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

// Anything the bulk-input parser accepts: 1..8 nodes, duplicate (parallel) edges, self-loops, weight 0.
const graphArb = (minW: number, maxW: number) =>
  fc
    .integer({ min: 1, max: 8 })
    .chain((n) =>
      fc.record({
        n: fc.constant(n),
        edges: fc.array(fc.tuple(fc.nat(n - 1), fc.nat(n - 1), fc.integer({ min: minW, max: maxW })), { maxLength: 2 * n + 2 }),
        s: fc.nat(n - 1),
        t: fc.option(fc.nat(n - 1), { nil: null }),
      }),
    )
    .map(({ n, edges, s, t }) => {
      const ids = Array.from({ length: n }, (_, i) => `node-${String.fromCharCode(65 + i)}`)
      const graph: DijkstraGraph = {
        nodes: ids.map((id) => ({ id, label: id.slice(5) })),
        edges: edges.map(([a, b, w]) => ({ source: ids[a], target: ids[b], weight: w })),
      }
      return { graph, ids, source: ids[s], target: t === null ? null : ids[t] }
    })

describe("Dijkstra engine", () => {
  it("final distances equal the oracle for every node (non-negative weights)", () => {
    fc.assert(
      fc.property(graphArb(0, 10), ({ graph, ids, source, target }) => {
        const want = undirectedDistances(ids, graph.edges, source)
        const steps = generateDijkstraSteps(graph, source, target)
        const done = steps.find((s) => s.phase === "complete")!
        for (const v of ids) expect(done.nodeStates[v].distance).toBe(want[v])
        // one select per reachable node
        const selected = steps.filter((s) => s.phase === "select").map((s) => s.currentNode)
        expect(new Set(selected).size).toBe(selected.length)
        expect(selected.length).toBe(ids.filter((v) => want[v] < INF).length)
      }),
      { numRuns: 4000 },
    )
  })

  it("every frame is consistent: no lost nodes, upper bounds only shrink, finalized distances are exact", () => {
    fc.assert(
      fc.property(graphArb(0, 10), ({ graph, ids, source, target }) => {
        const want = undirectedDistances(ids, graph.edges, source)
        const steps = generateDijkstraSteps(graph, source, target)
        let prev: Record<string, number> | null = null
        let lastFinal = -INF
        for (const s of steps) {
          ok(Object.keys(s.nodeStates).sort().join() === [...ids].sort().join(), 'node set changed')
          for (const v of ids) {
            const st = s.nodeStates[v]
            ok(typeof st.distance === "number" && !Number.isNaN(st.distance), "distance is not a number") // never null / NaN (Infinity is kept)
            ok(st.distance >= want[v], "below true distance")
            if (prev) ok(st.distance <= prev[v], "distance increased")
            if (st.visited) ok(st.distance === want[v], "finalized distance wrong")
            if (st.previous !== null) {
              const w = cheapestEdge(graph.edges, st.previous, v)
              ok(w !== undefined && s.nodeStates[st.previous].distance + w <= st.distance, "bad predecessor")
            }
          }
          if (s.phase === "select" || s.phase === "relax" || s.phase === "finalize") {
            ok(ids.includes(s.currentNode!) && s.nodeStates[s.currentNode!].current === (s.phase !== "finalize"), "current node flag")
          }
          if (s.phase === "finalize") {
            const d = s.nodeStates[s.currentNode!].distance
            ok(d >= lastFinal, "finalize order") // nodes are finalized in non-decreasing order
            lastFinal = d
          }
          if (s.phase === "relax") {
            for (const r of s.relaxedEdges!) {
              ok(r.source === s.currentNode && cheapestEdge(graph.edges, r.source, r.target) !== undefined, "relaxed edge not incident")
              ok(!s.nodeStates[r.target].visited, "relaxed a finalized node")
              if (r.improved) ok(s.nodeStates[r.target].distance <= r.newDistance, "improvement not applied")
            }
          }
          prev = Object.fromEntries(ids.map((v) => [v, s.nodeStates[v].distance]))
        }
      }),
      { numRuns: 4000 },
    )
  }, 30000)

  it("the final frame shows a real shortest path to the target (or says none exists)", () => {
    fc.assert(
      fc.property(graphArb(0, 10), ({ graph, ids, source, target }) => {
        fc.pre(target !== null)
        const want = undirectedDistances(ids, graph.edges, source)
        const steps = generateDijkstraSteps(graph, source, target)
        const f = steps[steps.length - 1]
        expect(f.phase).toBe("complete")
        if (want[target!] === INF) {
          expect(f.finalPath).toBeUndefined()
          expect(f.description).toMatch(/^No path exists/)
          return
        }
        const p = f.finalPath!
        expect(p[0]).toBe(source)
        expect(p[p.length - 1]).toBe(target)
        expect(new Set(p).size).toBe(p.length)
        let w = 0
        for (let i = 0; i + 1 < p.length; i++) w += cheapestEdge(graph.edges, p[i], p[i + 1])!
        expect(w).toBe(want[target!])
        expect(f.description).toContain(`(distance = ${want[target!]})`)
      }),
      { numRuns: 3000 },
    )
  })

  it("rejects negative weights instead of reporting wrong 'shortest' distances", () => {
    fc.assert(
      fc.property(graphArb(-5, 10), ({ graph, source, target }) => {
        const hasNeg = graph.edges.some((e) => e.weight < 0)
        expect(validateDijkstraInput(graph, source) !== null).toBe(hasNeg)
        if (hasNeg) expect(() => generateDijkstraSteps(graph, source, target)).toThrow(/non-negative/)
        else expect(() => generateDijkstraSteps(graph, source, target)).not.toThrow()
      }),
      { numRuns: 2000 },
    )
    // the legacy hang: a negative self-loop on the target made path reconstruction loop forever
    const g: DijkstraGraph = { nodes: [{ id: "node-A", label: "A" }], edges: [{ source: "node-A", target: "node-A", weight: -2 }] }
    expect(validateDijkstraInput(g, "node-A")).toMatch(/non-negative/)
    expect(validateDijkstraInput(g, null)).toBe("Please select a source node")
  })

  it("source = target gives a one-node path of distance 0", () => {
    const g: DijkstraGraph = { nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }], edges: [{ source: "a", target: "b", weight: 3 }] }
    const f = generateDijkstraSteps(g, "a", "a").at(-1)!
    expect(f.finalPath).toEqual(["a"])
    expect(f.description).toBe("Shortest path from A to A: A (distance = 0)")
  })

  it("handles the built-in example (A to F)", () => {
    const L = ["A", "B", "C", "D", "E", "F"]
    const e = (a: string, b: string, w: number) => ({ source: `node-${a}`, target: `node-${b}`, weight: w })
    const g: DijkstraGraph = {
      nodes: L.map((l) => ({ id: `node-${l}`, label: l })),
      edges: [e("A", "B", 4), e("A", "D", 2), e("B", "C", 3), e("B", "E", 3), e("C", "F", 2), e("D", "E", 5), e("E", "F", 1)],
    }
    const steps = generateDijkstraSteps(g, "node-A", "node-F")
    const f = steps[steps.length - 1]
    expect(f.finalPath).toEqual(["node-A", "node-D", "node-E", "node-F"])
    expect(Object.fromEntries(L.map((l) => [l, f.nodeStates[`node-${l}`].distance]))).toEqual({ A: 0, B: 4, C: 7, D: 2, E: 7, F: 8 })
  })
})
