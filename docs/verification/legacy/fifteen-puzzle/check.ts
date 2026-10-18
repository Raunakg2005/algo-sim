import { legacy, uiRandomPuzzle, uiParse } from "./legacy.ts"

let seed = 31337
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
Math.random = rnd
const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]
const key = (b: number[]) => b.join(",")
const nbrs = (b: number[]): number[][] => {
  const z = b.indexOf(0); const r = Math.floor(z / 4), c = z % 4; const out: number[][] = []
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc
    if (nr < 0 || nr > 3 || nc < 0 || nc > 3) continue
    const nb = [...b]; nb[z] = nb[nr * 4 + nc]; nb[nr * 4 + nc] = 0; out.push(nb)
  }
  return out
}
// BFS from the goal: exact distance of every board within DEPTH moves
const DEPTH = 14
const dist = new Map<string, number>([[key(GOAL), 0]])
let frontier = [GOAL]
for (let d = 1; d <= DEPTH; d++) {
  const next: number[][] = []
  for (const b of frontier) for (const nb of nbrs(b)) { const k = key(nb); if (!dist.has(k)) { dist.set(k, d); next.push(nb) } }
  frontier = next
}
console.log(`BFS table: ${dist.size} boards within ${DEPTH} moves`)
const solvable = (b: number[]) => {
  const t = b.filter((x) => x !== 0); let inv = 0
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) inv++
  const blankRowFromBottom = 4 - Math.floor(b.indexOf(0) / 4)
  return (inv + blankRowFromBottom) % 2 === 1
}
const to2d = (b: number[]) => [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4))

type V = { found: boolean; cost: number; illegal: boolean; notGoal: boolean; wrongCaptionDir: boolean; frames: number }
function run(b: number[]): V {
  const steps = legacy(to2d(b))
  const last = steps[steps.length - 1]
  const found = last.bestStateId !== null
  let illegal = false, notGoal = false, wrongCaptionDir = false
  const states = last.states
  for (const [, s] of states) {
    if (s.parent === null) continue
    const p = states.get(s.parent)!
    const pf = p.grid.flat(), sf = s.grid.flat()
    const diff = pf.map((v, i) => (v !== sf[i] ? i : -1)).filter((i) => i >= 0)
    const zp = pf.indexOf(0), zs = sf.indexOf(0)
    const adj = Math.abs(Math.floor(zp / 4) - Math.floor(zs / 4)) + Math.abs((zp % 4) - (zs % 4)) === 1
    if (diff.length !== 2 || !adj || sf[zp] !== s.movedTile || s.cost !== p.cost + 1) illegal = true
    // the tile moves from zs to zp: up if it goes to a smaller row, etc.
    const dr = Math.floor(zp / 4) - Math.floor(zs / 4), dc = (zp % 4) - (zs % 4)
    const tileDir = dr === -1 ? "up" : dr === 1 ? "down" : dc === -1 ? "left" : "right"
    if (s.move !== tileDir) wrongCaptionDir = true
  }
  if (found && key(states.get(last.bestStateId!)!.grid.flat()) !== key(GOAL)) notGoal = true
  return { found, cost: found ? states.get(last.bestStateId!)!.cost : -1, illegal, notGoal, wrongCaptionDir, frames: steps.length }
}

// 1) UI random generator (100 random blank moves)
{
  let found = 0, illegal = 0, notGoal = 0, cap = 0, wrongDir = 0, known = 0, subopt = 0, frames = 0
  const N = 500
  for (let k = 0; k < N; k++) {
    const g = uiRandomPuzzle().flat()
    const v = run(g)
    frames += v.frames
    if (v.found) found++; else cap++
    if (v.illegal) illegal++
    if (v.notGoal) notGoal++
    if (v.wrongCaptionDir) wrongDir++
    const d = dist.get(key(g))
    if (d !== undefined && v.found) { known++; if (v.cost !== d) subopt++ }
  }
  console.log(`UI random (100 moves): runs=${N} solved=${found} hitSearchLimit=${cap} (${(100 * cap / N).toFixed(1)}%) illegalMoves=${illegal} finalNotGoal=${notGoal} captionDirectionWrong=${wrongDir} | within-BFS-depth solved=${known} suboptimal=${subopt} | mean frames=${(frames / N).toFixed(0)}`)
}
// 2) short scrambles with known optimal length
{
  let runs = 0, found = 0, subopt = 0, cap = 0, wrongDir = 0, illegal = 0
  const byDepth = new Map<number, [number, number, number]>()
  let ex: { b: number[]; got: number; opt: number } | null = null
  for (let k = 0; k < 3000; k++) {
    let b = [...GOAL]
    const L = ri(1, 30)
    let prev = ""
    for (let i = 0; i < L; i++) { const ns = nbrs(b).filter((x) => key(x) !== prev); prev = key(b); b = ns[ri(0, ns.length - 1)] }
    const d = dist.get(key(b))
    if (d === undefined) continue
    runs++
    const v = run(b)
    const e = byDepth.get(d) ?? [0, 0, 0]
    e[0]++
    if (v.found) { found++; if (v.cost !== d) { subopt++; e[1]++; if (!ex || d < ex.opt) ex = { b, got: v.cost, opt: d } } } else { cap++; e[2]++ }
    byDepth.set(d, e)
    if (v.wrongCaptionDir) wrongDir++
    if (v.illegal) illegal++
  }
  console.log(`Scrambles with optimal length <= ${DEPTH}: runs=${runs} solved=${found} suboptimal=${subopt} hitSearchLimit=${cap} illegal=${illegal} captionDirectionWrong=${wrongDir}`)
  console.log("  by optimal depth [runs, suboptimal, limit]:", JSON.stringify([...byDepth.entries()].sort((a, b) => a[0] - b[0])))
  if (ex) console.log("  smallest suboptimal example:", JSON.stringify(ex))
}
// 3) one-move board: caption check
{
  const b = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]
  const steps = legacy(to2d(b))
  console.log("one move from goal (tile 15 must slide LEFT):", steps.filter((s) => s.description.startsWith("Move")).map((s) => s.description))
}
// 4) unsolvable and malformed custom input
{
  const swapped = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0]
  console.log("14/15 swapped solvable?", solvable(swapped))
  const t0 = Date.now()
  const steps = legacy(to2d(swapped))
  console.log(`  -> "${steps.at(-1)!.description}" after ${steps.length} frames (${Date.now() - t0} ms)`)
  const p = uiParse("1.5,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0")
  console.log("custom '1.5,2,...,15,0' accepted?", p.grid !== null, p.error)
  if (p.grid) { const s = legacy(p.grid); console.log(`  -> "${s.at(-1)!.description}", initial h = ${s[0].description}`) }
  // solvable check on 2000 random permutations: legacy never reports unsolvable, it always searches to the limit
  let unsolv = 0, wasted = 0
  for (let k = 0; k < 200; k++) {
    const perm = [...GOAL]; for (let i = 15; i > 0; i--) { const j = ri(0, i); [perm[i], perm[j]] = [perm[j], perm[i]] }
    if (!solvable(perm)) { unsolv++; const s = legacy(to2d(perm)); if (s.at(-1)!.description.includes("search limit")) wasted++ }
  }
  console.log(`random permutations: ${unsolv}/200 unsolvable; legacy answered "No solution found within the search limit" (no unsolvable verdict) for ${wasted}/${unsolv}`)
}
// 5) default board
{
  const s = legacy(to2d(GOAL))
  console.log("default board (already solved):", s.map((x) => x.description))
}
