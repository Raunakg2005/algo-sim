import { legacy } from "./legacy.ts"
import type { Item } from "./legacy.ts"
const mk = (wv: [number, number][]): Item[] => wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))
function bestSubset(items: { weight: number; value: number }[], cap: number): number {
  let best = 0
  for (let m = 0; m < 1 << items.length; m++) { let w = 0, v = 0; for (let i = 0; i < items.length; i++) if (m & (1 << i)) { w += items[i].weight; v += items[i].value } ; if (w <= cap && v > best) best = v }
  return best
}
const bad = (wv: [number, number][], cap: number) => legacy(mk(wv), cap).steps.at(-1)!.bestValue !== bestSubset(mk(wv), cap)
let wv: [number, number][] = [[401,87],[610,132],[507,111],[491,107],[418,90],[986,214]]
let cap = 909
let changed = true
while (changed) {
  changed = false
  for (let i = 0; i < wv.length && !changed; i++) {
    const c = wv.filter((_, j) => j !== i)
    for (let k = 1; k <= c.reduce((s, x) => s + x[0], 0); k++) if (bad(c, k)) { wv = c; cap = k; changed = true; break }
  }
  // try shrinking numbers
  for (let i = 0; i < wv.length && !changed; i++) for (const d of [0, 1]) {
    for (const f of [0.5, 0.9, 0.99]) {
      const c = wv.map((x) => [...x] as [number, number]); c[i][d] = Math.max(1, Math.floor(c[i][d] * f)); 
      for (const k of [cap, Math.floor(cap * f), cap - 1]) if (k > 0 && bad(c, k)) { wv = c; cap = k; changed = true; break }
      if (changed) break
    }
    if (changed) break
  }
}
console.log(JSON.stringify({ wv, cap }), "ratios", mk(wv).map(i => i.ratio), "got", legacy(mk(wv), cap).steps.at(-1)!.bestValue, "opt", bestSubset(mk(wv), cap))
for (const st of legacy(mk(wv), cap).steps) console.log("  ", st.description)
