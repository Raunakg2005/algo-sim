import { legacy } from "./legacy.ts"

type Node = { id: string; label: string; x: number; y: number }
type Edge = { source: string; target: string; weight: number }
type Graph = { nodes: Node[]; edges: Edge[] }
const rnd = (n: number) => Math.floor(Math.random() * n)
const mk = (labels: string[]): Node[] => labels.map((l) => ({ id: `node-${l}`, label: l, x: 0, y: 0 }))

function example(): Graph {
  return {
    nodes: mk(["A", "B", "C", "D", "E", "F"]),
    edges: [
      { source: "node-A", target: "node-B", weight: 4 }, { source: "node-A", target: "node-D", weight: 2 },
      { source: "node-B", target: "node-C", weight: 3 }, { source: "node-B", target: "node-E", weight: 3 },
      { source: "node-C", target: "node-F", weight: 2 }, { source: "node-D", target: "node-E", weight: 5 },
      { source: "node-E", target: "node-F", weight: 1 },
    ],
  }
}
// copy of randomGraph() (positions dropped)
function uiRandom(): Graph {
  const nodeCount = Math.floor(Math.random() * 4) + 5
  const nodes = mk(Array.from({ length: nodeCount }, (_, i) => String.fromCharCode(65 + i)))
  const edges: Edge[] = []
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2
  const edgeCount = Math.floor(Math.random() * (maxEdges * 0.3) + maxEdges * 0.3)
  for (let i = 0; i < edgeCount; i++) {
    let source: number, target: number
    do { source = Math.floor(Math.random() * nodeCount); target = Math.floor(Math.random() * nodeCount) } while (
      source === target || edges.some((e) => (e.source === nodes[source].id && e.target === nodes[target].id) || (e.source === nodes[target].id && e.target === nodes[source].id)))
    edges.push({ source: nodes[source].id, target: nodes[target].id, weight: Math.floor(Math.random() * 10) + 1 })
  }
  return { nodes, edges }
}
// anything the bulk-input parser accepts (duplicates, self-loops, 0 and negative weights)
function bulk(neg: boolean): Graph {
  const n = 1 + rnd(7)
  const nodes = mk(Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i)))
  const edges: Edge[] = []
  const m = rnd(n * 2 + 1)
  for (let i = 0; i < m; i++) edges.push({ source: nodes[rnd(n)].id, target: nodes[rnd(n)].id, weight: neg ? rnd(16) - 5 : rnd(11) })
  return { nodes, edges }
}

function oracleNonNeg(g: Graph, s: string): Record<string, number> {
  const d: Record<string, number> = {}
  for (const v of g.nodes) d[v.id] = v.id === s ? 0 : Infinity
  for (let r = 0; r < g.nodes.length; r++)
    for (const e of g.edges) {
      if (d[e.source] + e.weight < d[e.target]) d[e.target] = d[e.source] + e.weight
      if (d[e.target] + e.weight < d[e.source]) d[e.source] = d[e.target] + e.weight
    }
  return d
}
function simplePathMin(g: Graph, s: string, t: string): number {
  let best = Infinity
  const seen = new Set<string>([s])
  const go = (u: string, acc: number) => {
    if (u === t) { best = Math.min(best, acc); return }
    for (const e of g.edges) {
      const v = e.source === u ? e.target : e.target === u ? e.source : null
      if (v && !seen.has(v)) { seen.add(v); go(v, acc + e.weight); seen.delete(v) }
    }
  }
  go(s, 0)
  return best
}

const r = { nullDistanceRuns: 0, nullDistanceFrames: 0, frames: 0, hang: 0, runsNonNeg: 0, wrongDist: 0, badPath: 0, missingPathFrame: 0, sourceEqTargetNoResult: 0, runsNeg: 0, negAccepted: 0, negWrongClaim: 0 }
const ex: Record<string, unknown> = {}
for (let t = 0; t < 30000; t++) {
  const kind = t % 4
  const g = kind === 0 ? (t % 40 === 0 ? example() : uiRandom()) : kind === 3 ? bulk(true) : bulk(false)
  const ids = g.nodes.map((n) => n.id)
  const s = kind === 0 ? ids[0] : ids[rnd(ids.length)]
  const tg = kind === 0 ? ids[ids.length - 1] : rnd(4) === 0 ? null : ids[rnd(ids.length)]
  let res: ReturnType<typeof legacy>
  try { res = legacy(g, s, tg) } catch (e) { r.hang++; r.runsNeg++; const cur = ex.hang as { g: Graph } | undefined; if (!cur || cur.g.edges.length + cur.g.nodes.length > g.edges.length + g.nodes.length) ex.hang = { g, s, tg }; continue }
  const { steps, error } = res
  const isNull = steps.map((x) => Object.values(x.nodeStates).some((ns) => ns.distance === null))
  r.frames += steps.length; r.nullDistanceFrames += isNull.filter(Boolean).length; if (isNull.some(Boolean)) r.nullDistanceRuns++
  for (const x of steps) for (const ns of Object.values(x.nodeStates)) if (ns.distance === null) ns.distance = Infinity
  const last = steps.filter((x) => x.phase === "complete")[0]
  const fin = last.nodeStates
  const hasNeg = g.edges.some((e) => e.weight < 0)
  if (!hasNeg) {
    r.runsNonNeg++
    const want = oracleNonNeg(g, s)
    if (ids.some((v) => fin[v].distance !== want[v])) { r.wrongDist++; ex.wrongDist ??= { g, s } }
    if (tg && tg !== s && want[tg] < Infinity) {
      const pf = steps[steps.length - 1]
      if (!pf.finalPath) { r.missingPathFrame++; ex.missingPathFrame ??= { g, s, tg } }
      else {
        let w = 0, ok = pf.finalPath[0] === s && pf.finalPath[pf.finalPath.length - 1] === tg
        for (let i = 0; i + 1 < pf.finalPath.length; i++) {
          const a = pf.finalPath[i], b = pf.finalPath[i + 1]
          const cand = g.edges.filter((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a)).map((e) => e.weight)
          if (!cand.length) ok = false
          else w += Math.min(...cand)
        }
        if (!ok || w !== want[tg]) { r.badPath++; ex.badPath ??= { g, s, tg, path: pf.finalPath } }
      }
    }
    if (tg && tg === s && steps[steps.length - 1].phase === "complete" && !/path|No path/.test(steps[steps.length - 1].description)) r.sourceEqTargetNoResult++
  } else {
    r.runsNeg++
    if (!error) r.negAccepted++
    // distances that the frames call "shortest distance" vs. the best simple path
    const wrong = ids.some((v) => fin[v].distance !== Infinity && fin[v].distance !== simplePathMin(g, s, v))
    if (wrong) {
      r.negWrongClaim++
      if (!ex.neg || (ex.neg as { g: Graph }).g.edges.length > g.edges.length || (ex.neg as { g: Graph }).g.nodes.length > g.nodes.length) ex.neg = { g, s, claimed: Object.fromEntries(ids.map((v) => [v, fin[v].distance])) }
    }
  }
}
console.log(JSON.stringify({ r, ex }, null, 0))
