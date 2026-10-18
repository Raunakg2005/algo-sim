import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { branchingOrder, generateKnapsackSteps, type KnapsackItem, type KnapsackStep } from "@/lib/engines/knapsack-bnb"
import { bruteForceKnapsack, suffixKnapsackTable } from "../reference/knapsack-bnb"

type Case = { items: KnapsackItem[]; capacity: number }
// items as the UI builds them: positive integers, ratio rounded to 2 decimals, ids 1..n
const mk = (wv: [number, number][]): KnapsackItem[] =>
  wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))
const caseOf = (n: [number, number], w: number, v: number, cap: number): fc.Arbitrary<Case> =>
  fc.record({
    items: fc.array(fc.tuple(fc.integer({ min: 1, max: w }), fc.integer({ min: 1, max: v })), { minLength: n[0], maxLength: n[1] }).map(mk),
    capacity: fc.integer({ min: 1, max: cap }),
  })
// the Random Items button: 3..5 items, weight 1..5, value 5..14, capacity 5..14
const randomButton: fc.Arbitrary<Case> = fc.record({
  items: fc.array(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 5, max: 14 })), { minLength: 3, maxLength: 5 }).map(mk),
  capacity: fc.integer({ min: 5, max: 14 }),
})
// values close to a common ratio, so that the UI's 2-decimal rounded ratios tie
const nearTies: fc.Arbitrary<Case> = fc
  .tuple(fc.double({ min: 0.2, max: 3, noNaN: true }), fc.array(fc.tuple(fc.integer({ min: 20, max: 400 }), fc.integer({ min: -4, max: 4 })), { minLength: 2, maxLength: 8 }), fc.integer({ min: 1, max: 1500 }))
  .map(([r, ws, capacity]) => ({ items: mk(ws.map(([w, d]) => [w, Math.max(1, Math.round(w * r * (1 + d / 1000)))] as [number, number])), capacity }))
const anyCase = fc.oneof(randomButton, caseOf([1, 10], 30, 40, 60), caseOf([1, 8], 1000, 1000, 2000), nearTies)

function checkRun({ items, capacity }: Case, steps: KnapsackStep[]): string[] {
  const errs: string[] = []
  const order = branchingOrder(items)
  const suffix = suffixKnapsackTable(order, capacity)
  const last = steps[steps.length - 1]
  const finalNodes = new Map(last.nodes.map((nd) => [nd.id, nd]))
  const subtreeBest = (id: number) => {
    const nd = finalNodes.get(id)!
    return nd.value + suffix[nd.level][capacity - nd.weight]
  }
  const byId = new Map(items.map((it) => [it.id, it]))

  // static checks on every node ever created
  for (const nd of last.nodes) {
    if (nd.weight > capacity) errs.push(`node ${nd.id} over capacity`)
    if (nd.bound < subtreeBest(nd.id)) errs.push(`node ${nd.id}: bound ${nd.bound} < subtree optimum ${subtreeBest(nd.id)}`)
    const w = nd.items.reduce((s, id) => s + byId.get(id)!.weight, 0)
    const v = nd.items.reduce((s, id) => s + byId.get(id)!.value, 0)
    if (w !== nd.weight || v !== nd.value) errs.push(`node ${nd.id}: weight/value do not match its items`)
    if (nd.parent !== null) {
      const p = finalNodes.get(nd.parent)!
      const decided = order[p.level].id
      const want = nd.include ? [...p.items, decided] : p.items
      if (nd.level !== p.level + 1 || want.join() !== nd.items.join()) errs.push(`node ${nd.id}: not a child of ${p.id}`)
    }
  }

  const prunedAt = new Map<number, number>()
  let prevBest = 0
  steps.forEach((s, k) => {
    const nodes = new Map(s.nodes.map((nd) => [nd.id, nd]))
    if (!nodes.has(s.currentNode)) errs.push(`frame ${k}: current node missing`)
    if (s.bestValue < prevBest) errs.push(`frame ${k}: best value decreased`)
    prevBest = s.bestValue
    if (s.bestNode !== null) {
      const b = nodes.get(s.bestNode)
      if (!b || b.value !== s.bestValue || b.level !== order.length) errs.push(`frame ${k}: best node is not a complete solution worth bestValue`)
      else if (b.pruned) errs.push(`frame ${k}: best node drawn as pruned`)
    } else if (s.bestValue !== 0) errs.push(`frame ${k}: best value without best node`)
    if (s.phase === "prune") {
      const id = Number(s.description.match(/Prune node (\d+)/)![1])
      if (id !== s.currentNode) errs.push(`frame ${k}: prune caption names another node`)
      if (!prunedAt.has(id)) prunedAt.set(id, k)
      // a pruned node really cannot beat the incumbent
      if (subtreeBest(id) > s.bestValue) errs.push(`frame ${k}: pruned node ${id} could reach ${subtreeBest(id)} > ${s.bestValue}`)
    }
    // pruned flags appear exactly from the frame that prunes the node
    for (const nd of s.nodes) {
      const at = prunedAt.get(nd.id)
      if (nd.pruned !== (at !== undefined && at <= k)) errs.push(`frame ${k}: node ${nd.id} pruned flag out of step`)
    }
    for (const id of s.activeNodes) {
      const nd = nodes.get(id)
      if (!nd || nd.pruned) errs.push(`frame ${k}: queued node ${id} missing or pruned`)
    }
    if (s.description.startsWith("Select node")) {
      const cur = nodes.get(s.currentNode)!
      for (const id of s.activeNodes) if (nodes.get(id)!.bound > cur.bound) errs.push(`frame ${k}: selected node is not the highest bound`)
    }
  })
  return errs.slice(0, 5)
}

