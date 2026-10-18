import { legacy } from "./legacy.ts"
type P = { row: number; col: number }
const attacks = (a: P, b: P) => a.row === b.row || a.col === b.col || Math.abs(a.row - b.row) === Math.abs(a.col - b.col)
const nonAttacking = (qs: P[]) => qs.every((a, i) => qs.every((b, j) => i === j || !attacks(a, b)))
function bruteCount(n: number): number {
  // all permutations: queen in column c at row perm[c]
  let count = 0
  const perm: number[] = []
  const used = new Array(n).fill(false)
  const rec = () => {
    if (perm.length === n) { if (nonAttacking(perm.map((r, c) => ({ row: r, col: c })))) count++; return }
    for (let r = 0; r < n; r++) if (!used[r]) { used[r] = true; perm.push(r); rec(); perm.pop(); used[r] = false }
  }
  rec()
  return count
}
for (let n = 1; n <= 8; n++) {
  const { steps, solutions } = legacy(n)
  const want = bruteCount(n)
  let badFrames = 0, badConflict = 0, badOrder = 0, badSol = 0, staleBoard = 0
  let placed = 0, considered = 0, conflicts = 0, backtracks = 0
  let lastConsidered: P | null = null
  for (const s of steps) {
    if (!nonAttacking(s.queensPositions) && s.phase !== "complete") badFrames++
    // board field agrees with queensPositions (except the complete frame, which shows an empty board)
    if (s.phase !== "complete") {
      const cells = s.board.flatMap((row, r) => row.map((v, c) => (v ? `${r},${c}` : ""))).filter(Boolean).sort()
      const qs = s.queensPositions.map((q) => `${q.row},${q.col}`).sort()
      if (cells.join() !== qs.join()) staleBoard++
    }
    if (s.phase === "conflict") {
      conflicts++
      const cur = s.currentPosition!
      if (s.conflictPositions.length === 0 || !s.conflictPositions.every((c) => s.queensPositions.some((q) => q.row === c.row && q.col === c.col) && attacks(c, cur))) badConflict++
    }
    if (s.phase === "place" && s.description.startsWith("Considering")) {
      considered++
      const cur = s.currentPosition!
      // column-by-column: the column under consideration = number of queens placed; rows ascend within a column
      if (cur.col !== s.queensPositions.length) badOrder++
      if (lastConsidered && lastConsidered.col === cur.col && cur.row <= lastConsidered.row && s.queensPositions.length === cur.col) { /* new visit after backtrack restarts at row 0 */ if (cur.row !== 0) badOrder++ }
      lastConsidered = cur
    }
    if (s.phase === "place" && s.description.startsWith("Placed")) placed++
    if (s.phase === "backtrack") backtracks++
    if (s.phase === "success" && (s.queensPositions.length !== n || !nonAttacking(s.queensPositions))) badSol++
  }
  const distinct = new Set(solutions.map((q) => q.map((p) => `${p.row},${p.col}`).sort().join(";"))).size
  console.log(`n=${n}: solutions=${solutions.length} (distinct ${distinct}, oracle ${want}) steps=${steps.length} considered=${considered} placed(nodes excl. root)=${placed} conflicts=${conflicts} backtracks=${backtracks} | attackingFrames=${badFrames} badConflictFrames=${badConflict} orderViolations=${badOrder} badSolutions=${badSol} boardMismatch=${staleBoard} final="${steps[steps.length - 1].description}"`)
}
