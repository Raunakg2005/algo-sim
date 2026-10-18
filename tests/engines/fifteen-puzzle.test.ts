import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  DEFAULT_MAX_PUZZLE_STATES,
  GOAL_GRID,
  generateFifteenPuzzleSteps,
  isSolvable,
  type PuzzleStep,
} from "@/lib/engines/fifteen-puzzle"
import { GOAL, distancesFromGoal, manhattan, neighbours, solvableByPermutationParity } from "../reference/fifteen-puzzle"

const DEPTH = 14
const dist = distancesFromGoal(DEPTH) // 61,865 boards with their exact optimal move counts
const to2d = (b: number[]) => [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4))

// random walk of the blank from the goal (choices given by fast-check), never undoing the previous move
const walk = (choices: number[]) => {
  let b = [...GOAL]
  let prev = ""
  for (const c of choices) {
    const options = neighbours(b).filter((x) => x.join(",") !== prev)
    prev = b.join(",")
    b = options[c % options.length]
  }
  return b
}
const shortScramble = fc.array(fc.nat(11), { minLength: 0, maxLength: 40 }).map(walk).filter((b) => dist.has(b.join(",")))
// boards drawn uniformly from the BFS layers at optimal depth 11..14
const deepBoards = [...dist.entries()].filter(([, d]) => d >= 11).map(([k]) => k.split(",").map(Number))
const deepBoard = fc.integer({ min: 0, max: deepBoards.length - 1 }).map((i) => deepBoards[i])
const anyPermutation = fc.shuffledSubarray(GOAL, { minLength: 16, maxLength: 16 })
// the Random Puzzle button: 15 blank moves that never undo the previous one
const randomButton = fc.array(fc.nat(11), { minLength: 15, maxLength: 15 }).map(walk)

function checkRun(start: number[], steps: PuzzleStep[]): string[] {
  const errs: string[] = []
  const last = steps[steps.length - 1]
  const states = last.states
  // every generated state is one legal move from its parent, with correct g, h, f and caption data
  for (const [id, s] of states) {
    const flat = s.grid.flat()
    if (s.heuristic !== manhattan(flat) || s.totalCost !== s.cost + s.heuristic) errs.push(`state ${id}: h or f wrong`)
    if (s.grid[s.blankPos.row][s.blankPos.col] !== 0) errs.push(`state ${id}: blank position wrong`)
    if (s.parent === null) {
      if (id !== 1 || flat.join() !== start.join() || s.cost !== 0) errs.push(`state ${id}: bad root`)
      continue
    }
    const p = states.get(s.parent)
    if (!p) { errs.push(`state ${id}: parent missing`); continue }
    if (!neighbours(p.grid.flat()).some((nb) => nb.join() === flat.join())) errs.push(`state ${id}: not one move from parent`)
    if (s.cost !== p.cost + 1) errs.push(`state ${id}: cost is not parent + 1`)
    // the moved tile now sits where the parent's blank was; check the stated direction of travel
    const from = flat.indexOf(0)
    const to = p.grid.flat().indexOf(0)
    if (flat[to] !== s.movedTile) errs.push(`state ${id}: moved tile wrong`)
    const dr = Math.floor(to / 4) - Math.floor(from / 4)
    const dc = (to % 4) - (from % 4)
    const dir = dr === -1 ? "up" : dr === 1 ? "down" : dc === -1 ? "left" : "right"
    if (s.move !== dir) errs.push(`state ${id}: tile ${s.movedTile} moved ${dir} but caption says ${s.move}`)
  }
  let lastF = -Infinity
  const expanded = new Set<string>()
  steps.forEach((st, k) => {
    for (const id of st.activeStates) if (!st.states.has(id)) errs.push(`frame ${k}: queued state missing`)
    if (!st.states.has(st.currentStateId)) errs.push(`frame ${k}: current state missing`)
    if (st.description.startsWith("Select state")) {
      const cur = st.states.get(st.currentStateId)!
      // least-cost selection: nothing in the queue has a smaller f; with a consistent heuristic f never decreases
      for (const id of st.activeStates) if (st.states.get(id)!.totalCost < cur.totalCost) errs.push(`frame ${k}: not least cost`)
      if (cur.totalCost < lastF) errs.push(`frame ${k}: f decreased`)
      lastF = cur.totalCost
      const key = cur.grid.flat().join()
      if (expanded.has(key)) errs.push(`frame ${k}: board expanded twice`)
      expanded.add(key)
      if (st.activeStates.includes(st.currentStateId)) errs.push(`frame ${k}: selected state still queued`)
      if (st.prunedStates.includes(st.currentStateId)) errs.push(`frame ${k}: pruned state selected`)
    }
  })
  if (last.bestStateId !== null) {
    const best = states.get(last.bestStateId)!
    if (best.grid.flat().join() !== GOAL.join()) errs.push("best state is not the goal")
    const path = last.path
    if (path[0] !== 1 || path[path.length - 1] !== last.bestStateId || path.length !== best.cost + 1) errs.push("path endpoints/length")
    for (let i = 1; i < path.length; i++) if (states.get(path[i])!.parent !== path[i - 1]) errs.push("path is not a parent chain")
  }
  return errs.slice(0, 5)
}

