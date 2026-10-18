import { legacy, COLORS, COLOR_NAMES } from "./legacy.ts"
import type { Graph } from "./legacy.ts"

let seed = 777
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

function mkGraph(n: number, pairs: [number, number][]): Graph {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `node-${String.fromCharCode(65 + i)}`, label: String.fromCharCode(65 + i), x: 0, y: 0, color: null }))
  return { nodes, edges: pairs.map(([a, b]) => ({ source: nodes[a].id, target: nodes[b].id })) }
}
// chromatic number by subset DP over independent sets (independent of the backtracking code)
function chromatic(n: number, pairs: [number, number][]): number {
  const adj = new Array(n).fill(0)
  for (const [a, b] of pairs) { adj[a] |= 1 << b; adj[b] |= 1 << a }
  const N = 1 << n
  const indep = new Array(N).fill(false)
  indep[0] = true
  for (let m = 1; m < N; m++) { const low = m & -m; const v = 31 - Math.clz32(low); const rest = m ^ low; indep[m] = indep[rest] && (adj[v] & rest) === 0 }
  const dp = new Array(N).fill(Infinity)
  dp[0] = 0
  for (let m = 1; m < N; m++) {
    const low = m & -m
    for (let s = m; s; s = (s - 1) & m) if ((s & low) && indep[s] && dp[m ^ s] + 1 < dp[m]) dp[m] = dp[m ^ s] + 1
  }
  return dp[N - 1]
}

type V = { wrongVerdict: boolean; improper: boolean; tooMany: boolean; badFrame: boolean; badCaption: boolean; undefinedColour: boolean }
function check(n: number, pairs: [number, number][], m: number): V {
  const g = mkGraph(n, pairs)
  const r = legacy(g, m)
  const chi = chromatic(n, pairs)
  const last = r.steps[r.steps.length - 1]
  const found = r.solutions.length > 0
  const adjOk = (cols: { [k: string]: number | null }) => g.edges.every((e) => cols[e.source] === null || cols[e.target] === null || cols[e.source] !== cols[e.target])
  let improper = false, tooMany = false, badFrame = false, badCaption = false, undefinedColour = false
  if (found) {
    const cols = r.solutions[0]
    if (!adjOk(cols) || Object.values(cols).some((c) => c === null)) improper = true
    const used = new Set(Object.values(cols))
    if ([...used].some((c) => c === null || c < 0 || c >= m || !Number.isInteger(c))) tooMany = true
    // caption claims "using m colors"
    if (last.description.includes(`using ${m} colors`) && used.size !== m) badCaption = true
    if ([...used].some((c) => COLORS[c as number] === undefined)) undefinedColour = true
  }
  for (const s of r.steps) {
    if (!adjOk(s.nodeColors)) badFrame = true
    if (s.description.includes("undefined")) undefinedColour = true
    if (s.phase === "conflict") {
      const cur = s.currentNodeId!
      const c = s.conflictNodeId!
      const isNbr = g.edges.some((e) => (e.source === cur && e.target === c) || (e.source === c && e.target === cur))
      if (!isNbr || s.nodeColors[c] === null) badFrame = true
    }
  }
  const wrongVerdict = found !== (chi <= m)
  return { wrongVerdict, improper, tooMany, badFrame, badCaption, undefinedColour }
}

function randomPairs(n: number, p: number): [number, number][] {
  const out: [number, number][] = []
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rnd() < p) out.push(rnd() < 0.5 ? [a, b] : [b, a])
  return out
}
// replica of generateRandomGraph's edge sampler (3..8 nodes, 2..4 colours, 30-70% of the possible edges)
function uiRandom(): [number, [number, number][], number] {
  const n = ri(3, 8)
  const m = ri(2, 4)
  const maxEdges = (n * (n - 1)) / 2
  const edgeCount = Math.floor(rnd() * (maxEdges * 0.4) + maxEdges * 0.3)
  const pairs: [number, number][] = []
  for (let i = 0; i < edgeCount; i++) {
    let s: number, t: number
    do { s = ri(0, n - 1); t = ri(0, n - 1) } while (s === t || pairs.some(([a, b]) => (a === s && b === t) || (a === t && b === s)))
    pairs.push([s, t])
  }
  return [n, pairs, m]
}

function tally(name: string, gen: () => [number, [number, number][], number], runs: number) {
  const c = { wrongVerdict: 0, improper: 0, tooMany: 0, badFrame: 0, badCaption: 0, undefinedColour: 0, any: 0, colourable: 0 }
  let ex: string | null = null
  for (let k = 0; k < runs; k++) {
    const [n, pairs, m] = gen()
    if (pairs.length === 0) { k--; continue } // UI refuses to start with no edges
    const v = check(n, pairs, m)
    if (chromatic(n, pairs) <= m) c.colourable++
    for (const key of Object.keys(v) as (keyof V)[]) if (v[key]) c[key]++
    const algoFail = v.wrongVerdict || v.improper || v.tooMany || v.badFrame || v.undefinedColour
    if (algoFail) { c.any++; if (!ex) ex = JSON.stringify({ n, pairs, m, v }) }
  }
  console.log(`${name}: runs=${runs}`, JSON.stringify(c), ex ? `example ${ex}` : "")
}
tally("UI random graph", uiRandom, 20000)
tally("Typed graph n 2..10, m 1..10 (integers), density 0.1..0.9", () => { const n = ri(2, 10); return [n, randomPairs(n, 0.1 + 0.8 * rnd()), ri(1, 10)] }, 20000)

// Start-time colour count is not validated (only "Generate Graph" checks 1..10); typing into the number box afterwards is accepted
const tri: [number, number][] = [[0, 1], [1, 2], [0, 2]]
for (const m of [2.5, 11, 12, 0, -1]) {
  const r = legacy(mkGraph(3, tri), m)
  const last = r.steps[r.steps.length - 1]
  const used = r.solutions.length ? [...new Set(Object.values(r.solutions[0]))] : []
  console.log(`triangle, numColors=${m}: "${last.description}" colours used=${JSON.stringify(used)} classes=${JSON.stringify(used.map((u) => COLORS[u as number]))} undefinedCaption=${r.steps.some((s) => s.description.includes("undefined"))}`)
}
{
  const path = mkGraph(10, Array.from({ length: 9 }, (_, i) => [i, i + 1] as [number, number]))
  const r = legacy(path, 11)
  console.log("path P10 with 11 colours:", r.steps[r.steps.length - 1].description, "names tried:", COLOR_NAMES.length)
}
{
  const r = legacy(mkGraph(3, [[0, 1]]), 3)
  console.log(`caption check, A-B edge + isolated C, m=3: "${r.steps[r.steps.length - 1].description}" colours actually used=${new Set(Object.values(r.solutions[0])).size}`)
}
