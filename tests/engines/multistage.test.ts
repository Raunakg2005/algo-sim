import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  MULTISTAGE_EXAMPLE,
  buildMultistageGraph,
  generateMultistageSteps,
  multistageEdgeId,
  validateStageConfig,
  type MultistageGraph,
} from "@/lib/engines/multistage"
import { bruteForceCost, relaxationCosts } from "../reference/multistage"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}
const INF = Number.POSITIVE_INFINITY

// Every configuration the inputs accept: 2..10 stages, 1..5 nodes per stage (last = 1), integer costs
// (the cost inputs accept 0 and negative numbers too).
const graphArb = (maxStages: number) =>
  fc
    .integer({ min: 2, max: maxStages })
    .chain((stages) =>
      fc.record({
        stages: fc.constant(stages),
        per: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: stages, maxLength: stages }),
        costs: fc.array(fc.integer({ min: -5, max: 25 }), { minLength: 1, maxLength: 60 }),
      }),
    )
    .map(({ stages, per, costs }) => {
      let k = 0
      return buildMultistageGraph(stages, per, () => costs[k++ % costs.length])
    })

const oracle = (g: MultistageGraph): Record<string, number> => {
  const ids = g.nodes.map((n) => n.id)
  const terms = new Set(g.nodes.filter((n) => n.stage === g.stages - 1).map((n) => n.id))
  const paths = g.nodes.length <= 14
  return paths ? Object.fromEntries(ids.map((v) => [v, bruteForceCost(g.edges, terms, v)])) : relaxationCosts(ids, g.edges, terms)
}

describe("multistage engine", () => {
  it("costs of every node and the reported optimum equal the oracle; the path realizes it", () => {
    fc.assert(
      fc.property(graphArb(10), (g) => {
        const want = oracle(g)
        const steps = generateMultistageSteps(g)
        const last = steps[steps.length - 1]
        for (const n of g.nodes) expect(last.costs[n.id]).toBe(want[n.id])
        const optimum = Math.min(...g.nodes.filter((n) => n.stage === 0).map((n) => want[n.id]))
        expect(last.description).toBe(`Algorithm complete: Optimal cost from source to terminal = ${optimum}`)
        const p = last.optimalPath!
        expect(p.length).toBe(g.stages)
        let w = 0
        p.forEach((id, i) => {
          expect(g.nodes.find((n) => n.id === id)!.stage).toBe(i)
          if (i > 0) w += g.edges.find((e) => e.source === p[i - 1] && e.target === id)!.cost
        })
        expect(w).toBe(optimum)
      }),
      { numRuns: 3000 },
    )
  })

  it("frames: stages computed backwards, each node once, each update is the min over its successors", () => {
    fc.assert(
      fc.property(graphArb(8), (g) => {
        const steps = generateMultistageSteps(g)
        const stageOf = new Map(g.nodes.map((n) => [n.id, n.stage]))
        const updated: string[] = []
        let stage = g.stages - 1
        for (const s of steps) {
          ok(Object.keys(s.costs).length === g.nodes.length, "lost a node")
          if (s.phase !== "compute") continue
          if (s.currentNode === undefined) {
            ok(s.currentStage === stage - 1, "stages out of order")
            stage = s.currentStage
            continue
          }
          const v = s.currentNode
          ok(stageOf.get(v) === stage && s.updatedNodes?.length === 1 && s.updatedNodes[0] === v, "node / stage mismatch")
          const outs = g.edges.filter((e) => e.source === v)
          const best = Math.min(...outs.map((e) => e.cost + s.costs[e.target]))
          ok(s.costs[v] === best, "not the min over successors")
          const nx = s.prevNodes[v]!
          ok(outs.some((e) => e.target === nx && e.cost + s.costs[nx] === best), "best successor is not an argmin")
          for (const n of g.nodes) if (n.stage < stage || (n.stage === stage && !updated.includes(n.id) && n.id !== v)) ok(s.costs[n.id] === INF, "computed too early")
          updated.push(v)
        }
        ok(new Set(updated).size === updated.length && updated.length === g.nodes.length - 1, "every non-terminal updated once")
        const back = steps.filter((s) => s.phase === "backtrack")
        const final = steps[steps.length - 1].optimalPath!
        back.forEach((s, i) => ok(JSON.stringify(s.optimalPath) === JSON.stringify(final.slice(0, i + 1)) && s.currentNode === final[i], "backtrack prefix"))
        ok(back.length === final.length, "one backtrack frame per path node")
      }),
      { numRuns: 2000 },
    )
  })

  it("builds the stage structure (complete links between consecutive stages, single terminal)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 10, maxLength: 10 }), (stages, per) => {
        const g = buildMultistageGraph(stages, per, () => 1)
        const size = (s: number) => (s === stages - 1 ? 1 : per[s])
        for (let s = 0; s < stages; s++) expect(g.nodes.filter((n) => n.stage === s).length).toBe(size(s))
        let m = 0
        for (let s = 0; s + 1 < stages; s++) m += size(s) * size(s + 1)
        expect(g.edges.length).toBe(m)
        expect(g.nodes.filter((n) => n.label === "T").length).toBe(1)
      }),
      { numRuns: 500 },
    )
  })

  it("Load Example builds the 1-3-2-1 graph with its costs (optimum 13)", () => {
    const g = buildMultistageGraph(4, MULTISTAGE_EXAMPLE.nodesPerStage, (id) => MULTISTAGE_EXAMPLE.costs[id])
    expect(g.edges.length).toBe(11)
    for (const e of g.edges) expect(e.cost).toBe(MULTISTAGE_EXAMPLE.costs[multistageEdgeId(e.source, e.target)])
    const last = generateMultistageSteps(g).at(-1)!
    expect(last.description).toBe("Algorithm complete: Optimal cost from source to terminal = 13")
    expect(last.optimalPath).toEqual(["node-0-0", "node-1-0", "node-2-0", "node-3-0"])
  })

  it("picks the cheapest of several first-stage nodes (legacy reported the first one)", () => {
    // legacy counterexample: two sources S(0,0) -15-> T and S(0,1) -9-> T; legacy reported 15
    const costs: Record<string, number> = { "node-0-0-node-1-0": 15, "node-0-1-node-1-0": 9 }
    const last = generateMultistageSteps(buildMultistageGraph(2, [2, 1], (id) => costs[id])).at(-1)!
    expect(last.description.endsWith("= 9")).toBe(true)
    expect(last.optimalPath).toEqual(["node-0-1", "node-1-0"])
  })

  it("rejects stage settings the inputs could produce but the visualizer cannot draw", () => {
    expect(validateStageConfig(2.5, [1, 1, 1])).not.toBeNull()
    expect(validateStageConfig(1, [1])).not.toBeNull()
    expect(validateStageConfig(11, Array(11).fill(1))).not.toBeNull()
    expect(validateStageConfig(3, [1, 0, 1])).not.toBeNull()
    expect(validateStageConfig(3, [1, 1.5, 1])).not.toBeNull()
    expect(validateStageConfig(3, [2, 5, 1])).toBeNull()
  })
})
