// Time to pre-compute the complete step trace of each module, at the largest input its UI accepts
// ("max") and at a larger stress size where the UI has no limit. Median of RUNS after WARMUP runs.
// Also records the number of frames and the size of the trace as JSON. Writes bench/results.json.
import { it } from "vitest"
import { writeFileSync } from "node:fs"
import os from "node:os"
import { performance } from "node:perf_hooks"
import { generateMergeSortSteps } from "@/lib/engines/merge-sort"
import { generateQuickSortSteps } from "@/lib/engines/quick-sort"
import { generateHeapSortSteps } from "@/lib/engines/heap-sort"
import { generateSelectionSortSteps } from "@/lib/engines/selection-sort"
import { generateInsertionSortSteps } from "@/lib/engines/insertion-sort"
import { generateMaxMinSteps } from "@/lib/engines/max-min"
import { generateStrassenSteps } from "@/lib/engines/strassen"
import { generateMatrixChainSteps } from "@/lib/engines/matrix-chain"
import { generateKnapsackSteps } from "@/lib/engines/knapsack-01"
import { generateFractionalKnapsackFrames } from "@/lib/engines/fractional-knapsack"
import { generateJobSchedulingFrames } from "@/lib/engines/job-scheduling"
import { generateDijkstraSteps } from "@/lib/engines/dijkstra"
import { generateBellmanFordSteps } from "@/lib/engines/bellman-ford"
import { generateFloydWarshallSteps } from "@/lib/engines/floyd-warshall"
import { runKruskalsAlgorithm, runPrimsAlgorithm } from "@/lib/engines/mst"
import { solveTSP } from "@/lib/engines/tsp"
import { generateRandomGraph } from "@/lib/graph-utils"

const WARMUP = 5
const RUNS = 51

// deterministic pseudo-random numbers (mulberry32) so every run benchmarks the same inputs
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r = rng(20261018)
const ints = (n: number, lo = 0, hi = 99) => Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)))
const matrix = (n: number) => Array.from({ length: n }, () => ints(n, -9, 9))
const labels = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i))
const denseEdges = (n: number) => {
  const L = labels(n), e: { source: string; target: string; weight: number }[] = []
  for (const a of L) for (const b of L) if (a !== b && r() < 0.5) e.push({ source: a, target: b, weight: 1 + Math.floor(r() * 20) })
  return e
}
const distMatrix = (n: number) =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : r() < 0.5 ? 1 + Math.floor(r() * 20) : Infinity)))
const tspMatrix = (n: number) => {
  const p = Array.from({ length: n }, () => [r() * 100, r() * 100])
  return p.map((a) => p.map((b) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]))))
}

type Case = { module: string; size: string; ui: "max" | "stress"; run: () => unknown[] }
const cases: Case[] = []
const add = (module: string, size: string, ui: Case["ui"], run: () => unknown[]) => cases.push({ module, size, ui, run })

