import { Legacy, type Item } from "./legacy.ts"
// smallest (by weight sum) 2-item fractional instance where rounded-ratio sorting loses value; capacity 10 (slider min)
let best: any = null
for (let w1 = 1; w1 <= 20; w1++) for (let w2 = 1; w2 <= 20; w2++) for (let v1 = 1; v1 <= 30; v1++) for (let v2 = 1; v2 <= 30; v2++) {
  if (w1 + w2 <= 10) continue
  const r1 = v1 / w1, r2 = v2 / w2
  if (!(r2 > r1)) continue
  const items: Item[] = [{ id: "1", name: "Item 1", weight: w1, value: v1, ratio: 0, selected: false }, { id: "2", name: "Item 2", weight: w2, value: v2, ratio: 0, selected: false }]
  const L = new Legacy(items, 10); L.runStep(); L.runStep(); L.runStep()
  // exact fractional optimum: take item 2 first
  const t2 = Math.min(10, w2), exact = v2 * t2 / w2 + (10 - t2 > 0 ? v1 * Math.min(1, (10 - t2) / w1) : 0)
  if (L.totalValue < exact - 0.005) { const key = w1 + w2 + v1 + v2; if (!best || key < best.key) best = { key, items: [[w1, v1], [w2, v2]], legacy: L.totalValue, exact, shownRatios: L.items.map((i) => i.ratio) } }
}
console.log("integer minimal (capacity 10, allow fractions):", JSON.stringify(best))
