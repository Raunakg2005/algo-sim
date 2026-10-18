// Shared helpers for the stack / queue / deque / priority-queue legacy harnesses.

// mulberry32 seeded PRNG so runs are reproducible
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
export const int = (r: () => number, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1))
export const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]

// Code-line oracle: a frame for `method` should highlight a line inside that method's body that contains `expect`.
export const lineStats = { frames: 0, wrong: 0 }
export function lineOk(code: string[], idx: number, method: string, expect: string | string[]): boolean {
  const want = Array.isArray(expect) ? expect : [expect]
  const header = code.findIndex((l) => l.trim().startsWith(method + "("))
  if (header < 0) { lineStats.frames++; lineStats.wrong++; return false }
  let end = header + 1
  while (end < code.length && code[end] !== "  }") end++
  const ok = idx > header && idx < end && want.some((w) => code[idx].includes(w))
  lineStats.frames++
  if (!ok) lineStats.wrong++
  return ok
}

export class Tally {
  counts = new Map<string, number>()
  examples = new Map<string, string>()
  add(key: string, example: string): void {
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1)
    const prev = this.examples.get(key)
    if (prev === undefined || example.length < prev.length) this.examples.set(key, example)
  }
  print(total: number, unit: string): void {
    if (lineStats.frames) console.log(`  code-line highlight wrong on ${lineStats.wrong}/${lineStats.frames} frames (${((100 * lineStats.wrong) / lineStats.frames).toFixed(1)}%)`)
    if (this.counts.size === 0) console.log(`  no defects in ${total} ${unit}`)
    for (const [k, c] of this.counts) {
      console.log(`  ${k}: ${c}/${total} ${unit} (${((100 * c) / total).toFixed(1)}%)`)
      console.log(`    minimal example: ${this.examples.get(k)}`)
    }
  }
}
