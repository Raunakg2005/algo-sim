import { legacy } from "./legacy.ts"
for (const n of [8, 9]) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: "node-" + i, label: String.fromCharCode(65 + i), x: 0, y: 0, color: null }))
  const edges: { source: string; target: string }[] = []
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) edges.push({ source: nodes[a].id, target: nodes[b].id })
  const t0 = Date.now(); const r = legacy({ nodes, edges }, n - 1)
  console.log(`legacy K${n}, m=${n - 1}: frames=${r.steps.length} time=${Date.now() - t0}ms heapUsed=${(process.memoryUsage().heapUsed / 1e6).toFixed(0)}MB final="${r.steps.at(-1)!.description}"`)
}
