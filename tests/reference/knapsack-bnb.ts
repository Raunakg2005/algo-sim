// Independent oracles for the 0/1 knapsack problem.

export type WV = { weight: number; value: number }

// best total value by trying all 2^n subsets
export function bruteForceKnapsack(items: WV[], capacity: number): number {
  let best = 0
  for (let mask = 0; mask < 1 << items.length; mask++) {
    let w = 0
    let v = 0
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        w += items[i].weight
        v += items[i].value
      }
    }
    if (w <= capacity && v > best) best = v
  }
  return best
}

// suffixBest[i][c] = best value using only items[i..] with capacity c (classic dynamic programme, c = 0..capacity)
export function suffixKnapsackTable(items: WV[], capacity: number): number[][] {
  const n = items.length
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(capacity + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let c = 0; c <= capacity; c++) {
      table[i][c] = table[i + 1][c]
      if (items[i].weight <= c) table[i][c] = Math.max(table[i][c], table[i + 1][c - items[i].weight] + items[i].value)
    }
  }
  return table
}
