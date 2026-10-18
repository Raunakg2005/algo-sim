import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { DEFAULT_MAX_COLORING_STEPS, generateGraphColoringSteps, type ColoringStep } from "@/lib/engines/graph-coloring"
import { backtrackingAttempts, chromaticNumber, firstColoringBruteForce, isProper } from "../reference/graph-coloring"

type Case = { n: number; edges: [number, number][]; m: number }

// what the UI accepts: 2..10 vertices, 1..10 colours, any simple graph with at least one edge (either orientation)
const graphCase = (maxN: number, maxM: number): fc.Arbitrary<Case> =>
  fc.integer({ min: 2, max: maxN }).chain((n) => {
    const pairs: [number, number][] = []
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b])
    return fc.record({
      n: fc.constant(n),
      edges: fc
        .subarray(pairs, { minLength: 1 })
        .chain((es) => fc.tuple(...es.map((e) => fc.boolean().map((flip): [number, number] => (flip ? [e[1], e[0]] : e))))),
      m: fc.integer({ min: 1, max: maxM }),
    })
  })

const ids = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `node-${String.fromCharCode(65 + i)}`, label: String.fromCharCode(65 + i) }))
const run = ({ n, edges, m }: Case, maxSteps?: number) => {
  const nodes = ids(n)
  return generateGraphColoringSteps(nodes, edges.map(([a, b]) => ({ source: nodes[a].id, target: nodes[b].id })), m, maxSteps)
}
// an unbounded run makes at most 1 + (assignments + 1) + 3 * attempts + 1 frames, so a run that was cut off at
// `maxSteps` frames must have needed more than (maxSteps - 3) / 4 attempts
const mustBeHuge = (c: Case, maxSteps: number) =>
  backtrackingAttempts(c.n, c.edges, c.m, maxSteps).attempts > (maxSteps - 3) / 4
const asVector = (n: number, colors: { [k: string]: number | null }) => ids(n).map((v) => colors[v.id])

function frameErrors({ n, edges, m }: Case, steps: ColoringStep[]): string[] {
  const errs: string[] = []
  const nodes = ids(n)
  const index = new Map(nodes.map((v, i) => [v.id, i]))
  const adjacent = (a: number, b: number) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  steps.forEach((s, k) => {
    const vec = asVector(n, s.nodeColors)
    if (!isProper(vec, edges)) errs.push(`frame ${k}: improper partial colouring`)
    if (vec.some((c) => c !== null && (c < 0 || c >= m || !Number.isInteger(c)))) errs.push(`frame ${k}: colour out of range`)
    // coloured vertices always form a prefix of the vertex order
    const firstNull = vec.indexOf(null)
    if (firstNull >= 0 && vec.slice(firstNull).some((c) => c !== null)) errs.push(`frame ${k}: coloured vertices are not a prefix`)
    const cur = s.currentNodeId === null ? -1 : index.get(s.currentNodeId)!
    if (s.phase === "try" && (cur < 0 || vec[cur] !== null || vec.slice(0, cur).some((c) => c === null))) errs.push(`frame ${k}: try frame state`)
    if (s.phase === "conflict") {
      const c = index.get(s.conflictNodeId!)
      const tried = steps[k - 1].description.match(/^Trying (\w+)/)?.[1]
      if (c === undefined || !adjacent(cur, c) || vec[c] === null) errs.push(`frame ${k}: conflict vertex is not a coloured neighbour`)
      else if (!s.description.endsWith(`already has ${tried}`)) errs.push(`frame ${k}: conflict caption`)
    }
    if (s.phase === "assign" && (cur < 0 || vec[cur] === null)) errs.push(`frame ${k}: assign left vertex uncoloured`)
    if (s.phase === "backtrack" && (cur < 0 || vec[cur] !== null)) errs.push(`frame ${k}: backtrack left vertex coloured`)
  })
  return errs.slice(0, 5)
}

