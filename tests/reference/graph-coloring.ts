// Independent oracles for graph colouring on vertices 0..n-1 with an edge list of index pairs.

// chromatic number by dynamic programming over vertex subsets (minimum cover by independent sets)
export function chromaticNumber(n: number, edges: [number, number][]): number {
  if (n === 0) return 0
  const adj = new Array<number>(n).fill(0)
  for (const [a, b] of edges) {
    adj[a] |= 1 << b
    adj[b] |= 1 << a
  }
  const full = 1 << n
  const independent = new Array<boolean>(full).fill(false)
  independent[0] = true
  for (let m = 1; m < full; m++) {
    const low = m & -m
    const v = 31 - Math.clz32(low)
    const rest = m ^ low
    independent[m] = independent[rest] && (adj[v] & rest) === 0
  }
  const best = new Array<number>(full).fill(Infinity)
  best[0] = 0
  for (let m = 1; m < full; m++) {
    const low = m & -m
    for (let s = m; s > 0; s = (s - 1) & m) {
      if ((s & low) !== 0 && independent[s] && best[m ^ s] + 1 < best[m]) best[m] = best[m ^ s] + 1
    }
  }
  return best[full - 1]
}

export const isProper = (colors: (number | null)[], edges: [number, number][]): boolean =>
  edges.every(([a, b]) => colors[a] === null || colors[b] === null || colors[a] !== colors[b])

// lexicographically first proper colouring with colours 0..m-1 (vertex 0 most significant), by brute-force
// enumeration of all m^n colour vectors in lexicographic order; null if none
export function firstColoringBruteForce(n: number, edges: [number, number][], m: number): number[] | null {
  if (m === 0) return n === 0 ? [] : null
  const c = new Array<number>(n).fill(0)
  for (;;) {
    if (isProper(c, edges)) return [...c]
    let i = n - 1
    while (i >= 0 && c[i] === m - 1) c[i--] = 0
    if (i < 0) return null
    c[i]++
  }
}

// number of (vertex, colour) attempts made by textbook m-colouring backtracking (adjacency-matrix version)
// that stops at the first complete colouring (or once more than `cap` attempts have been made)
export function backtrackingAttempts(
  n: number,
  edges: [number, number][],
  m: number,
  cap: number = Infinity,
): { attempts: number; assignments: number } {
  const adj: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false))
  for (const [a, b] of edges) adj[a][b] = adj[b][a] = true
  const x = new Array<number>(n).fill(-1)
  let attempts = 0
  let assignments = 0
  const go = (k: number): boolean => {
    if (k === n) return true
    for (let c = 0; c < m; c++) {
      if (attempts > cap) return false
      attempts++
      let ok = true
      for (let j = 0; j < n; j++) if (adj[k][j] && x[j] === c) ok = false
      if (!ok) continue
      x[k] = c
      assignments++
      if (go(k + 1)) return true
      x[k] = -1
    }
    return false
  }
  go(0)
  return { attempts, assignments }
}
