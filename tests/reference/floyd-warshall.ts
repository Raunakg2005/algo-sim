// Independent all-pairs oracle for directed graphs with non-negative weights:
// O(n^2)-per-source Dijkstra, run from every vertex. M[i][j] = Infinity means "no edge".

export function allPairsDijkstra(M: number[][]): number[][] {
  const n = M.length
  return Array.from({ length: n }, (_, s) => {
    const d = new Array<number>(n).fill(Number.POSITIVE_INFINITY)
    const done = new Array<boolean>(n).fill(false)
    d[s] = 0
    for (;;) {
      let u = -1
      for (let v = 0; v < n; v++) if (!done[v] && d[v] < Number.POSITIVE_INFINITY && (u === -1 || d[v] < d[u])) u = v
      if (u === -1) break
      done[u] = true
      for (let v = 0; v < n; v++) if (v !== u && Number.isFinite(M[u][v]) && d[u] + M[u][v] < d[v]) d[v] = d[u] + M[u][v]
    }
    return d
  })
}

/** Weight of a node path in M, or NaN if a step is not an edge. */
export function pathWeight(M: number[][], path: number[]): number {
  let w = 0
  for (let i = 0; i + 1 < path.length; i++) {
    const e = M[path[i]][path[i + 1]]
    if (path[i] === path[i + 1] || !Number.isFinite(e)) return Number.NaN
    w += e
  }
  return w
}
