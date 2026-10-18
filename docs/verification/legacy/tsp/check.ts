// Legacy check for TSP: the original HEAD:lib/tsp-solver.ts and lib/tsp-utils.ts, unchanged.
import { solveTSP } from "./tsp-solver.ts"
import { calculateDistances, generateRandomCities } from "./tsp-utils.ts"

const rnd = (n: number) => Math.floor(Math.random() * n)

function brute(D: number[][], s: number): number {
  const n = D.length
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== s)
  let best = Infinity
  const perm = (arr: number[], acc: number, last: number) => {
    if (!arr.length) { best = Math.min(best, acc + D[last][s]); return }
    for (let k = 0; k < arr.length; k++) perm([...arr.slice(0, k), ...arr.slice(k + 1)], acc + D[last][arr[k]], arr[k])
  }
  perm(rest, 0, s)
  return best
}

const r = { runs: 0, wrongCost: 0, badTour: 0, tourCostMismatch: 0, runsWithFakePartialEdge: 0, backtrackFrames: 0, fakePartialFrames: 0, wrongConsiderCount: 0, numericCityCaptions: 0 }
let ex: unknown = null
for (let t = 0; t < 6000; t++) {
  const mode = t % 3
  const n = mode === 0 ? 5 : 3 + rnd(6)
  let D: number[][]
  if (mode === 0) D = calculateDistances(generateRandomCities(5)) // "Generate 5 Random Cities"
  else if (mode === 1) D = calculateDistances(Array.from({ length: n }, (_, i) => ({ id: i, name: `C${i}`, x: rnd(2001) - 1000 + Math.random(), y: rnd(2001) - 1000 }))) // typed coordinates
  else { // matrix tab: symmetric non-negative integers (new cells default to 0)
    D = Array.from({ length: n }, () => Array(n).fill(0))
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = rnd(3) === 0 ? 0 : rnd(30)
  }
  const s = rnd(D.length)
  const steps = solveTSP(D, s)
  r.runs++
  const fin = steps[steps.length - 1]
  const want = brute(D, s)
  if (fin.tourCost !== want) { r.wrongCost++; ex ??= { D, s, got: fin.tourCost, want } }
  const tour = fin.tour!
  if (tour[0] !== s || new Set(tour).size !== D.length || tour.length !== D.length) r.badTour++
  let c = 0
  for (let i = 0; i < tour.length; i++) c += D[tour[i]][tour[(i + 1) % tour.length]]
  if (c !== fin.tourCost) r.tourCostMismatch++
  // tour edges (undirected, as drawn); backtrack frames must only draw edges of the final tour
  const E = new Set<string>()
  for (let i = 0; i < tour.length; i++) { const a = tour[i], b = tour[(i + 1) % tour.length]; E.add(`${Math.min(a, b)}-${Math.max(a, b)}`) }
  let fake = false
  for (const st of steps.filter((x) => x.type === "backtrack")) {
    r.backtrackFrames++
    const p = st.partialTour!
    let bad = false
    for (let i = 0; i + 1 < p.length; i++) if (!E.has(`${Math.min(p[i], p[i + 1])}-${Math.max(p[i], p[i + 1])}`)) bad = true
    if (bad) { r.fakePartialFrames++; fake = true }
  }
  if (fake) r.runsWithFakePartialEdge++
  // number of "Considering path" frames = sum over subsets S (|S|>=3, contains s), end e in S\{s}, prev in S\{s,e}
  const N = D.length
  let expected = 0
  const C = (a: number, b: number) => { let x = 1; for (let i = 0; i < b; i++) x = (x * (a - i)) / (i + 1); return x }
  for (let k = 3; k <= N; k++) expected += C(N - 1, k - 1) * (k - 1) * (k - 2)
  if (steps.filter((x) => x.message.startsWith("Considering path")).length !== expected) r.wrongConsiderCount++
  if (steps.some((x) => /city \d/.test(x.message))) r.numericCityCaptions++
}
console.log(JSON.stringify({ r, ex }))
