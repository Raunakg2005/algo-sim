import { generateNQueensSteps, summarizeNQueens } from "file:///lib/engines/n-queens.ts"
for (let n = 4; n <= 8; n++) {
  const r = generateNQueensSteps(n)
  const first = r.steps.findIndex((s) => s.phase === "success")
  const upto = { steps: r.steps.slice(0, first + 1), solutions: r.solutions.slice(0, 1) }
  const s1 = summarizeNQueens(upto)
  console.log(`n=${n}:`, JSON.stringify(summarizeNQueens(r)), `| up to first solution: frame ${first + 1}, squares ${s1.squaresConsidered}, placements ${s1.queensPlaced}, backtracks ${s1.backtracks}, first solution rows by column ${r.solutions[0].map((q) => q.row + 1).join(",")}`)
}