describe("15-puzzle branch-and-bound engine", { timeout: 60000 }, () => {
  it("solves short scrambles in exactly the optimal number of moves (BFS oracle, depth <= 14)", () => {
    fc.assert(fc.property(fc.oneof(shortScramble, deepBoard), (b) => {
      const steps = generateFifteenPuzzleSteps(to2d(b))
      const last = steps[steps.length - 1]
      expect(last.bestStateId).not.toBeNull()
      expect(last.states.get(last.bestStateId!)!.cost).toBe(dist.get(b.join(",")))
      expect(last.description).toBe(`Solution found! Total moves: ${dist.get(b.join(","))}`)
      expect(checkRun(b, steps)).toEqual([])
    }), { numRuns: 1500 })
  })

  it("Random Puzzle button boards are solved, legally and consistently", () => {
    fc.assert(fc.property(randomButton, (b) => {
      const steps = generateFifteenPuzzleSteps(to2d(b))
      const last = steps[steps.length - 1]
      expect(last.bestStateId).not.toBeNull()
      const d = dist.get(b.join(","))
      if (d !== undefined) expect(last.states.get(last.bestStateId!)!.cost).toBe(d)
      expect(checkRun(b, steps)).toEqual([])
    }), { numRuns: 300 })
  })

  it("solvability check agrees with the permutation-parity oracle on all kinds of boards", () => {
    fc.assert(fc.property(fc.oneof(anyPermutation, shortScramble), (b) => {
      expect(isSolvable(to2d(b))).toBe(solvableByPermutationParity(b))
    }), { numRuns: 5000 })
  })

  it("arbitrary custom boards: unsolvable ones are rejected at once, solvable ones are solved or stop at the limit", () => {
    fc.assert(fc.property(anyPermutation, (b) => {
      const steps = generateFifteenPuzzleSteps(to2d(b))
      const last = steps[steps.length - 1]
      if (!solvableByPermutationParity(b)) {
        expect(steps.length).toBe(2)
        expect(last.phase).toBe("complete")
        expect(last.bestStateId).toBeNull()
        expect(last.description.startsWith("This board cannot be solved")).toBe(true)
      } else {
        if (last.bestStateId === null) {
          expect(last.description).toBe(`No solution found within the search limit (${DEFAULT_MAX_PUZZLE_STATES} states).`)
          expect(last.states.size).toBeGreaterThanOrEqual(DEFAULT_MAX_PUZZLE_STATES)
        } else {
          // any solution found is legal and at least as long as the Manhattan lower bound, with the same parity
          const cost = last.states.get(last.bestStateId)!.cost
          expect(cost).toBeGreaterThanOrEqual(manhattan(b))
          expect((cost - manhattan(b)) % 2).toBe(0)
        }
        expect(checkRun(b, steps)).toEqual([])
      }
    }), { numRuns: 40 })
  })

  it("the default (already solved) board needs 0 moves; one-move board names the tile direction correctly", () => {
    const solved = generateFifteenPuzzleSteps(GOAL_GRID)
    expect(solved.map((s) => s.description)).toEqual([
      "Initialize with initial state. Manhattan distance heuristic: 0",
      "Select state 1 with lowest total cost (0)",
      "Solution found! Total moves: 0",
    ])
    const one = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15]
    const steps = generateFifteenPuzzleSteps(to2d(one))
    expect(steps.some((s) => s.description.startsWith("Move tile 15 left."))).toBe(true)
    expect(checkRun(one, steps)).toEqual([])
  })

  it("is optimal on the board the original search solved in 14 moves instead of 12", () => {
    const b = [1, 2, 3, 4, 5, 6, 12, 0, 9, 10, 15, 7, 13, 14, 8, 11]
    expect(dist.get(b.join(","))).toBe(12)
    const steps = generateFifteenPuzzleSteps(to2d(b))
    const last = steps[steps.length - 1]
    expect(last.states.get(last.bestStateId!)!.cost).toBe(12)
  })

  it("rejects malformed boards", () => {
    expect(() => generateFifteenPuzzleSteps(to2d([1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]))).toThrow(RangeError)
    expect(() => generateFifteenPuzzleSteps(to2d([1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]))).toThrow(RangeError)
  })
})
