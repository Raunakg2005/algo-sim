// Runs the verbatim legacy sum-of-subsets logic against a brute-force oracle.
import { legacy } from "./legacy.ts"

let seed = 12345
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

function bruteSolutions(sorted: number[], target: number): string[] {
  const out: string[] = []
  const n = sorted.length
  for (let m = 0; m < 1 << n; m++) {
    const pick: number[] = []
    let s = 0
    for (let i = 0; i < n; i++) if (m & (1 << i)) { pick.push(sorted[i]); s += sorted[i] }
    if (s === target) out.push(pick.join(","))
  }
  return out.sort()
}
function reachable(rest: number[], need: number): boolean {
  for (let m = 0; m < 1 << rest.length; m++) {
    let s = 0
    for (let i = 0; i < rest.length; i++) if (m & (1 << i)) s += rest[i]
    if (s === need) return true
  }
  return false
}

type Verdict = { missed: boolean; extra: boolean; badPrune: boolean }
function check(nums: number[], target: number): Verdict {
  const sorted = [...nums].sort((a, b) => a - b)
  const r = legacy(sorted, target, sorted.join(", "), String(target), false)
  const last = r.steps[r.steps.length - 1]
  const got = last.solutions.map((s) => s.join(",")).sort()
  const want = bruteSolutions(sorted, target)
  const missed = want.some((w) => !got.includes(w)) || got.length < want.length
  const extra = got.some((g) => !want.includes(g)) || got.length > want.length
  let badPrune = false
  for (const s of r.steps) {
    if (s.description.startsWith("Cannot include")) {
      const i = s.currentIndex
      if (reachable(sorted.slice(i + 1), target - s.currentSum - sorted[i])) badPrune = true
    } else if (s.description.startsWith("Cannot exclude")) {
      const i = s.currentIndex
      if (reachable(sorted.slice(i + 1), target - s.currentSum)) badPrune = true
    }
  }
  return { missed, extra, badPrune }
}

function tally(name: string, gen: () => [number[], number], runs: number) {
  let missed = 0, extra = 0, badPrune = 0, withSol = 0, missedWithSol = 0, anyFail = 0
  for (let k = 0; k < runs; k++) {
    const [a, t] = gen()
    const v = check(a, t)
    const hasSol = bruteSolutions([...a].sort((x, y) => x - y), t).length > 0
    if (hasSol) withSol++
    if (v.missed) missed++
    if (v.missed && hasSol) missedWithSol++
    if (v.extra) extra++
    if (v.badPrune) badPrune++
    if (v.missed || v.extra || v.badPrune) anyFail++
  }
  console.log(`${name}: runs=${runs} anyFail=${anyFail} (${(100 * anyFail / runs).toFixed(1)}%) missedSolutions=${missed} extra=${extra} prunedFeasibleBranch=${badPrune} | inputs with >=1 solution=${withSol}, of which missed>=1 = ${missedWithSol}`)
}

// default example
{
  const v = check([2, 4, 6, 8, 10], 16)
  const sorted = [2, 4, 6, 8, 10]
  const r = legacy(sorted, 16, "2, 4, 6, 8, 10", "16", false)
  console.log("default [2,4,6,8,10] t=16:", v, "found:", JSON.stringify(r.steps[r.steps.length - 1].solutions), "oracle:", JSON.stringify(bruteSolutions(sorted, 16)))
}
// random button (count 4..7, values 1..20, target = sum of a random non-empty subset)
tally("Random button", () => {
  const count = ri(4, 7)
  const a: number[] = []
  for (let i = 0; i < count; i++) a.push(ri(1, 20))
  a.sort((x, y) => x - y)
  const idx = a.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) { const j = ri(0, i); [idx[i], idx[j]] = [idx[j], idx[i]] }
  const t = idx.slice(0, ri(1, count)).reduce((s, i) => s + a[i], 0)
  return [a, t]
}, 20000)
tally("Typed, positive 1..20, n 1..10, target 0..80", () => {
  const n = ri(1, 10); const a = Array.from({ length: n }, () => ri(1, 20)); return [a, ri(0, 80)]
}, 20000)
tally("Typed, with zeros 0..6, n 1..10, target 0..20", () => {
  const n = ri(1, 10); const a = Array.from({ length: n }, () => ri(0, 6)); return [a, ri(0, 20)]
}, 10000)
tally("Typed, with negatives -10..10, n 1..10, target -20..20", () => {
  const n = ri(1, 10); const a = Array.from({ length: n }, () => ri(-10, 10)); return [a, ri(-20, 20)]
}, 10000)

// minimal counterexamples (by n, then max |value|)
function minimal(lo: number, hi: number, label: string) {
  for (let n = 1; n <= 4; n++) {
    for (let M = 1; M <= 10; M++) {
      const vals: number[] = []
      for (let v = lo; v <= Math.min(hi, M); v++) if (Math.abs(v) <= M) vals.push(v)
      const rec = (pre: number[]): [number[], number] | null => {
        if (pre.length === n) {
          for (let t = -2 * M; t <= n * M; t++) { const v = check(pre, t); if (v.missed || v.extra || v.badPrune) return [pre, t] }
          return null
        }
        for (const v of vals) { if (pre.length && v < pre[pre.length - 1]) continue; const r = rec([...pre, v]); if (r) return r }
        return null
      }
      const r = rec([])
      if (r) { console.log(`minimal ${label}: numbers=${JSON.stringify(r[0])} target=${r[1]}`, check(r[0], r[1])); return }
    }
  }
}
minimal(1, 20, "positive")
minimal(-10, 20, "any integer")

// stale-state path: user types a new input on the fresh page (state = default) and clicks Start once
{
  const r = legacy([2, 4, 6, 8, 10], 16, "1, 2", "3", false)
  console.log("Typed '1, 2' target '3' then Start: engine ran on", JSON.stringify(r.numbersAfter), "target used in captions:", r.steps[0].description, "| target state shown:", r.targetAfter, "| input box now:", JSON.stringify(r.numbersInputAfter))
  let stale = 0, total = 0
  for (let k = 0; k < 10000; k++) {
    const n = ri(1, 10); const a = Array.from({ length: n }, () => ri(1, 20)); const t = ri(0, 80)
    const rr = legacy([2, 4, 6, 8, 10], 16, a.join(", "), String(t), false)
    total++
    const ranOn = rr.numbersAfter.join(",")
    const usedT = Number(rr.steps[0].description.split(": ")[1])
    if (ranOn !== [...a].sort((x, y) => x - y).join(",") || usedT !== t) stale++
  }
  console.log(`Typed input on first Start: ran on stale numbers/target in ${stale}/${total}`)
}
