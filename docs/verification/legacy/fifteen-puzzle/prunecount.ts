import { generateFifteenPuzzleSteps } from "file:///lib/engines/fifteen-puzzle.ts"
import { distancesFromGoal } from "file:///tests/reference/fifteen-puzzle.ts"
const dist = distancesFromGoal(14)
const deep = [...dist.entries()].filter(([, d]) => d >= 12)
let runs = 0, withPrune = 0, prunes = 0, wrong = 0
for (let i = 0; i < deep.length; i += 97) {
  const b = deep[i][0].split(",").map(Number); const g = [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4))
  const st = generateFifteenPuzzleSteps(g); runs++
  const p = st.filter((s) => s.phase === "prune").length; prunes += p; if (p) withPrune++
  const last = st.at(-1)!; if (last.bestStateId === null || last.states.get(last.bestStateId)!.cost !== deep[i][1]) wrong++
}
console.log(`deep boards (opt 12-14) sampled ${runs}: runs with a superseded-entry prune ${withPrune}, total prunes ${prunes}, wrong/unsolved ${wrong}`)
