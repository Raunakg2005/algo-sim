// Independent oracles for the 15-puzzle. Boards are flat arrays of 16 numbers in row-major order, 0 = blank.

export const GOAL: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]

export const neighbours = (b: number[]): number[][] => {
  const z = b.indexOf(0)
  const r = Math.floor(z / 4)
  const c = z % 4
  const out: number[][] = []
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nr > 3 || nc < 0 || nc > 3) continue
    const nb = [...b]
    nb[z] = nb[nr * 4 + nc]
    nb[nr * 4 + nc] = 0
    out.push(nb)
  }
  return out
}

// exact distance to the goal of every board within `depth` moves (breadth-first search backwards from the goal)
export function distancesFromGoal(depth: number): Map<string, number> {
  const dist = new Map<string, number>([[GOAL.join(","), 0]])
  let frontier = [GOAL]
  for (let d = 1; d <= depth; d++) {
    const next: number[][] = []
    for (const b of frontier) {
      for (const nb of neighbours(b)) {
        const k = nb.join(",")
        if (!dist.has(k)) {
          dist.set(k, d)
          next.push(nb)
        }
      }
    }
    frontier = next
  }
  return dist
}

// Solvability via permutation parity: treat the blank as tile 16; every move is a transposition that also moves the
// blank one step, so a board is reachable iff the parity of the permutation equals the parity of the blank's
// Manhattan distance from its goal square (bottom right). Cycle counting, not inversion counting.
export function solvableByPermutationParity(b: number[]): boolean {
  const p = b.map((v) => (v === 0 ? 15 : v - 1)) // square i holds tile p[i] (goal square of that tile)
  const seen = new Array<boolean>(16).fill(false)
  let cycles = 0
  for (let i = 0; i < 16; i++) {
    if (seen[i]) continue
    cycles++
    for (let j = i; !seen[j]; j = p[j]) seen[j] = true
  }
  const permParity = (16 - cycles) % 2
  const z = b.indexOf(0)
  const blankDistance = (3 - Math.floor(z / 4)) + (3 - (z % 4))
  return permParity === blankDistance % 2
}

export function manhattan(b: number[]): number {
  let d = 0
  b.forEach((v, i) => {
    if (v === 0) return
    d += Math.abs(Math.floor(i / 4) - Math.floor((v - 1) / 4)) + Math.abs((i % 4) - ((v - 1) % 4))
  })
  return d
}