for (const [n, ui] of [[12, "max"], [50, "stress"]] as const) {
  const a = ints(n)
  add("Merge sort", `n=${n}`, ui, () => generateMergeSortSteps(a))
  add("Heap sort", `n=${n}`, ui, () => generateHeapSortSteps(a))
  add("Selection sort", `n=${n}`, ui, () => generateSelectionSortSteps(a))
  add("Insertion sort", `n=${n}`, ui, () => generateInsertionSortSteps(a))
  add("Max-min (D&C)", `n=${n}`, ui, () => generateMaxMinSteps(a))
}
for (const [n, ui] of [[10, "max"], [50, "stress"]] as const) {
  const a = ints(n)
  add("Quick sort", `n=${n}`, ui, () => generateQuickSortSteps(a))
}
for (const [n, ui] of [[8, "max"], [16, "stress"]] as const) {
  const A = matrix(n), B = matrix(n)
  add("Strassen", `${n}x${n}`, ui, () => generateStrassenSteps(A, B))
}
{
  const d = ints(11, 2, 60)
  add("Matrix chain", "10 matrices", "max", () => generateMatrixChainSteps(d))
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, weight: 1 + Math.floor(r() * 15), value: 1 + Math.floor(r() * 50) }))
  add("0/1 knapsack (DP)", "10 items, W=50", "max", () => generateKnapsackSteps(items, 50))
  const fItems = Array.from({ length: 10 }, (_, i) => {
    const weight = 1 + Math.floor(r() * 30), value = 1 + Math.floor(r() * 90)
    return { id: String(i + 1), name: `Item ${i + 1}`, weight, value, ratio: value / weight, selected: false }
  })
  add("Fractional knapsack", "10 items", "max", () => generateFractionalKnapsackFrames(fItems, 50, true))
  const jobs = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), name: `J${i + 1}`, profit: 10 + Math.floor(r() * 90), deadline: 1 + Math.floor(r() * 10), scheduled: false }))
  add("Job sequencing", "10 jobs", "max", () => generateJobSchedulingFrames(jobs))
}
for (const [n, ui] of [[10, "max"], [15, "stress"]] as const) {
  const L = labels(n), E = denseEdges(n)
  add("Dijkstra", `${n} nodes, ${E.length} edges`, ui, () => generateDijkstraSteps({ nodes: L.map((id) => ({ id, label: id })), edges: E }, "A"))
  add("Bellman-Ford", `${n} nodes, ${E.length} edges`, ui, () => generateBellmanFordSteps(L, E, "A"))
  const D = distMatrix(n)
  add("Floyd-Warshall", `${n} nodes`, ui, () => generateFloydWarshallSteps(D))
}
for (const [n, ui] of [[10, "max"], [20, "stress"]] as const) {
  const g = generateRandomGraph(n, 0.5)
  add("MST (Kruskal)", `${n} nodes, ${g.edges.length} edges`, ui, () => runKruskalsAlgorithm(g))
  add("MST (Prim)", `${n} nodes, ${g.edges.length} edges`, ui, () => runPrimsAlgorithm(g, g.nodes[0]))
}
for (const [n, ui] of [[8, "max"], [10, "stress"]] as const) {
  const D = tspMatrix(n)
  add("TSP (Held-Karp)", `${n} cities`, ui, () => solveTSP(D, 0))
}

// yield to the event loop so the test runner's worker heartbeat is not starved by long cases
const breathe = () => new Promise((resolve) => setTimeout(resolve, 0))

it("benchmarks every engine", async () => {
  const env = { node: process.version, cpu: os.cpus()[0]?.model, cores: os.cpus().length, memGB: +(os.totalmem() / 2 ** 30).toFixed(1), platform: `${os.platform()} ${os.release()}`, date: new Date().toISOString(), warmup: WARMUP, runs: RUNS }
  const rows: Record<string, unknown>[] = []
  for (const c of cases) {
    for (let i = 0; i < WARMUP; i++) {
      c.run()
      await breathe()
    }
    const t: number[] = []
    let frames = 0
    for (let i = 0; i < RUNS; i++) {
      const t0 = performance.now()
      frames = c.run().length
      t.push(performance.now() - t0)
      await breathe()
    }
    t.sort((x, y) => x - y)
    // size of the trace as JSON, measured frame by frame so huge traces do not need one giant string
    let bytes = 0
    for (const f of c.run()) bytes += Buffer.byteLength(JSON.stringify(f)) + 1
    const row = { module: c.module, input: c.size, ui: c.ui, frames, traceKB: +(bytes / 1024).toFixed(1), medianMs: +t[RUNS >> 1].toFixed(3), p95Ms: +t[Math.floor(RUNS * 0.95)].toFixed(3) }
    rows.push(row)
    console.log(JSON.stringify(row))
    writeFileSync("bench/results.json", JSON.stringify({ env, rows }, null, 2) + "\n")
  }
})
