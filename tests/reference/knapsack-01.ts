// Independent oracle for the 0/1 knapsack problem: exhaustive search over all subsets.

export type KItem = { id: number; weight: number; value: number }

/** Best total value using only the first `count` items within capacity `cap` (2^count subsets). */
export function bruteForceBest(items: KItem[], count: number, cap: number): number {
  let best = 0
  for (let mask = 0; mask < 1 << count; mask++) {
    let w = 0
    let v = 0
    for (let b = 0; b < count; b++)
      if (mask & (1 << b)) {
        w += items[b].weight
        v += items[b].value
      }
    if (w <= cap && v > best) best = v
  }
  return best
}

/** Full table best[i][c] for i = 0..n, c = 0..cap. */
export function bruteForceTable(items: KItem[], cap: number): number[][] {
  const t: number[][] = []
  for (let i = 0; i <= items.length; i++) {
    t.push([])
    for (let c = 0; c <= cap; c++) t[i].push(bruteForceBest(items, i, c))
  }
  return t
}
