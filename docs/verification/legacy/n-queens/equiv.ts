import { legacy } from "./legacy.ts"
import { generateNQueensSteps } from "file:///lib/engines/n-queens.ts"
for (let n = 1; n <= 8; n++) { const a = legacy(n), b = generateNQueensSteps(n); console.log(n, JSON.stringify(a.steps) === JSON.stringify(b.steps) && JSON.stringify(a.solutions) === JSON.stringify(b.solutions) ? "identical" : "DIFFERENT") }
