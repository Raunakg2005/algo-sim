// Legacy check for components/divide-conquer-maxmin.tsx (git HEAD).
// The useEffect body below is spliced verbatim from `git show HEAD:components/divide-conquer-maxmin.tsx` (lines 103-312);
// useEffect runs its callback immediately and setSteps captures the result.
import { allArrays, rng, Tally } from "../_util_batch5.ts"

type ArraySegment = {
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

type AlgorithmStep = {
  segments: ArraySegment[]
  description: string
  phase: "divide" | "conquer" | "compare" | "result"
}

function legacy(array: number[]): AlgorithmStep[] {
  let captured: AlgorithmStep[] = []
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const useEffect = (f: () => void, _deps: unknown[]) => f()
  useEffect(() => {
    const algorithmSteps: AlgorithmStep[] = []

    algorithmSteps.push({
      segments: [{ start: 0, end: array.length - 1, level: 0 }],
      description: "We start with the full array and need to find the maximum and minimum values.",
      phase: "divide",
    })

    const divideAndConquer = (start: number, end: number, level: number): { max: number; min: number } => {
      if (start === end) {
        const currentSegments = [...algorithmSteps[algorithmSteps.length - 1].segments]
        const segmentIndex = currentSegments.findIndex(
          (seg) => seg.start === start && seg.end === end && seg.level === level,
        )

        if (segmentIndex !== -1) {
          const updatedSegments = [...currentSegments]
          updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            max: array[start],
            min: array[start],
            isResult: true,
          }

          algorithmSteps.push({
            segments: updatedSegments,
            description: `Base case: When we have a single element (${array[start]}), it is both the maximum and minimum.`,
            phase: "compare",
          })
        }

        return { max: array[start], min: array[start] }
      }

      if (start === end - 1) {
        const currentSegments = [...algorithmSteps[algorithmSteps.length - 1].segments]
        const segmentIndex = currentSegments.findIndex(
          (seg) => seg.start === start && seg.end === end && seg.level === level,
        )

        if (segmentIndex !== -1) {
          const updatedSegments = [...currentSegments]
          updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            isComparing: true,
            comparingIndices: [start, end],
          }

          algorithmSteps.push({
            segments: updatedSegments,
            description: `Comparing two elements: ${array[start]} and ${array[end]}`,
            phase: "compare",
          })

          const max = Math.max(array[start], array[end])
          const min = Math.min(array[start], array[end])

          const resultSegments = [...updatedSegments]
          resultSegments[segmentIndex] = {
            ...resultSegments[segmentIndex],
            max,
            min,
            isComparing: false,
            isResult: true,
          }

          algorithmSteps.push({
            segments: resultSegments,
            description: `For these two elements, the maximum is ${max} and the minimum is ${min}.`,
            phase: "result",
          })
        }

        return {
          max: Math.max(array[start], array[end]),
          min: Math.min(array[start], array[end]),
        }
      }

      const mid = Math.floor((start + end) / 2)

      const currentSegments = [...algorithmSteps[algorithmSteps.length - 1].segments]
      const segmentIndex = currentSegments.findIndex(
        (seg) => seg.start === start && seg.end === end && seg.level === level,
      )

      if (segmentIndex !== -1) {
        const processingSegments = [...currentSegments]
        processingSegments[segmentIndex] = {
          ...processingSegments[segmentIndex],
          isProcessing: true,
        }

        algorithmSteps.push({
          segments: processingSegments,
          description: `Divide: Splitting the array from index ${start} to ${end} into two halves.`,
          phase: "divide",
        })

        const dividedSegments = [...processingSegments]
        dividedSegments.splice(
          segmentIndex,
          1,
          { start, end: mid, level: level + 1 },
          { start: mid + 1, end, level: level + 1 },
        )

        algorithmSteps.push({
          segments: dividedSegments,
          description: `The array is now split into two subarrays: from index ${start} to ${mid}, and from index ${mid + 1} to ${end}.`,
          phase: "divide",
        })
      }

      const left = divideAndConquer(start, mid, level + 1)
      const right = divideAndConquer(mid + 1, end, level + 1)

      const currentSegmentsAfterRecursion = [...algorithmSteps[algorithmSteps.length - 1].segments]

      const leftSegmentIndex = currentSegmentsAfterRecursion.findIndex(
        (seg) => seg.start === start && seg.end === mid && seg.level === level + 1 && seg.isResult,
      )

      const rightSegmentIndex = currentSegmentsAfterRecursion.findIndex(
        (seg) => seg.start === mid + 1 && seg.end === end && seg.level === level + 1 && seg.isResult,
      )

      if (leftSegmentIndex !== -1 && rightSegmentIndex !== -1) {
        const comparingSegments = [...currentSegmentsAfterRecursion]
        comparingSegments[leftSegmentIndex] = {
          ...comparingSegments[leftSegmentIndex],
          isComparing: true,
        }
        comparingSegments[rightSegmentIndex] = {
          ...comparingSegments[rightSegmentIndex],
          isComparing: true,
        }

        algorithmSteps.push({
          segments: comparingSegments,
          description: `Conquer: Comparing results from both halves to find the global maximum and minimum.`,
          phase: "conquer",
        })

        const max = Math.max(left.max, right.max)
        const min = Math.min(left.min, right.min)

        const parentSegmentIndex = comparingSegments.findIndex(
          (seg) => seg.start === start && seg.end === end && seg.level === level,
        )

        const resultSegments = [...comparingSegments]

        resultSegments[leftSegmentIndex] = {
          ...resultSegments[leftSegmentIndex],
          isComparing: false,
        }
        resultSegments[rightSegmentIndex] = {
          ...resultSegments[rightSegmentIndex],
          isComparing: false,
        }

        if (parentSegmentIndex !== -1) {
          resultSegments[parentSegmentIndex] = {
            ...resultSegments[parentSegmentIndex],
            max,
            min,
            isResult: true,
          }
        } else {
          resultSegments.push({
            start,
            end,
            level,
            max,
            min,
            isResult: true,
          })
        }

        algorithmSteps.push({
          segments: resultSegments,
          description: `For the subarray from index ${start} to ${end}, the maximum is ${max} and the minimum is ${min}.`,
          phase: "result",
        })
      }

      return { max: Math.max(left.max, right.max), min: Math.min(left.min, right.min) }
    }

    if (array.length > 0) {
      divideAndConquer(0, array.length - 1, 0)

      const finalSegments = [...algorithmSteps[algorithmSteps.length - 1].segments]
      const resultSegment = finalSegments.find(
        (seg) => seg.start === 0 && seg.end === array.length - 1 && seg.level === 0 && seg.isResult,
      )

      if (resultSegment) {
        algorithmSteps.push({
          segments: finalSegments,
          description: `Final result: In the entire array, the maximum value is ${resultSegment.max} and the minimum value is ${resultSegment.min}.`,
          phase: "result",
        })
      }
    }

    setSteps(algorithmSteps)
  }, [array])
  return captured
}

