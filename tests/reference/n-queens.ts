// Independent oracles for N-Queens.

export type Square = { row: number; col: number }

export const attacks = (a: Square, b: Square): boolean =>
  a.row === b.row || a.col === b.col || Math.abs(a.row - b.row) === Math.abs(a.col - b.col)

export const nonAttacking = (qs: Square[]): boolean =>
  qs.every((a, i) => qs.every((b, j) => i === j || !attacks(a, b)))

// brute force: every permutation (queen in column c sits in row perm[c]) that is non-attacking,
// returned as "r0,r1,...,r(n-1)" strings in lexicographic order
export function allSolutionsBruteForce(n: number): string[] {
  const out: string[] = []
  const perm: number[] = []
  const used = new Array<boolean>(n).fill(false)
  const rec = () => {
    if (perm.length === n) {
      if (nonAttacking(perm.map((row, col) => ({ row, col })))) out.push(perm.join(","))
      return
    }
    for (let r = 0; r < n; r++) {
      if (used[r]) continue
      used[r] = true
      perm.push(r)
      rec()
      perm.pop()
      used[r] = false
    }
  }
  rec()
  return out.sort()
}

// Textbook column-by-column backtracking (rows top to bottom), written with a queen list rather than a board.
// Returns the sequence of squares it examines, each with its verdict.
export function backtrackingTrace(n: number): { row: number; col: number; safe: boolean }[] {
  const trace: { row: number; col: number; safe: boolean }[] = []
  const queens: Square[] = []
  const place = (col: number) => {
    if (col === n) return
    for (let row = 0; row < n; row++) {
      const safe = queens.every((q) => !attacks(q, { row, col }))
      trace.push({ row, col, safe })
      if (!safe) continue
      queens.push({ row, col })
      place(col + 1)
      queens.pop()
    }
  }
  place(0)
  return trace
}

// Known solution counts (OEIS A000170) for n = 1..10
export const KNOWN_COUNTS = [1, 0, 0, 2, 10, 4, 40, 92, 352, 724]
