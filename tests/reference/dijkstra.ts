// Independent shortest-path oracles for undirected graphs (written without reference to the engine).

export type UEdge = { source: string; target: string; weight: number }

/** Single-source distances in an undirected graph with non-negative weights (|V| rounds of relaxation). */
export function undirectedDistances(ids: string[], edges: UEdge[], source: string): Record<string, number> {
  const d: Record<string, number> = {}
  for (const v of ids) d[v] = v === source ? 0 : Number.POSITIVE_INFINITY
  for (let round = 0; round < ids.length; round++) {
    for (const e of edges) {
      if (d[e.source] + e.weight < d[e.target]) d[e.target] = d[e.source] + e.weight
      if (d[e.target] + e.weight < d[e.source]) d[e.source] = d[e.target] + e.weight
    }
  }
  return d
}

/** Cheapest edge weight between a and b (undirected), or undefined if they are not adjacent. */
export function cheapestEdge(edges: UEdge[], a: string, b: string): number | undefined {
  let best: number | undefined
  for (const e of edges)
    if ((e.source === a && e.target === b) || (e.source === b && e.target === a)) best = best === undefined ? e.weight : Math.min(best, e.weight)
  return best
}
