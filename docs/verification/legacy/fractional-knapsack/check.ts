import { Legacy, type Item } from "./legacy.ts"
let seed = 99
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
// exact rationals from the decimal text of each number
type Q = [bigint, bigint]
const gcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a }
const norm = ([n, d]: Q): Q => { if (d < 0n) { n = -n; d = -d } const g = gcd(n, d) || 1n; return [n / g, d / g] }
const q = (x: number): Q => { const [m, e] = String(x).split("e"); const [i, f = ""] = m.split("."); let n = BigInt(i + f), d = 10n ** BigInt(f.length); const ex = Number(e ?? 0); if (ex > 0) n *= 10n ** BigInt(ex); else d *= 10n ** BigInt(-ex); return norm([n, d]) }
const add = (a: Q, b: Q) => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]), sub = (a: Q, b: Q) => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]])
const mul = (a: Q, b: Q) => norm([a[0] * b[0], a[1] * b[1]]), div = (a: Q, b: Q) => norm([a[0] * b[1], a[1] * b[0]])
const cmp = (a: Q, b: Q) => { const l = a[0] * b[1], r = b[0] * a[1]; return l < r ? -1 : l > r ? 1 : 0 }
const num = (a: Q) => Number(a[0]) / Number(a[1])
function oracle(items: Item[], cap: number, frac: boolean) {
  const order = items.map((it, i) => ({ it, i })).sort((a, b) => cmp(div(q(b.it.value), q(b.it.weight)), div(q(a.it.value), q(a.it.weight))) || a.i - b.i)
  let rem = q(cap), val: Q = [0n, 1n]; const sel = new Map<string, Q>()
  for (const { it } of order) {
    if (rem[0] === 0n) break
    const w = q(it.weight)
    if (cmp(rem, w) >= 0) { sel.set(it.id, [1n, 1n]); rem = sub(rem, w); val = add(val, q(it.value)) }
    else if (frac) { const f = div(rem, w); sel.set(it.id, f); val = add(val, mul(q(it.value), f)); rem = [0n, 1n] }
  }
  return { val, sel, rem }
}
const defaults = (): Item[] => [
  { id: "1", name: "Item 1", weight: 10, value: 60, ratio: 6, selected: false }, { id: "2", name: "Item 2", weight: 20, value: 100, ratio: 5, selected: false },
  { id: "3", name: "Item 3", weight: 30, value: 120, ratio: 4, selected: false }, { id: "4", name: "Item 4", weight: 15, value: 45, ratio: 3, selected: false },
  { id: "5", name: "Item 5", weight: 25, value: 50, ratio: 2, selected: false }]
const mk = (k: number, w: () => number, v: () => number): Item[] => Array.from({ length: k }, (_, i) => ({ id: String(i + 1), name: "Item " + (i + 1), weight: w(), value: v(), ratio: 0, selected: false }))
const stats: Record<string, number> = {}; const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
const ex: Record<string, string> = {}; const note = (k: string, s: string) => { if (!ex[k] || s.length < ex[k].length) ex[k] = s }
function forward(items: Item[], cap: number, frac: boolean, label: string) {
  bump(label + ":runs")
  const L = new Legacy(items, cap); L.allowFractions = frac
  L.runStep(); if (L.view().list.length === 0) bump(label + ":'Sort Items' frame shows an empty item list")
  L.runStep(); L.runStep()
  const v = L.view(), o = oracle(items, cap, frac)
  if (Math.abs(v.totalValue - num(o.val)) > 0.0051) { bump(label + ":total value != exact greedy"); note(label + " value", JSON.stringify({ items: items.map((i) => [i.weight, i.value]), cap, frac, legacy: v.totalValue, exact: num(o.val) })) }
  const shown = new Map(v.knapsack.map((i) => [i.id, i.fraction!]))
  const sameSet = shown.size === o.sel.size && [...o.sel].every(([id, f]) => shown.has(id) && Math.abs(shown.get(id)! - num(f)) < 1e-9)
  if (!sameSet) { bump(label + ":selected items/fractions != exact greedy"); note(label + " sel", JSON.stringify({ items: items.map((i) => [i.weight, i.value]), cap, frac, legacy: [...shown], exact: [...o.sel].map(([k, f]) => [k, num(f)]) })) }
  if (v.knapsack.some((i) => i.fraction! > 0 && i.fraction! < 1e-9)) bump(label + ":spurious ~0% item in knapsack")
  if (!/total value/i.test(v.explanation)) bump(label + ":'Final Result' caption does not state the result")
}
for (let cap = 10; cap <= 100; cap += 5) for (const frac of [true, false]) forward(defaults(), cap, frac, "default items")
for (let t = 0; t < 4000; t++) forward(mk(ri(1, 8), () => ri(1, 40), () => ri(1, 200)), 5 * ri(2, 20), rnd() < 0.5, "custom integer")
for (let t = 0; t < 4000; t++) { const its = mk(ri(2, 8), () => ri(1, 60), () => 0); its.forEach((i) => (i.value = Number((i.weight * (1 + ri(0, 400) / 10000)).toFixed(2)))); forward(its, 5 * ri(2, 20), rnd() < 0.5, "custom close ratios (2-decimal values)") }
for (let t = 0; t < 4000; t++) forward(mk(ri(1, 8), () => ri(1, 400) / 10, () => ri(1, 2000) / 10), 5 * ri(2, 20), rnd() < 0.5, "custom 1-decimal")
// interaction sequences (Next / Back / toggle fractions) over the default items
let seqRuns = 0
for (let t = 0; t < 4000; t++) {
  const L = new Legacy(defaults(), 5 * ri(2, 20)); const log: string[] = []
  for (let k = 0; k < ri(3, 12); k++) {
    const r = rnd()
    if (r < 0.55 && L.currentStep < 3) { L.runStep(); log.push("next") } else if (r < 0.8 && L.currentStep > 0) { L.back(); log.push("back") } else { L.toggleFractions(); log.push("toggle") }
    const v = L.view(); seqRuns++
    if (L.currentStep === 0 && v.list.some((i) => i.selected)) { bump("seq:frames 'Initial State' showing items as already selected"); note("seq stale0", `cap=${L.knapsackCapacity} ` + log.join(",")) }
    if (L.currentStep === 3) {
      const shownVal = v.knapsack.reduce((s, i) => s + i.value * (i.fraction ?? 1), 0)
      if (Math.abs(shownVal - v.totalValue) > 0.01) { bump("seq:frames 'Final Result' whose knapsack contents disagree with the displayed total"); note("seq inconsistent", `cap=${L.knapsackCapacity} ` + log.join(",")) }
      const o = oracle(defaults(), L.knapsackCapacity, L.allowFractions)
      if (Math.abs(v.totalValue - Number(num(o.val).toFixed(2))) > 1e-9) { bump("seq:frames 'Final Result' whose total disagrees with greedy for the current 'allow fractions' setting"); note("seq stale toggle", `cap=${L.knapsackCapacity} ` + log.join(",")) }
    }
  }
}
console.log(stats); console.log("sequence frames inspected:", seqRuns); console.log(ex)
// float remainder example
{ const items = mk(4, () => 0, () => 0); [[3.3, 33], [3.3, 33], [3.4, 34], [5, 1]].forEach(([w, v], i) => { items[i].weight = w; items[i].value = v }); const L = new Legacy(items, 10); L.runStep(); L.runStep(); L.runStep(); console.log("float remainder case:", JSON.stringify(L.view().knapsack.map((i) => [i.name, i.fraction])), "remaining", L.remainingCapacity, "explanation:", L.explanation) }
