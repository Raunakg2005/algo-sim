import { Legacy, type Job } from "./legacy.ts"
let seed = 2024
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
const feasible = (js: Job[]) => { const ds = js.map((j) => j.deadline).sort((a, b) => a - b); return ds.every((d, i) => i + 1 <= d) }
const brute = (jobs: Job[]) => { let b = 0; for (let m = 0; m < 1 << jobs.length; m++) { const s = jobs.filter((_, i) => m >> i & 1); if (feasible(s)) b = Math.max(b, s.reduce((x, j) => x + j.profit, 0)) } return b }
const defaults = (): Job[] => [{ id: "1", name: "Job 1", profit: 100, deadline: 2, scheduled: false }, { id: "2", name: "Job 2", profit: 50, deadline: 1, scheduled: false }, { id: "3", name: "Job 3", profit: 15, deadline: 2, scheduled: false }, { id: "4", name: "Job 4", profit: 80, deadline: 1, scheduled: false }, { id: "5", name: "Job 5", profit: 60, deadline: 3, scheduled: false }]
const mk = (k: number, p: () => number, d: () => number): Job[] => Array.from({ length: k }, (_, i) => ({ id: String(i + 1), name: "Job " + (i + 1), profit: p(), deadline: d(), scheduled: false }))
const stats: Record<string, number> = {}; const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
const ex: Record<string, string> = {}; const note = (k: string, s: string) => { if (!ex[k] || s.length < ex[k].length) ex[k] = s }
function forward(jobs: Job[], label: string) {
  bump(label + ":runs")
  const L = new Legacy(jobs)
  L.runStep(); if (L.sortedJobs.length === 0) bump(label + ":'Sort Jobs' frame shows an empty job list")
  L.runStep()
  let mismatch = 0
  while (L.currentStep === 2 && L.currentJobIndex < L.sortedJobs.length) {
    const processing = L.sortedJobs[L.currentJobIndex]
    L.runStep()
    // after the click the caption describes `processing`; does the header / timeline panel refer to the same job?
    const tj = L.timelineJob()
    if (tj && tj.id !== processing.id) mismatch++
  }
  if (mismatch) bump(label + ":runs where header 'Job k of n' and timeline 'Current Job' name the next job, not the one the caption describes")
  stats[label + ":such frames (total)"] = (stats[label + ":such frames (total)"] ?? 0) + mismatch
  // play stall: auto-play at this point (step 2, all jobs processed) would never advance to the Final Result
  if (!L.playWouldAdvance() && L.currentStep !== 3) bump(label + ":auto-play stalls before 'Final Result' (still playing)")
  L.runStep()
  const placed = L.schedule.filter(Boolean) as Job[]
  placed.forEach((j) => { const slot = L.schedule.indexOf(j) + 1; if (slot > j.deadline) bump(label + ":job after its deadline") })
  if (new Set(placed.map((j) => j.id)).size !== placed.length) bump(label + ":job scheduled twice")
  if (L.totalProfit !== brute(jobs)) bump(label + ":total profit != brute force")
  if (placed.reduce((s, j) => s + j.profit, 0) !== L.totalProfit) bump(label + ":profit != sum of scheduled jobs")
}
forward(defaults(), "default")
for (let t = 0; t < 5000; t++) forward(mk(ri(1, 10), () => ri(1, 100), () => ri(1, 10)), "custom (deadline 1..10)")
for (let t = 0; t < 3000; t++) forward(mk(ri(1, 10), () => ri(1, 5), () => ri(1, 4)), "custom ties")
// Next/Back sequences
for (let t = 0; t < 4000; t++) {
  const jobs = rnd() < 0.3 ? defaults() : mk(ri(2, 7), () => ri(1, 50), () => ri(1, 5))
  const L = new Legacy(jobs); const log: string[] = []
  for (let k = 0; k < 40 && L.currentStep !== 3; k++) { if (rnd() < 0.75 || L.currentStep === 0) { L.runStep(); log.push("next") } else { L.back(); log.push("back") } }
  while (L.currentStep !== 3) { L.runStep(); log.push("next") }
  bump("seq:runs")
  const placed = L.schedule.filter(Boolean) as Job[]
  const dup = new Set(placed.map((j) => j.id)).size !== placed.length
  if (dup) bump("seq:a job occupies two slots")
  if (L.totalProfit !== brute(jobs)) { bump("seq:final total profit != optimum"); if (jobs.length === 5 && jobs[0].profit === 100) note("seq", log.join(",")) }
}
console.log(stats); console.log(ex)
// minimal Next/Back counterexample on the default jobs
{ const L = new Legacy(defaults()); for (const a of ["next", "next", "next", "back", "next"]) a === "next" ? L.runStep() : L.back(); while (L.currentStep !== 3) L.runStep(); console.log("default jobs, Next x3, Back, Next, then Next to end -> schedule", JSON.stringify(L.schedule.map((j) => j?.name ?? null)), "profit", L.totalProfit, "(optimum", brute(defaults()) + ")") }
// large deadline: the jobs effect allocates Array(maxDeadline)
for (const d of [1e7, 5e9]) { try { const L = new Legacy([{ id: "1", name: "J", profit: 1, deadline: d, scheduled: false }]); console.log(`deadline ${d}: schedule length`, L.schedule.length) } catch (e) { console.log(`deadline ${d}: THROWS`, String(e)) } }
