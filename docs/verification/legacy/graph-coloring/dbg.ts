import { generateGraphColoringSteps } from "file:///lib/engines/graph-coloring.ts"
const nodes = Array.from({ length: 10 }, (_, i) => ({ id: "n" + i, label: String.fromCharCode(65 + i) }))
const r = generateGraphColoringSteps(nodes, [{ source: "n5", target: "n6" }, { source: "n6", target: "n9" }], 1, 21)
console.log(r.limitReached, r.steps.length); r.steps.forEach((s, i) => console.log(i, s.phase, s.description))
