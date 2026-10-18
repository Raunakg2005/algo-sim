// Independent reference implementations used as test oracles.
// Written separately from lib/engines so that a shared bug cannot hide itself.

export const sorted = (a: number[]) => [...a].sort((x, y) => x - y)

export const multiset = (a: number[]) => {
  const m = new Map<number, number>()
  for (const x of a) m.set(x, (m.get(x) ?? 0) + 1)
  return [...m.entries()].sort((x, y) => x[0] - y[0])
}

// number of key comparisons made by top-down merge sort with the split floor(n/2)
export function mergeSortComparisons(a: number[]): number {
  if (a.length <= 1) return 0
  const m = Math.floor(a.length / 2)
  const L = sorted(a.slice(0, m))
  const R = sorted(a.slice(m))
  let i = 0, j = 0, c = 0
  while (i < L.length && j < R.length) {
    c++
    if (L[i] <= R[j]) i++
    else j++
  }
  return mergeSortComparisons(a.slice(0, m)) + mergeSortComparisons(a.slice(m)) + c
}
