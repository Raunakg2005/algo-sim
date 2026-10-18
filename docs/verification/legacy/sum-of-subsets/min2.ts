import { legacy } from "./legacy.ts"
for (const [a, t] of [[[1, 2], 2], [[1], 1], [[2], 2], [[1, 1], 1], [[1, 2], 1], [[-1], -1], [[-2, -1], -3]] as [number[], number][]) {
  const r = legacy(a, t, a.join(", "), String(t), false)
  console.log(JSON.stringify(a), t, "->", JSON.stringify(r.steps[r.steps.length - 1].solutions), r.steps.map(s => s.description).join(" | "))
}
