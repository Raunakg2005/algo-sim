import { generateFifteenPuzzleSteps } from "file:///lib/engines/fifteen-puzzle.ts"
import { uiRandomPuzzle, legacy } from "./legacy.ts"
let seed = 2024; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
Math.random = rnd
const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]
const nbrs = (b: number[]) => { const z = b.indexOf(0), r = Math.floor(z / 4), c = z % 4, out: number[][] = []; for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const nr = r + dr, nc = c + dc; if (nr < 0 || nr > 3 || nc < 0 || nc > 3) continue; const nb = [...b]; nb[z] = nb[nr * 4 + nc]; nb[nr * 4 + nc] = 0; out.push(nb) } return out }
const to2d = (b: number[]) => [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4))
const scramble = (L: number) => { let b = [...GOAL], prev = ""; for (let i = 0; i < L; i++) { const ns = nbrs(b).filter((x) => x.join() !== prev); prev = b.join(); b = ns[Math.floor(rnd() * ns.length)] } return b }
const solved = (steps: any[]) => steps.at(-1).bestStateId !== null
let a = 0, l = 0, fa = 0, fl = 0
for (let k = 0; k < 300; k++) { const g = uiRandomPuzzle(); const e = generateFifteenPuzzleSteps(g); const o = legacy(g); if (solved(e)) a++; if (solved(o)) l++; fa += e.length; fl += o.length }
console.log(`UI random (100 moves) x300: engine solved ${a}, legacy solved ${l}; mean frames engine ${(fa / 300).toFixed(0)} legacy ${(fl / 300).toFixed(0)}`)
for (const L of [10, 15, 20, 25, 30, 40]) {
  let s = 0, frames = 0, maxF = 0
  for (let k = 0; k < 200; k++) { const st = generateFifteenPuzzleSteps(to2d(scramble(L))); if (solved(st)) s++; frames += st.length; maxF = Math.max(maxF, st.length) }
  console.log(`non-reversing scramble of ${L} moves: engine solved ${s}/200, mean frames ${(frames / 200).toFixed(0)}, max ${maxF}`)
}
