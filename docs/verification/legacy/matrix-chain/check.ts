import { legacySteps, legacyParse, legacyUpdateDimensions } from "./legacy.ts"
let seed = 777
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
// brute force: enumerate every parenthesisation tree explicitly
type T = number | [T, T]
const trees = (i: number, j: number): T[] => { if (i === j) return [i]; const r: T[] = []; for (let k = i; k < j; k++) for (const a of trees(i, k)) for (const b of trees(k + 1, j)) r.push([a, b]); return r }
const cost = (t: T, p: number[]): { c: number; r: number; k: number } => { if (typeof t === "number") return { c: 0, r: p[t], k: p[t + 1] }; const a = cost(t[0], p), b = cost(t[1], p); return { c: a.c + b.c + a.r * a.k * b.k, r: a.r, k: b.k } }
const best = (p: number[], i: number, j: number) => Math.min(...trees(i, j).map((t) => cost(t, p).c))
const parse = (s: string): T => { let pos = 0; const go = (): T => { if (s[pos] === "(") { pos++; const a = go(); pos += 3; const b = go(); pos++; return [a, b] } const m = /^M(\d+)/.exec(s.slice(pos))!; pos += m[0].length; return Number(m[1]) - 1 }; const t = go(); if (pos !== s.length) throw new Error("trailing"); return t }
const leaves = (t: T): number[] => (typeof t === "number" ? [t] : [...leaves(t[0]), ...leaves(t[1])])
const stats: Record<string, number> = {}; const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
function check(p: number[], label: string) {
  const n = p.length - 1; bump(label + ":runs")
  const steps = legacySteps(p, n); if (typeof steps === "string") { bump(label + ":error " + steps); return }
  const last = steps.at(-1)!
  const m = last.costMatrix!, s = last.splitMatrix!
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { if (n <= 8 && m[i][j] !== best(p, i, j)) { bump(label + ":m cell wrong"); return } if (j > i && (s[i][j] < i || s[i][j] >= j)) bump(label + ":s out of range") }
  const t = parse(last.parenthesization!)
  if (JSON.stringify(leaves(t)) !== JSON.stringify([...Array(n).keys()])) bump(label + ":paren not M1..Mn in order")
  if (cost(t, p).c !== best(p, 0, n - 1)) bump(label + ":paren not optimal")
  for (const st of steps) for (const c of st.highlightCells ?? []) if (c.i < 0 || c.j < c.i || c.j >= n) bump(label + ":bad highlight")
}
for (let t = 0; t < 3000; t++) { const n = ri(3, 6); check(Array.from({ length: n + 1 }, () => ri(5, 44)), "ui-random") }
check([30, 35, 15, 5, 10], "default")
for (let t = 0; t < 3000; t++) { const n = ri(2, 8); check(Array.from({ length: n + 1 }, () => ri(1, 6)), "custom small dims (ties)") }
for (let t = 0; t < 200; t++) { const n = ri(9, 10); check(Array.from({ length: n + 1 }, () => ri(1, 100)), "custom n=9..10") }
console.log(stats)
// input handling
console.log("parse '30, 35.7, 15abc, 5, 10' ->", JSON.stringify(legacyParse("30, 35.7, 15abc, 5, 10", 4)))
console.log("parse '1e3, 2, 3' (n=2) ->", JSON.stringify(legacyParse("1e3, 2, 3", 2)))
const u = legacyUpdateDimensions(2.5, [30, 35, 15, 5, 10]); console.log("updateDimensions(2.5) ->", JSON.stringify(u))
try { const r = legacySteps((u as any).dims, 2.5); console.log("startAlgorithm with n=2.5 ->", typeof r === "string" ? r : r.length + " frames") } catch (e) { console.log("startAlgorithm with n=2.5 THROWS:", String(e)) }
