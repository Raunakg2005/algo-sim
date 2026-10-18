// Step generator for the Merge Sort visualizer.
// Pure function: given an input array, returns every frame the visualizer plays.
// Blocks are identified by their index range in the original array, so inputs with
// repeated values are tracked correctly.

export type MergeSortStep = {
  arrays: number[][]
  level: number[]
  merging: boolean[]
  merged: boolean[]
  comparisons?: [number, number][]
}

type Block = { lo: number; hi: number; values: number[]; level: number; merging: boolean; merged: boolean }

export function generateMergeSortSteps(input: number[]): MergeSortStep[] {
  const steps: MergeSortStep[] = []
  let blocks: Block[] = [{ lo: 0, hi: input.length - 1, values: [...input], level: 0, merging: false, merged: false }]

  const snapshot = (comparisons?: [number, number][]) => {
    const step: MergeSortStep = {
      arrays: blocks.map((b) => [...b.values]),
      level: blocks.map((b) => b.level),
      merging: blocks.map((b) => b.merging),
      merged: blocks.map((b) => b.merged),
    }
    if (comparisons) step.comparisons = comparisons
    steps.push(step)
  }
  const indexOf = (lo: number, hi: number) => blocks.findIndex((b) => b.lo === lo && b.hi === hi)

  snapshot()

  const sort = (lo: number, hi: number, level: number): number[] => {
    const values = input.slice(lo, hi + 1)
    if (hi - lo + 1 <= 1) return values

    const mid = lo + Math.floor((hi - lo + 1) / 2) - 1
    const at = indexOf(lo, hi)
    blocks.splice(
      at,
      1,
      { lo, hi: mid, values: input.slice(lo, mid + 1), level: level + 1, merging: false, merged: false },
      { lo: mid + 1, hi, values: input.slice(mid + 1, hi + 1), level: level + 1, merging: false, merged: false },
    )
    snapshot()

    const left = sort(lo, mid, level + 1)
    const right = sort(mid + 1, hi, level + 1)
    return merge(lo, mid, hi, left, right, level)
  }

  const merge = (lo: number, mid: number, hi: number, left: number[], right: number[], level: number): number[] => {
    const li = indexOf(lo, mid)
    const ri = indexOf(mid + 1, hi)
    blocks[li].merging = true
    blocks[ri].merging = true
    snapshot()

    const result: number[] = []
    let i = 0
    let j = 0
    while (i < left.length && j < right.length) {
      snapshot([
        [li, i],
        [ri, j],
      ])
      // "<=" keeps equal keys in their original order (stable), as in the pseudocode
      if (left[i] <= right[j]) result.push(left[i++])
      else result.push(right[j++])
    }
    while (i < left.length) result.push(left[i++])
    while (j < right.length) result.push(right[j++])

    blocks.splice(li, 2, { lo, hi, values: result, level, merging: false, merged: true })
    snapshot()
    return result
  }

  if (input.length > 0) sort(0, input.length - 1, 0)
  return steps
}
