import { createComponent } from "./legacy.ts"
const c = createComponent()
c.act("handleMatrixInputChange", 0, 1, "1"); c.act("handleMatrixInputChange", 1, 2, "1"); c.act("handleMatrixInputChange", 2, 3, "1")
c.act("generateGraph"); c.act("startAlgorithm"); c.state.currentStep = c.state.steps.length - 1
c.act("handlePathSelection", "A", "D"); console.log("A->D:", c.state.pathNodes.join(" → "), "dist", c.state.steps.at(-1)!.distanceMatrix[0][3])
c.act("handlePathSelection", "B", "B"); console.log("B->B:", c.state.pathNodes.join(" → "))
const cmp = c.state.steps.find((s) => s.phase === "compare" && s.newDistance === 0)!; console.log("compare frame with newDistance 0:", cmp.description)
