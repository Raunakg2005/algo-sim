import { describe, expect, it } from "vitest"
import { generateNQueensSteps, summarizeNQueens, type QueensStep } from "@/lib/engines/n-queens"
import { KNOWN_COUNTS, allSolutionsBruteForce, attacks, backtrackingTrace, nonAttacking } from "../reference/n-queens"

// The UI fixes the board at 8x8; the engine is exercised exhaustively on every size 1..8.
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8]
const results = new Map(SIZES.map((n) => [n, generateNQueensSteps(n)]))

const key = (qs: { row: number; col: number }[]) =>
  [...qs].sort((a, b) => a.col - b.col).map((q) => q.row).join(",")

function frameErrors(n: number, steps: QueensStep[]): string[] {
  const errs: string[] = []
  steps.forEach((s, k) => {
    const qs = s.queensPositions
    if (!nonAttacking(qs)) errs.push(`frame ${k}: attacking queens`)
    if (qs.some((q) => q.row < 0 || q.row >= n || q.col < 0 || q.col >= n)) errs.push(`frame ${k}: queen off board`)
    if (s.phase !== "complete") {
      const cells = s.board.flatMap((row, r) => row.flatMap((v, c) => (v ? [`${r},${c}`] : []))).sort()
      const want = qs.map((q) => `${q.row},${q.col}`).sort()
      if (cells.join(";") !== want.join(";")) errs.push(`frame ${k}: board disagrees with queen list`)
      // column by column: the queens occupy exactly columns 0..q-1
      if (!qs.every((q, i) => q.col === i)) errs.push(`frame ${k}: queens not in columns 0..${qs.length - 1}`)
    }
    const cur = s.currentPosition
    if (s.phase === "conflict") {
      if (!cur || s.conflictPositions.length === 0) errs.push(`frame ${k}: conflict without squares`)
      else for (const c of s.conflictPositions) {
        if (!qs.some((q) => q.row === c.row && q.col === c.col)) errs.push(`frame ${k}: conflict square holds no queen`)
        if (!attacks(c, cur)) errs.push(`frame ${k}: conflict square does not attack`)
      }
    }
    if (s.phase === "place" && cur) {
      if (s.description.startsWith("Considering")) {
        if (cur.col !== qs.length) errs.push(`frame ${k}: considered square not in next column`)
      } else {
        const last = qs[qs.length - 1]
        if (!last || last.row !== cur.row || last.col !== cur.col) errs.push(`frame ${k}: placed queen missing`)
      }
    }
    if (s.phase === "backtrack" && cur) {
      if (qs.some((q) => q.row === cur.row && q.col === cur.col)) errs.push(`frame ${k}: backtracked queen still on board`)
      if (cur.col !== qs.length) errs.push(`frame ${k}: backtrack from wrong column`)
    }
    if (s.phase === "success" && qs.length !== n) errs.push(`frame ${k}: success with ${qs.length} queens`)
  })
  return errs.slice(0, 5)
}

describe("n-queens engine", () => {
  it("finds exactly the brute-force solution set for every board size 1..8 (92 for 8x8)", () => {
    for (const n of SIZES) {
      const { steps, solutions } = results.get(n)!
      const got = solutions.map(key).sort()
      expect(got).toEqual(allSolutionsBruteForce(n))
      expect(got.length).toBe(KNOWN_COUNTS[n - 1])
      expect(new Set(got).size).toBe(got.length)
      expect(steps[steps.length - 1].description).toBe(`Algorithm complete. Found ${KNOWN_COUNTS[n - 1]} solution(s).`)
      expect(steps.filter((s) => s.phase === "success").map((s) => key(s.queensPositions))).toEqual(solutions.map(key))
    }
  })

  it("every frame is non-attacking, consistent, and conflict frames point at a real attacker", () => {
    for (const n of SIZES) expect(frameErrors(n, results.get(n)!.steps)).toEqual([])
  })

  it("examines squares in exactly the textbook column-by-column order with the right verdicts", () => {
    for (const n of SIZES) {
      const { steps } = results.get(n)!
      const examined: { row: number; col: number; safe: boolean }[] = []
      steps.forEach((s, k) => {
        if (s.phase === "place" && s.description.startsWith("Considering")) {
          const next = steps[k + 1]
          examined.push({ row: s.currentPosition!.row, col: s.currentPosition!.col, safe: next.phase === "place" })
        }
      })
      expect(examined).toEqual(backtrackingTrace(n))
    }
  })

  it("search statistics for the 8x8 board (used in the paper)", () => {
    const st = summarizeNQueens(results.get(8)!)
    expect(st).toEqual({
      frames: 33590,
      squaresConsidered: 15720,
      conflicts: 13664,
      queensPlaced: 2056,
      backtracks: 2056,
      solutions: 92,
      treeNodes: 2057,
    })
    // every examined square is either a conflict or a placement
    expect(st.squaresConsidered).toBe(st.conflicts + st.queensPlaced)
  })
})
