import { generateSumOfSubsetsSteps } from "file:///lib/engines/sum-of-subsets.ts"
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }; const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
let t0 = Date.now(), steps = 0, worst = 0
for (let k = 0; k < 1000; k++) { const n = ri(1, 10); const a = Array.from({ length: n }, () => ri(-10, 20)); const t1 = Date.now(); const r = generateSumOfSubsetsSteps(a, ri(-30, 80)); r.steps.at(-1)!.solutions; steps += r.steps.length; worst = Math.max(worst, Date.now() - t1) }
console.log("1000 runs ms", Date.now() - t0, "mean steps", steps / 1000, "worst ms", worst)
