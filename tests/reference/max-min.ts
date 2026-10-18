// Independent oracle for divide-and-conquer max/min, written without the engine.

// brute force over a range
export function rangeMaxMin(a: number[], lo: number, hi: number): { max: number; min: number } {
  let max = -Infinity
  let min = Infinity
  for (let k = lo; k <= hi; k++) {
    if (a[k] > max) max = a[k]
    if (a[k] < min) min = a[k]
  }
  return { max, min }
}

export type DCNode = { lo: number; hi: number; depth: number }

// shape of the recursion: sizes 1 and 2 are leaves, otherwise split at floor((lo + hi) / 2)
export function dcTree(n: number): { leaves1: DCNode[]; leaves2: DCNode[]; internal: DCNode[] } {
  const out = { leaves1: [] as DCNode[], leaves2: [] as DCNode[], internal: [] as DCNode[] }
  const stack: DCNode[] = n > 0 ? [{ lo: 0, hi: n - 1, depth: 0 }] : []
  while (stack.length) {
    const v = stack.pop()!
    const size = v.hi - v.lo + 1
    if (size === 1) out.leaves1.push(v)
    else if (size === 2) out.leaves2.push(v)
    else {
      const m = Math.floor((v.lo + v.hi) / 2)
      out.internal.push(v)
      stack.push({ lo: v.lo, hi: m, depth: v.depth + 1 }, { lo: m + 1, hi: v.hi, depth: v.depth + 1 })
    }
  }
  return out
}

// classic comparison count of the algorithm: 1 per pair, 2 per combine (gives 3n/2 - 2 when n is a power of two)
export function dcComparisons(n: number): number {
  const t = dcTree(n)
  return t.leaves2.length + 2 * t.internal.length
}
