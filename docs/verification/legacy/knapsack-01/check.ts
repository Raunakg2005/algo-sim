import { legacySteps, legacyAdd, legacyRemove } from "./legacy.ts"
let seed = 4242
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
type Item = { id: number; weight: number; value: number }
const brute = (items: Item[], cap: number) => { let b = 0; for (let mask = 0; mask < 1 << items.length; mask++) { let w = 0, v = 0; items.forEach((it, i) => { if (mask >> i & 1) { w += it.weight; v += it.value } }); if (w <= cap) b = Math.max(b, v) } return b }
const stats: Record<string, number> = {}; const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
let firstCaption = ""
function check(items: Item[], cap: number, label: string) {
  bump(label + ":runs")
  const steps = legacySteps(items, cap); if (typeof steps === "string") { bump(label + ":error"); return }
  const last = steps.at(-1)!, n = items.length
  for (let i = 0; i <= n; i++) for (let c = 0; c <= cap; c++) if (last.table[i][c].value !== brute(items.slice(0, i), c)) { bump(label + ":dp cell wrong"); i = n + 1; break }
  const opt = brute(items, cap)
  if (last.totalValue !== opt) bump(label + ":total != brute force")
  const chosen = last.selectedItems.map((id) => items.filter((it) => it.id === id))
  if (chosen.some((c) => c.length !== 1)) bump(label + ":selected id ambiguous/missing")
  const sel = chosen.map((c) => c[0]).filter(Boolean)
  const v = sel.reduce((s, it) => s + it.value, 0), w = sel.reduce((s, it) => s + it.weight, 0)
  if (v !== opt) bump(label + ":backtracked set value != optimum")
  if (w > cap || w !== last.totalWeight) bump(label + ":backtracked weight wrong")
  // captions name "item i" (row index); the item list/cards name items by id
  const idsDiffer = items.some((it, i) => it.id !== i + 1)
  if (idsDiffer) { bump(label + ":runs whose captions use row index while cards show a different id"); if (!firstCaption) { const s = steps.find((s) => /item \d/.test(s.description))!; firstCaption = `items=${JSON.stringify(items)} caption: "${s.description}"` } }
}
// (a) UI random generator: 3..5 items, weight 1..5, value 1..10, capacity 5..14
for (let t = 0; t < 5000; t++) { const c = ri(3, 5); check(Array.from({ length: c }, (_, i) => ({ id: i + 1, weight: ri(1, 5), value: ri(1, 10) })), ri(5, 14), "ui-random") }
check([{ id: 1, weight: 2, value: 3 }, { id: 2, weight: 3, value: 4 }, { id: 3, weight: 4, value: 5 }, { id: 4, weight: 5, value: 6 }], 8, "default")
// (b) custom: any positive ints; capacity kept small enough to run; items up to 10
for (let t = 0; t < 3000; t++) { const c = ri(1, 10); check(Array.from({ length: c }, (_, i) => ({ id: i + 1, weight: ri(1, 25), value: ri(1, 30) })), ri(1, 40), "custom") }
// (c) item-list editing: random add/remove sequences starting from the default list
let dupRuns = 0, wrongHighlight = 0, editRuns = 0, firstDup = ""
for (let t = 0; t < 3000; t++) {
  let items: Item[] = [{ id: 1, weight: 2, value: 3 }, { id: 2, weight: 3, value: 4 }, { id: 3, weight: 4, value: 5 }, { id: 4, weight: 5, value: 6 }]
  const ops: string[] = []
  for (let k = 0; k < ri(1, 6); k++) {
    if (items.length && rnd() < 0.4) { const id = items[ri(0, items.length - 1)].id; items = legacyRemove(items, id); ops.push(`remove ${id}`) }
    else { const w = String(ri(1, 6)), v = String(ri(1, 10)); const r = legacyAdd(items, w, v); if (typeof r !== "string") { items = r; ops.push(`add(w=${w},v=${v})`) } }
  }
  if (!items.length) continue
  editRuns++
  const ids = items.map((i) => i.id)
  if (new Set(ids).size !== ids.length) { dupRuns++; if (!firstDup || ops.length < firstDup.split(",").length) firstDup = ops.join(", ") + " -> ids " + JSON.stringify(ids)
    const steps = legacySteps(items, 8); if (typeof steps !== "string") { const sel = steps.at(-1)!.selectedItems; const shown = items.filter((it) => sel.includes(it.id)).length; if (shown !== sel.length) wrongHighlight++ } }
  check(items, 8, "edited-list")
}
console.log(stats)
console.log(`edited lists: ${dupRuns}/${editRuns} end with duplicate item ids; ${wrongHighlight} of those highlight an unselected item as selected`)
console.log("shortest duplicate-id sequence found:", firstDup)
console.log("caption/id mismatch example:", firstCaption)
// (d) memory: frames and copied cells grow as n*W*(n+1)*(W+1); no capacity limit in the UI
const framesFor = (n: number, W: number) => { const items = Array.from({ length: n }, (_, i) => ({ id: i + 1, weight: 1, value: 1 })); let f = 2; for (let i = 1; i <= n; i++) { f += 1; for (let j = 0; j <= W; j++) f += j === 0 ? 1 : 3 } f += 2 * n; return { frames: f, cells: f * (n + 1) * (W + 1) } }
for (const [n, W] of [[4, 8], [10, 50], [10, 200], [10, 1000]]) console.log(`n=${n} W=${W}:`, JSON.stringify(framesFor(n, W)))
const s = legacySteps([{ id: 1, weight: 1, value: 1 }, { id: 2, weight: 1, value: 1 }], 50) as any[]
console.log("check frame formula n=2 W=50 (actual vs formula):", s.length, framesFor(2, 50).frames)
