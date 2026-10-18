import { legacy } from "./legacy.ts"
import { distancesFromGoal } from "file:///tests/reference/fifteen-puzzle.ts"
const dist = distancesFromGoal(14)
const byD = new Map<number, [number, number, number]>()
let i0 = 0
for (const [k, d] of dist) {
  if (d < 6 || (i0++ % 23) !== 0) continue
  const b = k.split(",").map(Number); const g = [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4))
  const st = legacy(g); const last = st.at(-1)!
  const e = byD.get(d) ?? [0, 0, 0]; e[0]++
  if (last.bestStateId === null) e[2]++; else if (last.states.get(last.bestStateId)!.cost !== d) e[1]++
  byD.set(d, e)
}
let t = 0, s = 0, u = 0
for (const [d, [n, so, un]] of [...byD].sort((a, b) => a[0] - b[0])) { console.log(`opt ${d}: boards ${n}, suboptimal ${so}, unsolved ${un}`); t += n; s += so; u += un }
console.log(`total ${t}: suboptimal ${s} (${(100 * s / t).toFixed(2)}%), unsolved within 1000 states ${u}`)
