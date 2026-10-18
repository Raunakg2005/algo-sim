// Independent oracle: textbook selection sort (leftmost minimum, strict <), written without the engine.

export function selectionSortTrace(input: number[]): { sorted: number[]; comparisons: number; swaps: number; newMinimums: number } {
  const a = input.slice()
  let comparisons = 0
  let swaps = 0
  let newMinimums = 0
  for (let i = 0; i + 1 < a.length; i++) {
    let m = i
    for (let j = i + 1; j < a.length; j++) {
      comparisons++
      if (a[j] < a[m]) { m = j; newMinimums++ }
    }
    if (m !== i) { const t = a[i]; a[i] = a[m]; a[m] = t; swaps++ }
  }
  return { sorted: a, comparisons, swaps, newMinimums }
}
