// Brute-force TSP oracles (permutation enumeration), independent of the Held-Karp engine.

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items]
  const out: number[][] = []
  items.forEach((x, k) => {
    for (const rest of permutations([...items.slice(0, k), ...items.slice(k + 1)])) out.push([x, ...rest])
  })
  return out
}

/** Cost of the closed tour visiting `order` in sequence and returning to order[0]. */
export function tourCost(D: number[][], order: number[]): number {
  let c = 0
  for (let i = 0; i < order.length; i++) c += D[order[i]][order[(i + 1) % order.length]]
  return c
}

/** Minimum closed-tour cost over all (n-1)! orders that start at s (depth-first enumeration). */
export function bruteForceTour(D: number[][], s: number): number {
  const n = D.length
  const used = new Array<boolean>(n).fill(false)
  used[s] = true
  let best = Number.POSITIVE_INFINITY
  const go = (last: number, depth: number, acc: number) => {
    if (depth === n) {
      best = Math.min(best, acc + D[last][s])
      return
    }
    for (let v = 0; v < n; v++) {
      if (used[v]) continue
      used[v] = true
      go(v, depth + 1, acc + D[last][v])
      used[v] = false
    }
  }
  go(s, 1, 0)
  return best
}

/** Cheapest path s -> ... -> end visiting exactly the cities of `mask` (which contains s and end). */
export function bruteForcePath(D: number[][], s: number, mask: number, end: number): number {
  const middle: number[] = []
  for (let i = 0; i < D.length; i++) if (mask & (1 << i) && i !== s && i !== end) middle.push(i)
  let best = Number.POSITIVE_INFINITY
  for (const p of permutations(middle)) {
    const order = [s, ...p, end]
    let c = 0
    for (let i = 0; i + 1 < order.length; i++) c += D[order[i]][order[i + 1]]
    best = Math.min(best, c)
  }
  return best
}
