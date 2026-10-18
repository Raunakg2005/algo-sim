import { generateSumOfSubsetsSteps } from "file:///lib/engines/sum-of-subsets.ts"
for (const [a, t] of [[[0,0,0,0,0,0,0,0,0,0], 0], [[-10,-9,-8,-7,-6,20,19,18,17,16], 30], [[1,2,3,4,5,6,7,8,9,10], 27]] as [number[], number][]) {
  const t0 = Date.now(); const r = generateSumOfSubsetsSteps(a, t)
  console.log(a.join(","), t, "steps", r.steps.length, "nodes", Object.keys(r.steps.at(-1)!.treeState).length, "ms", Date.now() - t0)
}
