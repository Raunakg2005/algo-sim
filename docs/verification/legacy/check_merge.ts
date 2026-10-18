import { legacy } from "./merge_legacy.ts"
let bad = 0, badCmp = 0, total = 0, example: any = null
const rnd = (n: number) => Math.floor(Math.random() * n)
for (let t = 0; t < 20000; t++) {
  const a = Array.from({ length: 1 + rnd(12) }, () => rnd(6))
  total++
  const steps = legacy(a)
  const last = steps[steps.length - 1]
  const want = [...a].sort((x, y) => x - y)
  if (JSON.stringify(last.arrays) !== JSON.stringify([want])) { bad++; if (!example) example = { a, final: last.arrays } }
  if (steps.some((s) => s.comparisons?.some(([b]) => b < 0))) badCmp++
}
console.log(JSON.stringify({ total, wrongFinalFrame: bad, framesHighlightingMissingBlock: badCmp, example }))
