import { legacy } from "./legacy.ts"
import { generateGraphColoringSteps } from "file:///lib/engines/graph-coloring.ts"
let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
let same = 0, diffOnlyFinal = 0, other = 0
for (let k = 0; k < 5000; k++) {
  const n = 2 + Math.floor(rnd() * 9); const m = 1 + Math.floor(rnd() * 10); const p = 0.1 + 0.8 * rnd()
  const nodes = Array.from({ length: n }, (_, i) => ({ id: "node-" + i, label: String.fromCharCode(65 + i), x: 0, y: 0, color: null }))
  const edges: { source: string; target: string }[] = []
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rnd() < p) edges.push(rnd() < 0.5 ? { source: nodes[a].id, target: nodes[b].id } : { source: nodes[b].id, target: nodes[a].id })
  if (!edges.length) continue
  const L = legacy({ nodes, edges }, m).steps, E = generateGraphColoringSteps(nodes, edges, m).steps
  const strip = (s: any) => JSON.stringify({ ...s, description: s.phase === "complete" ? "" : s.description })
  if (L.length === E.length && L.every((s, i) => JSON.stringify(s) === JSON.stringify(E[i]))) same++
  else if (L.length === E.length && L.every((s, i) => strip(s) === strip(E[i]))) diffOnlyFinal++
  else other++
}
console.log(`graph colouring legacy vs engine: identical ${same}, differ only in final caption ${diffOnlyFinal}, other differences ${other}`)
