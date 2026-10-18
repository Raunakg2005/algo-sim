// Independent oracles for the multistage-graph problem (cheapest node-to-terminal costs).

export type MEdge = { source: string; target: string; cost: number }

/** Enumerates every path from `from` to a node without outgoing edges in `terminals`; exponential. */
export function bruteForceCost(edges: MEdge[], terminals: Set<string>, from: string): number {
  if (terminals.has(from)) return 0
  let best = Number.POSITIVE_INFINITY
  for (const e of edges) if (e.source === from) best = Math.min(best, e.cost + bruteForceCost(edges, terminals, e.target))
  return best
}

/** Bellman-Ford style relaxation toward the terminals (no stage ordering used). */
export function relaxationCosts(ids: string[], edges: MEdge[], terminals: Set<string>): Record<string, number> {
  const d: Record<string, number> = {}
  for (const v of ids) d[v] = terminals.has(v) ? 0 : Number.POSITIVE_INFINITY
  for (let round = 0; round < ids.length; round++)
    for (const e of edges) if (e.cost + d[e.target] < d[e.source]) d[e.source] = e.cost + d[e.target]
  return d
}