describe("graph colouring engine", { timeout: 30000 }, () => {
  it("reports a colouring exactly when the graph is m-colourable (chromatic number <= m), and it is proper", () => {
    fc.assert(fc.property(graphCase(10, 10), (c) => {
      const { steps, solutions, limitReached } = run(c)
      const chi = chromaticNumber(c.n, c.edges)
      const last = steps[steps.length - 1]
      expect(last.phase).toBe("complete")
      if (limitReached) {
        // only allowed when the real search is too big to animate; it must not claim anything about colourability
        expect(mustBeHuge(c, DEFAULT_MAX_COLORING_STEPS)).toBe(true)
        expect(solutions.length).toBe(0)
        expect(steps.length).toBeGreaterThanOrEqual(DEFAULT_MAX_COLORING_STEPS + 1)
        expect(steps.length).toBeLessThanOrEqual(DEFAULT_MAX_COLORING_STEPS + c.n + 3)
        expect(last.description.startsWith(`Search stopped after ${steps.length - 1} steps`)).toBe(true)
      } else if (chi <= c.m) {
        expect(solutions.length).toBe(1)
        const vec = asVector(c.n, solutions[0])
        expect(vec.every((x) => x !== null && x >= 0 && x < c.m)).toBe(true)
        expect(isProper(vec, c.edges)).toBe(true)
        const used = new Set(vec).size
        expect(used).toBeGreaterThanOrEqual(chi)
        expect(used).toBeLessThanOrEqual(c.m)
        expect(last.description).toBe(`Solution found! All nodes colored successfully using ${used} of the ${c.m} available color${c.m === 1 ? "" : "s"}.`)
        expect(asVector(c.n, last.nodeColors)).toEqual(vec)
      } else {
        expect(solutions.length).toBe(0)
        expect(last.description).toBe(`No solution found with ${c.m} colors. Try increasing the number of colors.`)
      }
    }), { numRuns: 3000 })
  })

  it("finds the lexicographically first proper colouring (brute force over all m^n vectors)", () => {
    fc.assert(fc.property(graphCase(7, 4), (c) => {
      const { solutions, limitReached } = run(c)
      expect(limitReached).toBe(false)
      const want = firstColoringBruteForce(c.n, c.edges, c.m)
      expect(solutions.length ? asVector(c.n, solutions[0]) : null).toEqual(want)
    }), { numRuns: 2000 })
  })

  it("every frame is a proper partial colouring, and conflict/assign/backtrack frames are consistent", () => {
    fc.assert(fc.property(graphCase(10, 10), (c) => {
      expect(frameErrors(c, run(c).steps)).toEqual([])
    }), { numRuns: 1500 })
  })

  it("makes the same number of colour attempts and assignments as textbook backtracking", () => {
    fc.assert(fc.property(graphCase(10, 10), (c) => {
      const { steps, limitReached } = run(c)
      fc.pre(!limitReached)
      const ref = backtrackingAttempts(c.n, c.edges, c.m)
      expect(steps.filter((s) => s.description.startsWith("Trying")).length).toBe(ref.attempts)
      expect(steps.filter((s) => s.phase === "assign").length).toBe(ref.assignments)
    }), { numRuns: 2000 })
  })

  it("cuts off huge searches with an honest caption and consistent frames (small budget)", () => {
    fc.assert(fc.property(graphCase(10, 10), fc.integer({ min: 20, max: 400 }), (c, budget) => {
      const { steps, solutions, limitReached } = run(c, budget)
      expect(frameErrors(c, steps)).toEqual([])
      // backtrack frames that unwind a finished branch are not cut, so the overshoot is at most n + 2 frames
      expect(steps.length).toBeLessThanOrEqual(budget + c.n + 3)
      if (limitReached) {
        expect(mustBeHuge(c, budget)).toBe(true)
        expect(solutions.length).toBe(0)
        expect(steps.length).toBeGreaterThanOrEqual(budget + 1)
        expect(steps[steps.length - 1].description).toBe(`Search stopped after ${steps.length - 1} steps without finding a coloring: the backtracking tree is too large to animate. Try fewer edges or more colors.`)
      } else {
        expect(solutions.length > 0).toBe(chromaticNumber(c.n, c.edges) <= c.m)
      }
    }), { numRuns: 1500 })
  })

  it("K10 with 9 colours (about 11 million frames unbounded) is cut off at the default budget", () => {
    const all: [number, number][] = []
    for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) all.push([a, b])
    const { steps, limitReached } = run({ n: 10, edges: all, m: 9 })
    expect(limitReached).toBe(true)
    expect(steps.length).toBeLessThanOrEqual(DEFAULT_MAX_COLORING_STEPS + 13)
    const k10m10 = run({ n: 10, edges: all, m: 10 })
    expect(k10m10.solutions.length).toBe(1)
  })

  it("rejects a colour count that is not a whole number in range", () => {
    for (const m of [2.5, -1, 11, Number.NaN]) expect(() => run({ n: 3, edges: [[0, 1]], m })).toThrow(RangeError)
  })
})
