import { legacy } from "./legacy.ts"
import type { Item } from "./legacy.ts"
const mk = (wv: [number, number][]): Item[] => wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))
function bestSubset(items: { weight: number; value: number }[], cap: number): number {
  let best = 0
  for (let m = 0; m < 1 << items.length; m++) { let w = 0, v = 0; for (let i = 0; i < items.length; i++) if (m & (1 << i)) { w += items[i].weight; v += items[i].value } ; if (w <= cap && v > best) best = v }
  return best
}
let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }; const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
let best: { wv: [number, number][]; cap: number; got: number; opt: number } | null = null
const score = (wv: [number, number][]) => wv.length * 10000 + Math.max(...wv.flat())
for (let k = 0; k < 1000000; k++) {
  const n = ri(2, 4); const M = ri(20, 200); const base = 0.1 + rnd() * 3
  const wv = Array.from({ length: n }, () => { const w = ri(1, M); return [w, Math.max(1, Math.round(w * (base + (rnd() - 0.5) * 0.01)))] as [number, number] })
  const items = mk(wv)
  const cap = ri(1, wv.reduce((s, x) => s + x[0], 0))
  const s = legacy(items, cap).steps
  const opt = bestSubset(items, cap)
  if (s.at(-1)!.bestValue !== opt && (!best || score(wv) < score(best.wv))) best = { wv, cap, got: s.at(-1)!.bestValue, opt }
}
console.log("smallest wrong optimum found:", JSON.stringify(best))
if (best) { const s = legacy(mk(best.wv), best.cap).steps; for (const st of s) console.log("  ", st.description) }
