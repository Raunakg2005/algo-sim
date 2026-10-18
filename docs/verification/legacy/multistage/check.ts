import { createComponent, type AlgorithmStep } from "./legacy.ts"

const rnd = (n: number) => Math.floor(Math.random() * n)
type G = ReturnType<typeof createComponent>["state"]["graph"]

const EXAMPLE: Record<string, number> = {
  "node-0-0-node-1-0": 2, "node-0-0-node-1-1": 3, "node-0-0-node-1-2": 7, "node-1-0-node-2-0": 5, "node-1-0-node-2-1": 8,
  "node-1-1-node-2-0": 4, "node-1-1-node-2-1": 6, "node-1-2-node-2-0": 3, "node-1-2-node-2-1": 2, "node-2-0-node-3-0": 6, "node-2-1-node-3-0": 4,
}
const structure = (g: G) => Array.from({ length: g.stages }, (_, s) => g.nodes.filter((n) => n.stage === s).length)

/** brute force over every stage-by-stage path; returns min cost from each stage-0 node */
function bruteFromEach(g: G): Record<string, number> {
  const out: Record<string, number> = {}
  const go = (id: string, acc: number): number => {
    const outs = g.edges.filter((e) => e.source === id)
    if (!outs.length) return g.nodes.find((n) => n.id === id)!.stage === g.stages - 1 ? acc : Infinity
    return Math.min(...outs.map((e) => go(e.target, acc + e.cost)))
  }
  for (const n of g.nodes.filter((x) => x.stage === 0)) out[n.id] = go(n.id, 0)
  return out
}

// ---- A: Load Example / Random Example buttons, from a random prior configuration
const A = { loadClicks: 0, loadWrongStructure: 0, loadWrongCosts: 0, randomClicks: 0, randomWrongStructure: 0 }
for (let t = 0; t < 3000; t++) {
  const c = createComponent()
  // a random earlier session: maybe change stage count and generate a graph
  if (rnd(2)) { c.state.numStages = 2 + rnd(5); c.act("updateNodesPerStage", 0, 1 + rnd(5)) }
  if (rnd(2)) c.act("generateGraph")
  if (t % 2 === 0) {
    c.act("loadExample")
    A.loadClicks++
    if (JSON.stringify(structure(c.state.graph)) !== "[1,3,2,1]") A.loadWrongStructure++
    if (!c.state.graph.edges.every((e) => EXAMPLE[`${e.source}-${e.target}`] === e.cost) || c.state.graph.edges.length !== 11) A.loadWrongCosts++
  } else {
    c.act("generateRandomExample")
    A.randomClicks++
    if (JSON.stringify(structure(c.state.graph)) !== JSON.stringify(c.state.nodesPerStage.slice(0, c.state.numStages))) A.randomWrongStructure++
  }
}

// ---- B: DP on every configuration the inputs accept (2..10 stages, 1..5 nodes per stage, integer costs)
const B = { runs: 0, multiSourceRuns: 0, wrongReportedOptimum: 0, wrongSingleSource: 0, pathCostMismatch: 0 }
let ex: unknown = null
for (let t = 0; t < 20000; t++) {
  const c = createComponent()
  const stages = 2 + rnd(9)
  const per = Array.from({ length: stages }, (_, i) => (i === stages - 1 ? 1 : t % 2 === 0 && i === 0 ? 1 : 1 + rnd(5)))
  c.state.numStages = stages
  c.state.nodesPerStage = per
  c.act("generateGraph") // random costs 1..20
  for (const e of c.state.graph.edges) if (rnd(3) === 0) c.act("updateEdgeCost", e.source, e.target, rnd(25) - 4)
  c.act("startAlgorithm")
  const steps: AlgorithmStep[] = c.state.steps
  const g = c.state.graph
  B.runs++
  const best = bruteFromEach(g)
  const optimum = Math.min(...Object.values(best))
  const last = steps[steps.length - 1]
  const reported = Number(last.description.split("= ").pop())
  const multi = per[0] > 1
  if (multi) B.multiSourceRuns++
  if (reported !== optimum) {
    B.wrongReportedOptimum++
    if (!multi) B.wrongSingleSource++
    const size = g.nodes.length
    if (!ex || (ex as { size: number }).size > size) ex = { size, per, edges: g.edges.map((e) => `${e.source.slice(5)}>${e.target.slice(5)}:${e.cost}`), reported, optimum, best }
  }
  const p = last.optimalPath!
  let w = 0
  for (let i = 0; i + 1 < p.length; i++) w += g.edges.find((e) => e.source === p[i] && e.target === p[i + 1])!.cost
  if (w !== reported) B.pathCostMismatch++
}
console.log(JSON.stringify({ A, B, ex }))
