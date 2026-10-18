import { legacySteps, legacyAdd, legacyRemove } from "./legacy.ts"
const def = [{ id: 1, weight: 2, value: 3 }, { id: 2, weight: 3, value: 4 }, { id: 3, weight: 4, value: 5 }, { id: 4, weight: 5, value: 6 }]
const after = legacyAdd(legacyRemove(def, 1), "1", "10") as any[]
console.log("remove Item 1, add (w=1,v=10) -> ids", JSON.stringify(after.map((i) => i.id)))
const st = legacySteps(after, 8) as any[]; const sel = st.at(-1).selectedItems
console.log("selectedItems", JSON.stringify(sel), "cards highlighted:", JSON.stringify(after.filter((i) => sel.includes(i.id))))
// Random Items is still enabled after Start: the table keeps the started rows, row headers read items[i-1] from the new list
let seed = 5, crash = 0, runs = 0
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
for (let t = 0; t < 3000; t++) {
  const steps = legacySteps(def, 8) as any[]; runs++
  const count = Math.floor(rnd() * 3) + 3
  const newItems = Array.from({ length: count }, (_, i) => ({ id: i + 1, weight: Math.floor(rnd() * 5) + 1, value: Math.floor(rnd() * 10) + 1 }))
  try { steps[0].table.forEach((_: any, i: number) => (i === 0 ? "0 (no items)" : `${i} (w:${newItems[i - 1].weight}, v:${newItems[i - 1].value})`)) } catch (e) { crash++ }
}
console.log(`Start on the default 4 items, then 'Random Items': row-header render throws TypeError in ${crash}/${runs} trials`)
