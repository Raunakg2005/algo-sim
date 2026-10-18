import { legacySteps } from "./legacy.ts"
console.log(String(legacySteps([[Infinity, 1], [1, 1]], [[1, 1], [1, 1]]).at(-1)!.resultMatrix!.map((r) => "[" + r.join(",") + "]")))
