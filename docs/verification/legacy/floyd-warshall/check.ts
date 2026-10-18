import { createComponent, INFINITY, type AlgorithmStep } from "./legacy.ts"

const rnd = (n: number) => Math.floor(Math.random() * n)
const lab = (i: number) => String.fromCharCode(65 + i)

function oracle(M: number[][]): number[][] {
  // all-pairs by running a simple label-correcting search from every source (not Floyd-Warshall)
  const n = M.length
  return Array.from({ length: n }, (_, s) => {
    const d = Array(n).fill(Infinity); d[s] = 0
    for (let r = 0; r < n; r++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && d[i] + M[i][j] < d[j]) d[j] = d[i] + M[i][j]
    return d
  })
}

// ---- Part A: Random Graph button
const A = { clicks: 0, graphDiffersFromShownMatrix: 0, shownMatrixWiped: 0, firstClickEdgeless: 0 }
for (let t = 0; t < 3000; t++) {
  const c = createComponent()
  const clicks = 1 + rnd(4)
  for (let k = 0; k < clicks; k++) {
    c.act("generateRandomGraph")
    A.clicks++
    const S = c.state
    const allInf = S.inputMatrix.every((row, i) => row.every((v, j) => (i === j ? v === "0" : v === "∞")))
    if (allInf) A.shownMatrixWiped++
    const shown = new Set<string>()
    S.inputMatrix.forEach((row, i) => row.forEach((v, j) => { if (i !== j && v !== "∞" && v !== "") shown.add(`node-${lab(i)}>node-${lab(j)}:${+v}`) }))
    const ge = new Set(S.graph.edges.map((e) => `${e.source}>${e.target}:${e.weight}`))
    if (!(S.graph.nodes.length === S.numNodes && shown.size === ge.size && [...shown].every((e) => ge.has(e)))) A.graphDiffersFromShownMatrix++
    if (k === 0 && S.graph.edges.length === 0) A.firstClickEdgeless++
  }
}

// ---- Part B: algorithm + path reconstruction on every matrix the input accepts (non-negative integers or ∞)
const B = { runs: 0, wrongFinal: 0, frames: 0, compareFramesShowingZeroAsInf: 0, runsWithZeroAsInf: 0, updateFramesPrevMatrixNotArray: 0,
  pairsWithPath: 0, wrongPaths: 0, runsWithWrongPath: 0, selfPairsShownAsTwoNodes: 0 }
let pathEx: { M: number[][]; s: string; t: string; shown: string[]; dist: number } | null = null
for (let t = 0; t < 20000; t++) {
  const c = createComponent()
  const uiDist = t % 2 === 0
  const n = uiDist ? 3 + rnd(4) : 2 + rnd(9)
  c.state.numNodes = n
  c.state.inputMatrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? "0" : "∞")))
  const M: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity))
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) { M[i][j] = 0; continue }
    const v = uiDist ? (Math.random() < 0.3 ? "∞" : String(Math.floor(Math.random() * 10) + 1)) : Math.random() < 0.45 ? "∞" : String(rnd(8))
    c.act("handleMatrixInputChange", i, j, v)
    M[i][j] = v === "∞" ? Infinity : +v
  }
  c.act("generateGraph")
  c.act("startAlgorithm")
  const steps: AlgorithmStep[] = c.state.steps
  B.runs++
  const want = oracle(M)
  const fin = steps[steps.length - 1].distanceMatrix.map((r) => r.map((x) => (x === INFINITY ? Infinity : x)))
  if (JSON.stringify(fin) !== JSON.stringify(want)) B.wrongFinal++
  let zero = false
  for (const st of steps) {
    B.frames++
    // "New path distance: formatDistance(newDistance || INFINITY)"
    if (st.phase === "compare" && st.newDistance === 0) { B.compareFramesShowingZeroAsInf++; zero = true }
    if (st.phase === "update" && !Array.isArray(st.previousMatrix)) B.updateFramesPrevMatrixNotArray++
  }
  if (zero) B.runsWithZeroAsInf++
  // path reconstruction for every ordered pair
  c.state.currentStep = steps.length - 1
  let bad = false
  for (let s = 0; s < n; s++) for (let tt = 0; tt < n; tt++) {
    if (want[s][tt] === Infinity) continue
    c.act("handlePathSelection", lab(s), lab(tt))
    const p = c.state.pathNodes
    if (s === tt) { if (p.length !== 1) B.selfPairsShownAsTwoNodes++; continue }
    B.pairsWithPath++
    let w = 0, ok = p[0] === lab(s) && p[p.length - 1] === lab(tt)
    for (let i = 0; i + 1 < p.length; i++) {
      const a = p[i].charCodeAt(0) - 65, b = p[i + 1].charCodeAt(0) - 65
      if (!Number.isFinite(M[a][b]) || a === b) ok = false
      else w += M[a][b]
    }
    if (!ok || w !== want[s][tt]) {
      B.wrongPaths++; bad = true
      if (!pathEx || n < pathEx.M.length || (n === pathEx.M.length && p.length < pathEx.shown.length)) pathEx = { M, s: lab(s), t: lab(tt), shown: [...p], dist: want[s][tt] }
    }
  }
  if (bad) B.runsWithWrongPath++
}
console.log(JSON.stringify({ A, B, pathEx: pathEx && { ...pathEx, M: pathEx.M.map((r) => r.map((x) => (x === Infinity ? "∞" : x))) } }))
