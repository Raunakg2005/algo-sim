// Legacy check for MST: original lib/mst-algorithms.ts + lib/graph-utils.ts (HEAD), unchanged.
import { runKruskalsAlgorithm, runPrimsAlgorithm } from "./mst-algorithms.ts"
import { generateRandomGraph } from "./graph-utils.ts"

type N = { id: string; label: string; x: number; y: number }
type E = { source: N; target: N; weight: number }
type G = { nodes: N[]; edges: E[] }

const rnd = (n: number) => Math.floor(Math.random() * n)

// independent oracle: reverse-delete
function connected(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a) }
  const seen = new Set([0]); const st = [0]
  while (st.length) { const u = st.pop()!; for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); st.push(v) } }
  return seen.size === n
}
function oracleWeight(g: G): number {
  const n = g.nodes.length
  let es = g.edges.map((e) => ({ a: +e.source.id, b: +e.target.id, w: e.weight })).sort((x, y) => y.w - x.w)
  let i = 0
  while (i < es.length) {
    const rest = es.filter((_, k) => k !== i)
    if (connected(n, rest.map((e) => [e.a, e.b]))) es = rest
    else i++
  }
  return es.reduce((s, e) => s + e.w, 0)
}
function isSpanningTree(g: G, es: E[]): boolean {
  return es.length === g.nodes.length - 1 && connected(g.nodes.length, es.map((e) => [+e.source.id, +e.target.id]))
}

function arbitraryConnected(n: number): G {
  const nodes: N[] = Array.from({ length: n }, (_, i) => ({ id: String(i), label: String.fromCharCode(65 + i), x: 0, y: 0 }))
  const edges: E[] = []
  const has = (a: number, b: number) => edges.some((e) => (+e.source.id === a && +e.target.id === b) || (+e.source.id === b && +e.target.id === a))
  for (let i = 1; i < n; i++) { const j = rnd(i); edges.push({ source: nodes[j], target: nodes[i], weight: 1 + rnd(4) }) }
  const extra = rnd(n * (n - 1) / 2)
  for (let t = 0; t < extra; t++) { const a = rnd(n), b = rnd(n); if (a !== b && !has(a, b)) edges.push({ source: nodes[a], target: nodes[b], weight: 1 + rnd(4) }) }
  return { nodes, edges }
}

const res: Record<string, number> = { total: 0, genDisconnected: 0, genDuplicate: 0, genBadWeight: 0, kruskalWrong: 0, primWrong: 0, kruskalNotTree: 0, primNotTree: 0 }
let example: unknown = null
for (let t = 0; t < 20000; t++) {
  const fromUI = t % 2 === 0
  const g: G = fromUI ? generateRandomGraph(4 + rnd(9), [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1][rnd(8)]) : arbitraryConnected(2 + rnd(11))
  res.total++
  if (fromUI) {
    if (!connected(g.nodes.length, g.edges.map((e) => [+e.source.id, +e.target.id]))) res.genDisconnected++
    const keys = g.edges.map((e) => [e.source.id, e.target.id].sort().join("-"))
    if (new Set(keys).size !== keys.length) res.genDuplicate++
    if (g.edges.some((e) => !Number.isInteger(e.weight) || e.weight < 1 || e.weight > 20)) res.genBadWeight++
  }
  const want = oracleWeight(g)
  const k = runKruskalsAlgorithm(g as never), p = runPrimsAlgorithm(g as never, g.nodes[0] as never)
  const kl = k[k.length - 1], pl = p[p.length - 1]
  if (kl.totalWeight !== want) { res.kruskalWrong++; example ??= { g, want, got: kl.totalWeight } }
  if (pl.totalWeight !== want) { res.primWrong++; example ??= { g, want, got: pl.totalWeight } }
  if (!isSpanningTree(g, kl.mstEdges as never)) res.kruskalNotTree++
  if (!isSpanningTree(g, pl.mstEdges as never)) res.primNotTree++
}
console.log(JSON.stringify({ res, example }))
