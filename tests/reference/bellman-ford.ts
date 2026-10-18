// Independent single-source oracles for directed graphs with possibly negative weights.
// Matrix form: M[i][j] = weight of edge i -> j, or Infinity for no edge (diagonal ignored).

/** Textbook Bellman-Ford: |V|-1 rounds, then one detection pass. */
export function bellmanFordReference(M: number[][], s: number): { dist: number[]; negativeCycle: boolean } {
  const n = M.length
  const dist = new Array<number>(n).fill(Number.POSITIVE_INFINITY)
  dist[s] = 0
  for (let round = 0; round < n - 1; round++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (i !== j && Number.isFinite(M[i][j]) && dist[i] + M[i][j] < dist[j]) dist[j] = dist[i] + M[i][j]
  let negativeCycle = false
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j && Number.isFinite(M[i][j]) && dist[i] + M[i][j] < dist[j]) negativeCycle = true
  return { dist, negativeCycle }
}

/**
 * Brute force (small n only): enumerates every simple path from s for distances, and every simple
 * cycle through a vertex reachable from s to decide whether a negative cycle is reachable.
 */
export function bruteForceShortestPaths(M: number[][], s: number): { dist: number[]; negativeCycle: boolean } {
  const n = M.length
  const dist = new Array<number>(n).fill(Number.POSITIVE_INFINITY)
  const onPath = new Array<boolean>(n).fill(false)
  const walk = (u: number, acc: number) => {
    dist[u] = Math.min(dist[u], acc)
    onPath[u] = true
    for (let v = 0; v < n; v++) if (v !== u && !onPath[v] && Number.isFinite(M[u][v])) walk(v, acc + M[u][v])
    onPath[u] = false
  }
  walk(s, 0)
  let negativeCycle = false
  // simple cycles whose smallest vertex is c, through reachable vertices only
  for (let c = 0; c < n && !negativeCycle; c++) {
    if (!Number.isFinite(dist[c])) continue
    const seen = new Array<boolean>(n).fill(false)
    const cyc = (u: number, acc: number): void => {
      if (negativeCycle) return
      for (let v = c; v < n; v++) {
        if (v === u || !Number.isFinite(M[u][v])) continue
        if (v === c) {
          if (acc + M[u][v] < 0) negativeCycle = true
        } else if (!seen[v]) {
          seen[v] = true
          cyc(v, acc + M[u][v])
          seen[v] = false
        }
      }
    }
    seen[c] = true
    cyc(c, 0)
  }
  return { dist, negativeCycle }
}
