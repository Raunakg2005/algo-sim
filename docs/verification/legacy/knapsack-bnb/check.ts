import { legacy, editor } from "./legacy.ts"
import type { Item } from "./legacy.ts"

let seed = 4242
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
const mk = (wv: [number, number][]): Item[] => wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))

function bestSubset(items: { weight: number; value: number }[], cap: number): number {
  let best = 0
  for (let m = 0; m < 1 << items.length; m++) {
    let w = 0, v = 0
    for (let i = 0; i < items.length; i++) if (m & (1 << i)) { w += items[i].weight; v += items[i].value }
    if (w <= cap && v > best) best = v
  }
  return best
}

type V = { wrongOpt: boolean; invalidBound: boolean; unsafePrune: boolean; bestShownPruned: boolean; prunedBeforeItsFrame: boolean; noSolutionCaption: boolean }
function check(items: Item[], cap: number): V {
  const { steps } = legacy(items, cap)
  const sorted = [...items].sort((a, b) => b.ratio - a.ratio)
  const opt = bestSubset(items, cap)
  const last = steps[steps.length - 1]
  const wrongOpt = last.bestValue !== opt
  const nodes = last.nodes
  const subOpt = (level: number, w: number, v: number) => v + bestSubset(sorted.slice(level), cap - w)
  let invalidBound = false, unsafePrune = false, prunedBeforeItsFrame = false
  for (const n of nodes) if (subOpt(n.level, n.weight, n.value) > n.bound) invalidBound = true
  const pruneFrame = new Map<number, number>()
  steps.forEach((s, k) => {
    if (s.phase === "prune") {
      const id = Number(s.description.match(/Prune node (\d+)/)![1])
      if (!pruneFrame.has(id)) pruneFrame.set(id, k)
      const n = nodes.find((x) => x.id === id)!
      if (subOpt(n.level, n.weight, n.value) > s.bestValue) unsafePrune = true
    }
  })
  steps.forEach((s, k) => {
    for (const n of s.nodes) if (n.pruned && !(pruneFrame.has(n.id) && pruneFrame.get(n.id)! <= k)) prunedBeforeItsFrame = true
  })
  const bestShownPruned = last.bestNode !== null && nodes.find((n) => n.id === last.bestNode)!.pruned
  const noSolutionCaption = last.description.includes("No solution found")
  return { wrongOpt, invalidBound, unsafePrune, bestShownPruned, prunedBeforeItsFrame, noSolutionCaption }
}

function tally(name: string, gen: () => [Item[], number], runs: number) {
  const c: Record<string, number> = { wrongOpt: 0, invalidBound: 0, unsafePrune: 0, bestShownPruned: 0, prunedBeforeItsFrame: 0, noSolutionCaption: 0 }
  const ex: Record<string, string> = {}
  for (let k = 0; k < runs; k++) {
    const [items, cap] = gen()
    const v = check(items, cap)
    for (const key of Object.keys(v) as (keyof V)[]) if (v[key]) { c[key]++; if (!ex[key] || JSON.stringify(items).length + 10 < ex[key].length) ex[key] = JSON.stringify({ wv: items.map((i) => [i.weight, i.value]), cap }) }
  }
  console.log(`${name}: runs=${runs}`, JSON.stringify(c))
  for (const [k, e] of Object.entries(ex)) console.log(`   shortest example ${k}: ${e}`)
}

const def = [
  { id: 1, weight: 2, value: 10, ratio: 5 },
  { id: 2, weight: 3, value: 15, ratio: 5 },
  { id: 3, weight: 5, value: 30, ratio: 6 },
  { id: 4, weight: 7, value: 35, ratio: 5 },
  { id: 5, weight: 1, value: 3, ratio: 3 },
]
console.log("default (cap 10):", check(def, 10), "optimum", bestSubset(def, 10), "engine:", legacy(def, 10).steps.at(-1)!.description)

tally("Random Items button", () => {
  const count = ri(3, 5)
  return [mk(Array.from({ length: count }, () => [ri(1, 5), ri(5, 14)] as [number, number])), ri(5, 14)]
}, 20000)
tally("Typed small ints (n 1..8, w 1..20, v 1..30, cap 1..40)", () => {
  const n = ri(1, 8)
  return [mk(Array.from({ length: n }, () => [ri(1, 20), ri(1, 30)] as [number, number])), ri(1, 40)]
}, 20000)
tally("Typed wide ints (n 1..8, w 1..1000, v 1..1000, cap 1..2000)", () => {
  const n = ri(1, 8)
  return [mk(Array.from({ length: n }, () => [ri(1, 1000), ri(1, 1000)] as [number, number])), ri(1, 2000)]
}, 20000)
tally("Typed near-tie ratios (n 2..8, v = round(w*r), r in {0.33,0.334,...})", () => {
  const n = ri(2, 8)
  const rs = [1 / 3, 0.334, 0.3349, 0.3301, 2 / 3, 0.6651]
  return [mk(Array.from({ length: n }, () => { const w = ri(1, 1000); return [w, Math.max(1, Math.round(w * rs[ri(0, rs.length - 1)]))] as [number, number] })), ri(1, 2000)]
}, 20000)

// minimal counterexamples: smallest n, then smallest max weight/value
function minimal(key: keyof V) {
  for (let n = 1; n <= 3; n++) for (let M = 1; M <= 12; M++) {
    const opts: [number, number][] = []
    for (let w = 1; w <= M; w++) for (let v = 1; v <= M; v++) opts.push([w, v])
    const rec = (pre: [number, number][]): string | null => {
      if (pre.length === n) {
        for (let cap = 1; cap <= n * M; cap++) if (check(mk(pre), cap)[key]) return JSON.stringify({ wv: pre, cap })
        return null
      }
      for (const o of opts) { const r = rec([...pre, o]); if (r) return r }
      return null
    }
    const r = rec([])
    if (r) { console.log(`minimal ${key}: ${r}`); return }
  }
  console.log(`minimal ${key}: none with n<=3, w,v<=12`)
}
for (const k of ["bestShownPruned", "prunedBeforeItsFrame", "noSolutionCaption", "wrongOpt", "invalidBound"] as (keyof V)[]) minimal(k)

// duplicate item ids after remove + add
{
  const ed = editor(def.map((x) => ({ ...x })))
  ed.remove(2)
  ed.add("4", "8")
  console.log("ids after removing item 2 and adding (w4,v8):", JSON.stringify(ed.items.map((i) => i.id)), "-> rows with id 5:", JSON.stringify(ed.items.filter((i) => i.id === 5)))
  const { steps } = legacy(ed.items, 10)
  console.log("  final:", steps.at(-1)!.description)
}
