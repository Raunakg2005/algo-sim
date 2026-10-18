import { legacy, editor } from "./legacy.ts"
import type { Item } from "./legacy.ts"
const mk = (wv: [number, number][]): Item[] => wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))
function bestSubset(items: { weight: number; value: number }[], cap: number): number {
  let best = 0
  for (let m = 0; m < 1 << items.length; m++) { let w = 0, v = 0; for (let i = 0; i < items.length; i++) if (m & (1 << i)) { w += items[i].weight; v += items[i].value } ; if (w <= cap && v > best) best = v }
  return best
}
// minimal invalid root bound: two items, smallest max(w)
outer: for (let M = 2; M <= 400; M++) {
  for (let w1 = 1; w1 <= M; w1++) for (let v1 = 1; v1 <= M; v1++) for (let w2 = 1; w2 <= M; w2++) {
    if (Math.max(w1, w2, v1) !== M && w2 !== M && w1 !== M) continue
    for (let v2 = 1; v2 <= M; v2++) {
      if (Math.max(w1, v1, w2, v2) !== M) continue
      const items = mk([[w1, v1], [w2, v2]])
      if (items[0].ratio !== items[1].ratio || v1 / w1 >= v2 / w2) continue
      for (let cap = 1; cap <= w1 + w2; cap++) {
        const s = legacy(items, cap).steps
        const root = s.at(-1)!.nodes[0]
        const opt = bestSubset(items, cap)
        if (root.bound < opt) { console.log("minimal invalid bound:", JSON.stringify({ wv: [[w1, v1], [w2, v2]], cap }), "root bound", root.bound, "optimum", opt, "ratios", items.map(i => i.ratio)); break outer }
      }
    }
  }
}
// random search for a wrong optimum caused by rounded ratios
let seed = 99; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }; const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
let wrong = 0, invalid = 0, runs = 0; let ex = ""
for (let k = 0; k < 40000; k++) {
  const n = ri(2, 6); const base = 0.2 + rnd() * 2
  const wv = Array.from({ length: n }, () => { const w = ri(50, 1000); return [w, Math.max(1, Math.round(w * (base + (rnd() - 0.5) * 0.009)))] as [number, number] })
  const items = mk(wv); const cap = ri(1, wv.reduce((s, x) => s + x[0], 0))
  const s = legacy(items, cap).steps; runs++
  const opt = bestSubset(items, cap)
  if (s.at(-1)!.bestValue !== opt) { wrong++; if (!ex || JSON.stringify(wv).length < ex.length) ex = JSON.stringify({ wv, cap, got: s.at(-1)!.bestValue, opt }) }
  if (s.at(-1)!.nodes[0].bound < opt) invalid++
}
console.log(`near-tie stress: runs=${runs} wrong optimum=${wrong} invalid root bound=${invalid}`, ex)
{
  const def = [ { id: 1, weight: 2, value: 10, ratio: 5 }, { id: 2, weight: 3, value: 15, ratio: 5 }, { id: 3, weight: 5, value: 30, ratio: 6 }, { id: 4, weight: 7, value: 35, ratio: 5 }, { id: 5, weight: 1, value: 3, ratio: 3 } ]
  const ed = editor(def.map((x) => ({ ...x })))
  ed.remove(2); ed.add("4", "8")
  console.log("ids after removing item 2 and adding (w4,v8):", JSON.stringify(ed.items.map((i) => [i.id, i.weight, i.value])))
  console.log("  final:", legacy(ed.items, 10).steps.at(-1)!.description)
}
