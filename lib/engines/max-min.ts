// Step generator for the Divide & Conquer Max/Min visualizer.
// Pure function: given an input array, returns every frame the visualizer plays.
// Recursion: ranges of size 1 and 2 are base cases; larger ranges split at mid = floor((start + end) / 2).
// Each frame lists the recursion-tree segments visible at that moment (the component draws one row per level).

export type MaxMinSegment = {
  start: number
  end: number
  level: number
  max?: number
  min?: number
  isProcessing?: boolean
  isComparing?: boolean
  isResult?: boolean
  comparingIndices?: number[]
}

export type MaxMinStep = {
  segments: MaxMinSegment[]
  description: string
  phase: "divide" | "conquer" | "compare" | "result"
}

export function generateMaxMinSteps(array: number[]): MaxMinStep[] {
  const steps: MaxMinStep[] = []
  const n = array.length
  const segments: MaxMinSegment[] = n > 0 ? [{ start: 0, end: n - 1, level: 0 }] : []

  const snapshot = (description: string, phase: MaxMinStep["phase"]): void => {
    steps.push({
      segments: segments.map((s) => (s.comparingIndices ? { ...s, comparingIndices: [...s.comparingIndices] } : { ...s })),
      description,
      phase,
    })
  }
  const find = (start: number, end: number, level: number): number =>
    segments.findIndex((s) => s.start === start && s.end === end && s.level === level)
  const update = (start: number, end: number, level: number, patch: Partial<MaxMinSegment>): void => {
    const k = find(start, end, level)
    const next: MaxMinSegment = { ...segments[k], ...patch }
    // a cleared highlight is removed rather than kept as `undefined`
    if (next.comparingIndices === undefined) delete next.comparingIndices
    segments[k] = next
  }

  snapshot("We start with the full array and need to find the maximum and minimum values.", "divide")
  if (n === 0) return steps

  const solve = (start: number, end: number, level: number): { max: number; min: number } => {
    if (start === end) {
      update(start, end, level, { max: array[start], min: array[start], isResult: true })
      snapshot(`Base case: When we have a single element (${array[start]}), it is both the maximum and minimum.`, "compare")
      return { max: array[start], min: array[start] }
    }

    if (start === end - 1) {
      update(start, end, level, { isComparing: true, comparingIndices: [start, end] })
      snapshot(`Comparing two elements: ${array[start]} and ${array[end]}`, "compare")
      const max = Math.max(array[start], array[end])
      const min = Math.min(array[start], array[end])
      // fixed: the original left comparingIndices set, so both books stayed highlighted as "comparing" until the end
      update(start, end, level, { max, min, isComparing: false, isResult: true, comparingIndices: undefined })
      snapshot(`For these two elements, the maximum is ${max} and the minimum is ${min}.`, "result")
      return { max, min }
    }

    const mid = Math.floor((start + end) / 2)

    update(start, end, level, { isProcessing: true })
    snapshot(`Divide: Splitting the array from index ${start} to ${end} into two halves.`, "divide")

    // fixed: the original replaced the parent by its two halves, so the parent's row (e.g. "Original Array")
    // was empty for the whole recursion; the parent now stays in the tree above its children.
    update(start, end, level, { isProcessing: false })
    const at = find(start, end, level)
    segments.splice(at + 1, 0, { start, end: mid, level: level + 1 }, { start: mid + 1, end, level: level + 1 })
    snapshot(
      `The array is now split into two subarrays: from index ${start} to ${mid}, and from index ${mid + 1} to ${end}.`,
      "divide",
    )

    const left = solve(start, mid, level + 1)
    const right = solve(mid + 1, end, level + 1)

    update(start, mid, level + 1, { isComparing: true })
    update(mid + 1, end, level + 1, { isComparing: true })
    snapshot("Conquer: Comparing results from both halves to find the global maximum and minimum.", "conquer")

    const max = Math.max(left.max, right.max)
    const min = Math.min(left.min, right.min)
    update(start, mid, level + 1, { isComparing: false })
    update(mid + 1, end, level + 1, { isComparing: false })
    update(start, end, level, { max, min, isResult: true })
    snapshot(`For the subarray from index ${start} to ${end}, the maximum is ${max} and the minimum is ${min}.`, "result")
    return { max, min }
  }

  const { max, min } = solve(0, n - 1, 0)
  snapshot(`Final result: In the entire array, the maximum value is ${max} and the minimum value is ${min}.`, "result")
  return steps
}
