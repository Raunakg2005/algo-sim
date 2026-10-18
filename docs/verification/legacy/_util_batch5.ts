// Shared helpers for the legacy checks of quick-sort, heap-sort, max-min, selection-sort, insertion-sort.
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// all arrays of length len over the given values, in lexicographic order
export function* allArrays(len: number, values: number[]): Generator<number[]> {
  const idx = new Array<number>(len).fill(0)
  while (true) {
    yield idx.map((k) => values[k])
    let p = len - 1
    while (p >= 0 && idx[p] === values.length - 1) idx[p--] = 0
    if (p < 0) return
    idx[p]++
  }
}

export type Check<S> = (input: number[], steps: S[]) => string[] // returns names of defects present

export class Tally {
  total = 0
  failing = 0
  byDefect = new Map<string, { count: number; example: number[] }>()
  record(input: number[], defects: string[]) {
    this.total++
    if (defects.length) this.failing++
    for (const d of new Set(defects)) {
      const e = this.byDefect.get(d)
      if (!e) this.byDefect.set(d, { count: 1, example: input })
      else {
        e.count++
        if (smaller(input, e.example)) e.example = input
      }
    }
  }
  report(title: string) {
    const pct = (x: number) => ((100 * x) / Math.max(1, this.total)).toFixed(1)
    console.log(`\n== ${title}: ${this.total} inputs, ${this.failing} with >=1 defect (${pct(this.failing)}%)`)
    for (const [d, e] of this.byDefect) console.log(`  - ${d}: ${e.count} (${pct(e.count)}%)  minimal: [${e.example.join(", ")}]`)
  }
}

function smaller(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return a.length < b.length
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return Math.abs(a[i]) < Math.abs(b[i]) || (Math.abs(a[i]) === Math.abs(b[i]) && a[i] > b[i])
  return false
}

export const sortedCopy = (a: number[]) => [...a].sort((x, y) => x - y)
export const sameMultiset = (a: number[], b: number[]) => {
  const x = sortedCopy(a), y = sortedCopy(b)
  return x.length === y.length && x.every((v, i) => Object.is(v, y[i]) || v === y[i])
}
