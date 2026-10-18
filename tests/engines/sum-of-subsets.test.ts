import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { generateSumOfSubsetsSteps, type SubsetStep } from "@/lib/engines/sum-of-subsets"
import { allSubsetSums, subsetReaches } from "../reference/sum-of-subsets"

// what the UI accepts: 1..10 integers (any sign) and an integer target
const anyInput = fc.tuple(fc.array(fc.integer({ min: -10, max: 20 }), { minLength: 1, maxLength: 10 }), fc.integer({ min: -30, max: 80 }))
const positiveInput = fc.tuple(fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 10 }), fc.integer({ min: 0, max: 100 }))
const shortInput = fc.tuple(fc.array(fc.integer({ min: -10, max: 20 }), { minLength: 1, maxLength: 7 }), fc.integer({ min: -30, max: 80 }))
const smallInput = fc.tuple(fc.array(fc.integer({ min: -3, max: 6 }), { minLength: 1, maxLength: 8 }), fc.integer({ min: -6, max: 15 }))
// the Random Input button: 4..7 numbers in 1..20, target = sum of a random non-empty subset
const randomButton = fc
  .array(fc.integer({ min: 1, max: 20 }), { minLength: 4, maxLength: 7 })
  .chain((a) => fc.tuple(fc.constant(a), fc.array(fc.boolean(), { minLength: a.length, maxLength: a.length })))
  .filter(([, pick]) => pick.some(Boolean))
  .map(([a, pick]): [number[], number] => [a, a.reduce((s, x, i) => s + (pick[i] ? x : 0), 0)])

// plain-JS frame checker (one expect per run keeps the test fast); returns a list of violations
function frameErrors(sorted: number[], t: number, steps: SubsetStep[]): string[] {
  const errs: string[] = []
  let prevKeys = 0
  let prevSolutions: number[][] = []
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i])
  steps.forEach((s, k) => {
    const tree = s.treeState
    const keys = Object.keys(tree)
    if (keys.length < prevKeys) errs.push(`frame ${k}: tree shrank`)
    prevKeys = keys.length
    if (!tree[s.currentNodeId]) errs.push(`frame ${k}: current node missing`)
    if (s.previousNodeId !== undefined && !tree[s.previousNodeId]) errs.push(`frame ${k}: previous node missing`)
    for (const node of Object.values(tree)) {
      if (node.sum !== sum(node.subset)) errs.push(`frame ${k}: ${node.id} sum`)
      for (const c of node.children) if (!tree[c] || tree[c].parentId !== node.id) errs.push(`frame ${k}: child ${c}`)
      if (node.parentId === null) continue
      const p = tree[node.parentId]
      if (!p || !p.children.includes(node.id)) { errs.push(`frame ${k}: parent link ${node.id}`); continue }
      if (node.level !== p.level + 1 || node.index !== p.level) errs.push(`frame ${k}: level/index ${node.id}`)
      if (!same(node.subset, node.include ? [...p.subset, sorted[node.index]] : p.subset)) errs.push(`frame ${k}: subset ${node.id}`)
    }
    for (let i = 0; i < prevSolutions.length; i++) if (!s.solutions[i] || !same(s.solutions[i], prevSolutions[i])) errs.push(`frame ${k}: solutions changed`)
    prevSolutions = s.solutions
    if (s.phase === "decision") {
      const parentId = s.previousNodeId ?? s.currentNodeId
      if (!tree[parentId] || tree[parentId].sum !== s.currentSum) errs.push(`frame ${k}: decision sum`)
      if (s.remainingTarget !== t - s.currentSum) errs.push(`frame ${k}: remaining target`)
    }
  })
  return errs.slice(0, 5)
}

const finalSolutions = (nums: number[], t: number) => {
  const { steps } = generateSumOfSubsetsSteps(nums, t)
  return steps[steps.length - 1].solutions.map((s) => s.join(",")).sort()
}

describe("sum of subsets engine", { timeout: 30000 }, () => {
  it("finds exactly the subsets the brute-force oracle finds (any integers)", () => {
    fc.assert(fc.property(fc.oneof(anyInput, positiveInput, smallInput), ([nums, t]) => {
      const sorted = [...nums].sort((a, b) => a - b)
      expect(finalSolutions(nums, t)).toEqual(allSubsetSums(sorted, t))
    }), { numRuns: 3000 })
  })

  it("Random Input button always yields at least one solution, and all of them", () => {
    fc.assert(fc.property(randomButton, ([nums, t]) => {
      const sorted = [...nums].sort((a, b) => a - b)
      const got = finalSolutions(nums, t)
      expect(got.length).toBeGreaterThan(0)
      expect(got).toEqual(allSubsetSums(sorted, t))
    }), { numRuns: 2000 })
  })

  it("never prunes a branch that could still reach the target; every leaf verdict is right", () => {
    fc.assert(fc.property(fc.oneof(anyInput, smallInput), ([nums, t]) => {
      const { sorted, steps } = generateSumOfSubsetsSteps(nums, t)
      for (const s of steps) {
        const i = s.currentIndex
        if (s.description.startsWith("Cannot include")) {
          expect(subsetReaches(sorted.slice(i + 1), t - s.currentSum - sorted[i])).toBe(false)
        } else if (s.description.startsWith("Cannot exclude")) {
          expect(subsetReaches(sorted.slice(i + 1), t - s.currentSum)).toBe(false)
        } else if (s.phase === "success") {
          expect(s.currentSubset.reduce((a, b) => a + b, 0)).toBe(t)
          expect(s.treeState[s.currentNodeId].isSuccess).toBe(true)
        } else if (s.description.startsWith("Not a solution")) {
          expect(s.currentSum).not.toBe(t)
          expect(s.treeState[s.currentNodeId].isFailure).toBe(true)
        }
      }
    }), { numRuns: 2000 })
  })

  it("every frame is a consistent, growing snapshot of the state-space tree", () => {
    fc.assert(fc.property(fc.oneof(shortInput, smallInput), ([nums, t]) => {
      const { sorted, steps } = generateSumOfSubsetsSteps(nums, t)
      expect(sorted).toEqual([...nums].sort((a, b) => a - b))
      expect(Object.keys(steps[0].treeState)).toEqual(["root"])
      expect(frameErrors(sorted, t, steps)).toEqual([])
      const successFrames = steps.filter((s) => s.phase === "success").length
      expect(successFrames).toBe(steps[steps.length - 1].solutions.length)
    }), { numRuns: 1000 })
  })

  it("solves the default example (2, 4, 6, 8, 10; target 16)", () => {
    expect(finalSolutions([2, 4, 6, 8, 10], 16)).toEqual(["2,4,10", "2,6,8", "6,10"])
  })

  it("finds the solution the original code missed: [1, 2], target 1", () => {
    expect(finalSolutions([1, 2], 1)).toEqual(["1"])
  })
})
