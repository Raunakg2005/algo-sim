// time / frames of the ORIGINAL solver as the coordinates tab allows any number of cities
import { solveTSP } from "./tsp-solver.ts"
for (const n of [6, 7, 8, 9, 10]) {
  const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : 1 + ((i * 7 + j * 3) % 13))))
  const t = performance.now()
  const steps = solveTSP(D, 0)
  const heap = process.memoryUsage().heapUsed / 2 ** 20
  console.log(`n=${n}: ${steps.length} frames, ${(performance.now() - t).toFixed(0)} ms, heap ${heap.toFixed(0)} MB`)
}