function check(input: number[]): string[] {
  const d: string[] = []
  let steps: AlgorithmStep[]
  try { steps = legacy(input) } catch (e) { return ["crash: " + (e as Error).message] }
  const n = input.length
  const last = steps[steps.length - 1]
  const root = last.segments.find((s) => s.start === 0 && s.end === n - 1 && s.level === 0)
  if (!root || root.max !== Math.max(...input) || root.min !== Math.min(...input)) d.push("final max/min wrong or missing")
  if (!last.description.startsWith("Final result")) d.push("no final-result frame")
  for (const s of steps) {
    for (const g of s.segments) {
      if (g.start < 0 || g.end >= n || g.start > g.end) d.push("segment out of range")
      if (g.isResult) {
        const part = input.slice(g.start, g.end + 1)
        if (g.max !== Math.max(...part) || g.min !== Math.min(...part)) d.push("segment result wrong")
      }
    }
    for (const g of s.segments) if (g.comparingIndices && !g.isComparing) { d.push("books stay highlighted as 'comparing' after their pair was resolved (stale comparingIndices)"); break }
    const maxLevel = Math.max(...s.segments.map((g) => g.level))
    for (let L = 0; L <= maxLevel; L++)
      if (!s.segments.some((g) => g.level === L)) { d.push(`a recursion level row (e.g. "Original Array") is empty in some frame`); break }
    for (const g of s.segments) if (g.level > 0 && !s.segments.some((p) => p.level === g.level - 1 && p.start <= g.start && g.end <= p.end)) { d.push("segment shown without its parent (parent vanished after the split)"); break }
  }
  return d
}

const ui = new Tally()
const def = [42, 15, 87, 33, 61, 9, 75, 24]
ui.record(def, check(def)); console.log("default example defects:", [...new Set(check(def))])
const r = rng(31337)
for (let t = 0; t < 20000; t++) { const len = Math.floor(r() * 5) + 6; const a = Array.from({ length: len }, () => Math.floor(r() * 90) + 10); ui.record(a, check(a)) }
ui.report("UI New Array button (6..10 values in 10..99), 20000 draws + default")

const ex = new Tally()
const vals = [-2, -1, 0, 1, 2]
for (let len = 1; len <= 7; len++) for (const a of allArrays(len, vals)) ex.record(a, check(a))
ex.report("exhaustive, lengths 1..7 over {-2..2} (duplicates, negatives, zero)")
const rr = new Tally()
const r2 = rng(5)
for (let t = 0; t < 20000; t++) { const len = 1 + Math.floor(r2() * 12); const a = Array.from({ length: len }, () => (r2() < 0.5 ? Math.floor(r2() * 21) - 10 : Math.round((r2() * 2000 - 1000) * 100) / 100)); rr.record(a, check(a)) }
rr.report("random, lengths 1..12, integers and decimals in [-1000,1000] (20000)")