describe("0/1 knapsack branch-and-bound engine", () => {
  it("finds the brute-force optimum, with a feasible best set and a correct final caption", () => {
    fc.assert(fc.property(anyCase, (c) => {
      const steps = generateKnapsackSteps(c.items, c.capacity)
      const opt = bruteForceKnapsack(c.items, c.capacity)
      const last = steps[steps.length - 1]
      expect(last.phase).toBe("complete")
      expect(last.bestValue).toBe(opt)
      if (opt === 0) {
        expect(last.bestNode).toBeNull()
        expect(c.items.every((it) => it.weight > c.capacity)).toBe(true)
        expect(last.description).toBe("Algorithm complete. No item fits in the knapsack, so the best value is 0 (empty knapsack).")
      } else {
        const best = last.nodes.find((nd) => nd.id === last.bestNode)!
        const chosen = best.items.map((id) => c.items.find((it) => it.id === id)!)
        expect(chosen.reduce((s, it) => s + it.value, 0)).toBe(opt)
        expect(chosen.reduce((s, it) => s + it.weight, 0)).toBeLessThanOrEqual(c.capacity)
        expect(last.description).toBe(`Algorithm complete. Best solution: Value = ${opt}, Weight = ${best.weight}, Items = [${best.items.join(", ")}]`)
      }
    }), { numRuns: 4000 })
  })

  it("every bound is a valid upper bound, pruned nodes cannot beat the incumbent, frames are consistent", () => {
    fc.assert(fc.property(anyCase, (c) => {
      expect(checkRun(c, generateKnapsackSteps(c.items, c.capacity))).toEqual([])
    }), { numRuns: 2000 })
  })

  it("solves the default example (capacity 10) with value 55", () => {
    const items = [
      { id: 1, weight: 2, value: 10, ratio: 5 },
      { id: 2, weight: 3, value: 15, ratio: 5 },
      { id: 3, weight: 5, value: 30, ratio: 6 },
      { id: 4, weight: 7, value: 35, ratio: 5 },
      { id: 5, weight: 1, value: 3, ratio: 3 },
    ]
    const steps = generateKnapsackSteps(items, 10)
    expect(steps[steps.length - 1].bestValue).toBe(55)
    expect(checkRun({ items, capacity: 10 }, steps)).toEqual([])
  })

  it("does not trust the rounded ratio: items (8, 3) and (13, 5) both show 0.38, root bound must be >= 5", () => {
    const items = mk([[8, 3], [13, 5]])
    const steps = generateKnapsackSteps(items, 13)
    expect(steps[0].nodes[0].bound).toBeGreaterThanOrEqual(5)
    expect(steps[steps.length - 1].bestValue).toBe(5)
  })
})
