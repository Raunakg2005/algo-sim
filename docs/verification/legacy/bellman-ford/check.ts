import { createComponent, INFINITY, type AlgorithmStep } from "./legacy.ts"

const rnd = (n: number) => Math.floor(Math.random() * n)
const lab = (i: number) => String.fromCharCode(65 + i)

function oracle(n: number, M: number[][], s: number) {
  const d = Array(n).fill(Infinity); d[s] = 0
  const E: [number, number, number][] = []
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && Number.isFinite(M[i][j])) E.push([i, j, M[i][j]])
  for (let r = 0; r < n - 1; r++) for (const [a, b, w] of E) if (d[a] + w < d[b]) d[b] = d[a] + w
  const neg = E.some(([a, b, w]) => d[a] !== Infinity && d[a] + w < d[b])
  return { d, neg }
}

// ---- Part A: the "Random Graph" button
const A = { clicks: 0, graphDiffersFromShownMatrix: 0, shownMatrixWiped: 0, sourceOutsideGraph: 0, firstClickEdgeless: 0 }
for (let t = 0; t < 3000; t++) {
  const c = createComponent()
  const clicks = 1 + rnd(4)
  for (let k = 0; k < clicks; k++) {
    c.act("generateRandomGraph")
    A.clicks++
    const S = c.state
    const n = S.numNodes
    const allInf = S.inputMatrix.every((row, i) => row.every((v, j) => (i === j ? v === "0" : v === "∞")))
    if (allInf) A.shownMatrixWiped++
    const shownEdges = new Set<string>()
    S.inputMatrix.forEach((row, i) => row.forEach((v, j) => { if (i !== j && v !== "∞" && v !== "") shownEdges.add(`node-${lab(i)}>node-${lab(j)}:${+v}`) }))
    const graphEdges = new Set(S.graph.edges.map((e) => `${e.source}>${e.target}:${e.weight}`))
    const same = S.graph.nodes.length === n && shownEdges.size === graphEdges.size && [...shownEdges].every((e) => graphEdges.has(e))
    if (!same) A.graphDiffersFromShownMatrix++
    if (!S.graph.nodes.some((x) => x.label === S.sourceNode)) A.sourceOutsideGraph++
    if (k === 0 && S.graph.edges.length === 0) A.firstClickEdgeless++
  }
}

// ---- Part B: the algorithm on every matrix the input accepts (typed/pasted values), run via Generate Graph
const B = { runs: 0, negCycleRuns: 0, wrongDistances: 0, wrongCycleVerdict: 0, runsWithZeroShownAsInf: 0, framesWithZeroShownAsInf: 0, frames: 0, runsWithGarbagePotential: 0, garbageExample: "" as string }
let wrongEx: unknown = null
for (let t = 0; t < 20000; t++) {
  const c = createComponent()
  const uiDist = t % 2 === 0
  const n = uiDist ? 3 + rnd(4) : 2 + rnd(9)
  // set numNodes through the input (effect resets the matrix), then type each cell
  c.state.numNodes = n
  c.act("handleMatrixInputChange", 0, 0, "0") // no-op; just a render
  ;(c as unknown as { state: { inputMatrix: string[][] } }).state.inputMatrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? "0" : "∞")))
  const M: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) { M[i][j] = 0; continue }
    let v: string
    if (uiDist) v = Math.random() < 0.3 ? "∞" : String(Math.floor(Math.random() * 13) - 2)
    else v = Math.random() < 0.4 ? "∞" : String(rnd(21) - 6)
    c.act("handleMatrixInputChange", i, j, v)
    M[i][j] = v === "∞" ? Infinity : +v
  }
  const s = rnd(n)
  c.state.sourceNode = lab(s)
  c.act("generateGraph")
  c.act("startAlgorithm")
  const steps: AlgorithmStep[] = c.state.steps
  B.runs++
  const o = oracle(n, M, s)
  if (o.neg) B.negCycleRuns++
  const last = steps[steps.length - 1]
  const legacyNeg = last.phase === "negative-cycle"
  if (legacyNeg !== o.neg) { B.wrongCycleVerdict++; wrongEx ??= { M, s } }
  if (!o.neg) {
    const ok = Array.from({ length: n }, (_, i) => (last.distances[lab(i)] === INFINITY ? Infinity : last.distances[lab(i)]) === o.d[i]).every(Boolean)
    if (!ok) { B.wrongDistances++; wrongEx ??= { M, s, got: last.distances, want: o.d } }
  }
  // what the distance table renders: formatDistance(distances[x] || INFINITY)
  let zeroRun = false
  for (const st of steps) {
    B.frames++
    if (Object.values(st.distances).some((d) => (d || INFINITY) === INFINITY && d !== INFINITY)) { B.framesWithZeroShownAsInf++; zeroRun = true }
  }
  if (zeroRun) B.runsWithZeroShownAsInf++
  // "Potential new distance: formatDistance(distances[source] + weight)" on frames whose source is unreachable
  const garbage = steps.filter((st) => st.phase === "relax" && st.edge && st.distances[st.edge.source] === INFINITY && st.edge.weight !== 0)
  if (garbage.length) {
    B.runsWithGarbagePotential++
    const g = garbage[0]
    if (!B.garbageExample) B.garbageExample = `edge ${g.edge!.source}->${g.edge!.target} w=${g.edge!.weight}: shows "${String(g.distances[g.edge!.source] + g.edge!.weight)}"`
  }
}
console.log(JSON.stringify({ A, B, wrongEx }))
