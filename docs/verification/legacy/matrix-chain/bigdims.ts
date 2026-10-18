import { legacySteps } from "./legacy.ts"
let seed = 31337
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
type T = number | [T, T]
const parse = (s: string): T => { let pos = 0; const go = (): T => { if (s[pos] === "(") { pos++; const a = go(); pos += 3; const b = go(); pos++; return [a, b] } const m = /^M(\d+)/.exec(s.slice(pos))!; pos += m[0].length; return Number(m[1]) - 1 }; return go() }
const cost = (t: T, p: bigint[]): { c: bigint; r: bigint; k: bigint } => { if (typeof t === "number") return { c: 0n, r: p[t], k: p[t + 1] }; const a = cost(t[0], p), b = cost(t[1], p); return { c: a.c + b.c + a.r * a.k * b.k, r: a.r, k: b.k } }
const opt = (p: bigint[]) => { const n = p.length - 1; const m: bigint[][] = Array.from({ length: n }, () => Array(n).fill(0n)); for (let len = 2; len <= n; len++) for (let i = 0; i + len - 1 < n; i++) { const j = i + len - 1; let b = -1n; for (let k = i; k < j; k++) { const c = m[i][k] + m[k + 1][j] + p[i] * p[k + 1] * p[j + 1]; if (b < 0n || c < b) b = c } m[i][j] = b } return m[0][n - 1] }
for (const max of [1e4, 1e5, 1e6, 1e7]) {
  let bad = 0, badVal = 0, runs = 20000, first = ""
  for (let t = 0; t < runs; t++) {
    const n = 3 + Math.floor(rnd() * 6); const p = Array.from({ length: n + 1 }, () => 1 + Math.floor(rnd() * max))
    const s = legacySteps(p, n) as any[]; const last = s.at(-1)
    const P = p.map(BigInt), o = opt(P), got = cost(parse(last.parenthesization), P).c
    if (got !== o) { bad++; if (!first) first = JSON.stringify({ p, chosen: last.parenthesization, exactCost: String(got), optimum: String(o) }) }
    if (BigInt(last.costMatrix[0][n - 1]) !== o && Number.isSafeInteger(last.costMatrix[0][n - 1])) badVal++
  }
  console.log(`dims 1..${max}: non-optimal parenthesisation ${bad}/${runs}; ${first}`)
}
