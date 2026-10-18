// Brute-force oracle for Sum of Subsets: enumerate all 2^n index subsets.

// every subset (by index) of `values` whose sum is `target`, each listed in index order, as "a,b,c" strings, sorted
export function allSubsetSums(values: number[], target: number): string[] {
  const out: string[] = []
  const n = values.length
  for (let mask = 0; mask < 1 << n; mask++) {
    let sum = 0
    const pick: number[] = []
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += values[i]
        pick.push(values[i])
      }
    }
    if (sum === target) out.push(pick.join(","))
  }
  return out.sort()
}

// is there a subset of `values` (possibly empty) summing to `need`?
export function subsetReaches(values: number[], need: number): boolean {
  let sums = new Set<number>([0])
  for (const v of values) {
    const next = new Set<number>(sums)
    for (const s of sums) next.add(s + v)
    sums = next
  }
  return sums.has(need)
}
