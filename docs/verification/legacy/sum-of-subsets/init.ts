import { legacy } from "./legacy.ts"
const r = legacy([2, 4, 6, 8, 10], 16, "2, 4, 6, 8, 10", "16", true)
console.log("default: nodes in frame 0 =", Object.keys(r.steps[0].treeState).length, "nodes in final frame =", Object.keys(r.steps.at(-1)!.treeState).length, "root children at frame 0:", r.steps[0].treeState.root.children.length)
let bad = 0
let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
for (let k = 0; k < 2000; k++) { const n = 1 + Math.floor(rnd() * 7); const a = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 20)).sort((x, y) => x - y); const t = Math.floor(rnd() * 60)
  const rr = legacy(a, t, a.join(", "), String(t), true); if (Object.keys(rr.steps[0].treeState).length > 1) bad++ }
console.log("frame 0 shows nodes not yet explored:", bad, "/ 2000")
