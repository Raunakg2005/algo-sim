// Independent MST oracles (written without reference to lib/engines/mst.ts).
// Graphs are given as n vertices 0..n-1 and an edge list [u, v, w].

export type WEdge = [number, number, number]

/** number of connected components (DFS). */
export function componentCount(n: number, edges: [number, number][]): number {
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (const [a, b] of edges) {
    adj[a].push(b)
    adj[b].push(a)
  }
  const seen = new Array<boolean>(n).fill(false)
  let count = 0
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue
    count++
    const stack = [s]
    seen[s] = true
    while (stack.length) {
      const u = stack.pop()!
      for (const v of adj[u]) if (!seen[v]) { seen[v] = true; stack.push(v) }
    }
  }
  return count
}

/** true when the edge set has no cycle (|E| = n - components). */
export const isForest = (n: number, edges: [number, number][]): boolean => edges.length === n - componentCount(n, edges)

/** Weight of a minimum spanning forest by the reverse-delete algorithm. */
export function msfWeightReverseDelete(n: number, edges: WEdge[]): number {
  const comps = componentCount(n, edges.map(([a, b]) => [a, b]))
  let kept = [...edges].sort((x, y) => y[2] - x[2])
  let i = 0
  while (i < kept.length) {
    const without = kept.filter((_, k) => k !== i)
    if (componentCount(n, without.map(([a, b]) => [a, b])) === comps) kept = without
    else i++
  }
  return kept.reduce((s, e) => s + e[2], 0)
}

/** Minimum spanning tree weight by enumerating every (n-1)-edge subset (small graphs only). */
export function mstWeightBruteForce(n: number, edges: WEdge[]): number {
  let best = Number.POSITIVE_INFINITY
  const pick: WEdge[] = []
  const go = (from: number) => {
    if (pick.length === n - 1) {
      if (componentCount(n, pick.map(([a, b]) => [a, b])) === 1) best = Math.min(best, pick.reduce((s, e) => s + e[2], 0))
      return
    }
    for (let k = from; k < edges.length; k++) {
      pick.push(edges[k])
      go(k + 1)
      pick.pop()
    }
  }
  go(0)
  return n <= 1 ? 0 : best
}
