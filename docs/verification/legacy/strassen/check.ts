import { legacySteps, parseMatrixInput } from "./legacy.ts"
let seed = 12345
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
type M = number[][]
const naive = (A: M, B: M) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _x, k) => s + A[i][k] * B[k][j], 0)))
const eq = (a: M, b: M) => JSON.stringify(a) === JSON.stringify(b)
const gen = (n: number, f: () => number) => Array.from({ length: n }, () => Array.from({ length: n }, f))
const quad = (X: M, r: number, c: number) => { const h = X.length / 2; return X.slice(r * h, r * h + h).map((row) => row.slice(c * h, c * h + h)) }
const add = (X: M, Y: M) => X.map((r, i) => r.map((v, j) => v + Y[i][j]))
const sub = (X: M, Y: M) => X.map((r, i) => r.map((v, j) => v - Y[i][j]))

const stats: Record<string, number> = {}
const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1)
let firstHighlightMiss = ""
function check(A: M, B: M, label: string) {
  bump(label + ":runs")
  const steps = legacySteps(A, B)
  const last = steps[steps.length - 1]
  if (!eq(last.resultMatrix!, naive(A, B))) bump(label + ":result!=naive")
  // independent P checks (textbook M1..M7)
  const [A11, A12, A21, A22] = [quad(A, 0, 0), quad(A, 0, 1), quad(A, 1, 0), quad(A, 1, 1)]
  const [B11, B12, B21, B22] = [quad(B, 0, 0), quad(B, 0, 1), quad(B, 1, 0), quad(B, 1, 1)]
  const P = [naive(add(A11, A22), add(B11, B22)), naive(add(A21, A22), B11), naive(A11, sub(B12, B22)), naive(A22, sub(B21, B11)), naive(add(A11, A12), B22), naive(sub(A21, A11), add(B11, B12)), naive(sub(A12, A22), add(B21, B22))]
  for (let k = 1; k <= 7; k++) {
    const fr = steps.find((s) => s.subMatrices?.["P" + k] && s.operations?.[0]?.type === "multiply")
    if (!fr || !eq(fr.subMatrices!["P" + k].matrix, P[k - 1])) bump(label + ":P" + k + " wrong")
  }
  // highlight references
  let miss = 0
  for (const [idx, s] of steps.entries()) {
    const names = Object.values(s.subMatrices ?? {}).map((x) => x.name)
    const bad = (s.highlightedMatrices ?? []).filter((h) => !names.includes(h))
    if (bad.length) { miss++; if (!firstHighlightMiss) firstHighlightMiss = `frame ${idx} "${s.description}": highlighted ${JSON.stringify(bad)} but displayed names ${JSON.stringify(names)}` }
  }
  if (miss) bump(label + ":runs with highlight pointing at no displayed matrix")
  stats[label + ":frames with dangling highlight (total)"] = (stats[label + ":frames with dangling highlight (total)"] ?? 0) + miss
  // operation counts
  const ops = steps.flatMap((s) => s.operations ?? [])
  const addsub = ops.filter((o) => o.type !== "multiply").length, mul = ops.filter((o) => o.type === "multiply").length
  if (addsub !== 18 || mul !== 7) bump(label + `:op count ${addsub}/${mul}`)
  // combine frames show their result?
  for (const c of ["C11", "C12", "C21", "C22"]) {
    const fr = steps.find((s) => s.phase === "combine" && s.description.startsWith("Compute " + c))!
    if (!fr.subMatrices![c]) bump(label + `:combine frame for ${c} does not display ${c}`)
  }
  if (steps.length !== 19) bump(label + ":frames!=19")
}
for (const n of [2, 4, 8]) for (let t = 0; t < 2000; t++) check(gen(n, () => ri(1, 9)), gen(n, () => ri(1, 9)), `ui-random n=${n}`)
check([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]], [[17, 18, 19, 20], [21, 22, 23, 24], [25, 26, 27, 28], [29, 30, 31, 32]], "default")
for (const n of [2, 4, 8]) for (let t = 0; t < 2000; t++) check(gen(n, () => ri(-50, 50)), gen(n, () => ri(-50, 50)), `custom-int n=${n}`)
// custom decimals (UI parser accepts them)
let decMismatch = 0, decRuns = 0, worst = 0, firstDec = ""
for (const n of [2, 4, 8]) for (let t = 0; t < 2000; t++) {
  const A = gen(n, () => ri(-99, 99) / 10), B = gen(n, () => ri(-99, 99) / 10)
  const r = legacySteps(A, B).at(-1)!.resultMatrix!, o = naive(A, B); decRuns++
  if (!eq(r, o)) { decMismatch++; if (!firstDec && n === 2) firstDec = JSON.stringify({ A, B, strassen: r, naive: o }) }
  r.forEach((row, i) => row.forEach((v, j) => (worst = Math.max(worst, Math.abs(v - o[i][j])))))
}
console.log(stats)
console.log("first dangling highlight:", firstHighlightMiss)
console.log(`decimal custom input: ${decMismatch}/${decRuns} results differ bitwise from naive product (max abs diff ${worst}); e.g. ${firstDec}`)
// parser quirks
const cases: [string, number][] = [[",1\n2 3", 2], ["1,\n2 3", 2], ["Infinity 1\n1 1", 2], ["1e400 1\n1 1", 2], ["1\t2\n3 4", 2], ["0x10 1\n1 1", 2], ["1 2\n3 4", 2]]
for (const [s, n] of cases) console.log(JSON.stringify(s), "->", JSON.stringify(parseMatrixInput(s, n)))
const r = legacySteps([[Infinity, 1], [1, 1]], [[1, 1], [1, 1]]).at(-1)!.resultMatrix
console.log("Infinity input result:", JSON.stringify(r), "naive:", JSON.stringify(naive([[Infinity, 1], [1, 1]], [[1, 1], [1, 1]])))
