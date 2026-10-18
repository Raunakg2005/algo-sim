import { backtrackingAttempts } from "file:///tests/reference/graph-coloring.ts"
for (let n = 4; n <= 10; n++) {
  const e: [number, number][] = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) e.push([a, b])
  const r = backtrackingAttempts(n, e, n - 1)
  // frames per attempt: 1 "Trying" + (1 conflict | 1 assign + 1 backtrack) ; plus 1 "Considering" per node visit
  console.log(`K${n}, m=${n - 1}: attempts=${r.attempts} assignments=${r.assignments} ~frames>=${r.attempts + r.assignments * 2}`)
}
let seed = 9; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
let worst = 0, over = 0
for (let k = 0; k < 20000; k++) { const n = 2 + Math.floor(rnd() * 9); const p = 0.1 + 0.8 * rnd(); const e: [number, number][] = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rnd() < p) e.push([a, b]); const m = 1 + Math.floor(rnd() * 10)
  const r = backtrackingAttempts(n, e, m); const f = r.attempts + 2 * r.assignments; worst = Math.max(worst, f); if (f > 20000) over++ }
console.log("random typed graphs: worst frames ~", worst, "runs over 20000 frames:", over, "/ 20000")
