// Legacy check for components/stack-operations-visualizer.tsx (git HEAD).
// The handlers below are copied verbatim from original.tsx; useState setters are replaced by plain variables
// (each UI click is a separate render, so sequential plain-variable updates are faithful).
import { rng, int, pick, lineOk, Tally } from "../_dsq_util.ts"

interface StackStep { stack: number[]; operation: string; element?: number; description: string; isError: boolean; activeCodeLine: number }

const stackCode = [
  "class Stack {", "  constructor() {", "    this.items = [];", "    this.top = -1;", "  }", "",
  "  push(element) {", "    this.top++;", "    this.items[this.top] = element;", "  }", "",
  "  pop() {", "    if (this.isEmpty()) return null;", "    const element = this.items[this.top];", "    this.top--;", "    return element;", "  }", "",
  "  peek() {", "    if (this.isEmpty()) return null;", "    return this.items[this.top];", "  }", "",
  "  isEmpty() {", "    return this.top === -1;", "  }", "}",
]

export function makeLegacy() {
  let stack: number[] = []
  let inputValue = ""
  let inputError = ""
  let steps: StackStep[] = []
  let currentStepIndex = 0
  const maxSize = 10
  const setStack = (s: number[]) => { stack = s }
  const setInputValue = (v: string) => { inputValue = v }
  const setInputError = (v: string) => { inputError = v }
  const setSteps = (f: StackStep[] | ((p: StackStep[]) => StackStep[])) => { steps = typeof f === "function" ? f(steps) : f }
  const setCurrentStepIndex = (i: number) => { currentStepIndex = i }
  const setIsPlaying = (_: boolean) => {}

  const addStep = (newStack: number[], operation: string, element: number | undefined, description: string, isError = false, activeCodeLine = 0) => {
    const newStep: StackStep = { stack: [...newStack], operation, element, description, isError, activeCodeLine }
    setSteps((prev) => [...prev, newStep])
  }
  const validateInput = (value: string): number | null => {
    const trimmed = value.trim()
    if (!trimmed) { setInputError("Please enter a number"); return null }
    const num = Number.parseInt(trimmed, 10)
    if (isNaN(num)) { setInputError("Please enter a valid number"); return null }
    setInputError("")
    return num
  }
  const pushElement = () => {
    const element = validateInput(inputValue)
    if (element === null) return
    if (stack.length >= maxSize) {
      addStep(stack, "push", element, `Cannot push ${element}. Stack is full (max size: ${maxSize})`, true, 7)
      setInputValue("")
      return
    }
    const newStack = [...stack, element]
    setStack(newStack)
    addStep(newStack, "push", element, `Pushed ${element} onto the stack. Stack size: ${newStack.length}`, false, 7)
    setInputValue("")
  }
  const popElement = () => {
    if (stack.length === 0) { addStep(stack, "pop", undefined, "Cannot pop from empty stack", true, 12); return }
    const poppedElement = stack[stack.length - 1]
    const newStack = stack.slice(0, -1)
    setStack(newStack)
    addStep(newStack, "pop", poppedElement, `Popped ${poppedElement} from the stack. Stack size: ${newStack.length}`, false, 12)
  }
  const peekElement = () => {
    if (stack.length === 0) { addStep(stack, "peek", undefined, "Cannot peek empty stack", true, 19); return }
    const topElement = stack[stack.length - 1]
    addStep(stack, "peek", topElement, `Top element is ${topElement}. Stack size: ${stack.length}`, false, 19)
  }
  const clearStack = () => { setStack([]); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false); setInputError("") }
  // what renderStackVisualization shows
  const display = () => (steps.length > 0 ? (steps[currentStepIndex] ?? { stack: [] }).stack : stack)
  return {
    type: (v: string) => setInputValue(v), pushElement, popElement, peekElement, clearStack, display,
    get stack() { return stack }, get steps() { return steps }, get inputError() { return inputError },
  }
}

type Op = { k: "push"; v: number } | { k: "pop" } | { k: "peek" } | { k: "clear" }
const show = (ops: Op[]) => ops.map((o) => (o.k === "push" ? `push(${o.v})` : o.k)).join(", ")

function check(ops: Op[]): Set<string> {
  const bad = new Set<string>()
  const ui = makeLegacy()
  let model: number[] = []
  for (const op of ops) {
    const before = ui.steps.length
    if (op.k === "push") { ui.type(String(op.v)); ui.pushElement() }
    else if (op.k === "pop") ui.popElement()
    else if (op.k === "peek") ui.peekElement()
    else ui.clearStack()
    const frames = ui.steps.slice(before)
    let errExpected = false
    if (op.k === "push") { if (model.length >= 10) errExpected = true; else model = [...model, op.v] }
    else if (op.k === "pop") { if (model.length === 0) errExpected = true; else model = model.slice(0, -1) }
    else if (op.k === "peek") { if (model.length === 0) errExpected = true }
    else model = []
    if (JSON.stringify(ui.stack) !== JSON.stringify(model)) bad.add("contents differ from array model")
    if (op.k !== "clear") {
      const f = frames[frames.length - 1]
      if (!f || f.isError !== errExpected) bad.add("error flag wrong")
      if (f && JSON.stringify(f.stack) !== JSON.stringify(model)) bad.add("last frame differs from state")
      const method = op.k
      const expect = errExpected
        ? (op.k === "push" ? "isFull()" : "isEmpty()")
        : op.k === "push" ? ["this.top++", "this.items[this.top] = element"]
        : op.k === "pop" ? ["const element = this.items[this.top]", "this.top--", "return element"]
        : "return this.items[this.top]"
      if (f && !lineOk(stackCode, f.activeCodeLine, method, expect))
        bad.add(`highlighted code line wrong (${op.k}${errExpected ? " error" : ""}: shows "${stackCode[f.activeCodeLine]?.trim()}")`)
    }
    if (JSON.stringify(ui.display()) !== JSON.stringify(model)) bad.add("visualization shows a stale frame, not the state after the operation")
  }
  return bad
}

function main(): void {
const r = rng(12345)
const tally = new Tally()
const N = 20000
for (let t = 0; t < N; t++) {
  const len = int(r, 1, 30)
  const ops: Op[] = []
  // bias toward pushes so the 10-element limit is reached often
  for (let i = 0; i < len; i++) {
    const x = r()
    ops.push(x < 0.55 ? { k: "push", v: int(r, -20, 20) } : x < 0.8 ? { k: "pop" } : x < 0.97 ? { k: "peek" } : { k: "clear" })
  }
  for (const d of check(ops)) tally.add(d, show(ops))
}
console.log(`stack: ${N} random operation sequences (length 1-30, values -20..20, capacity 10)`)
tally.print(N, "sequences")

// input validation: strings the text box accepts and what gets pushed
console.log("input parsing (validateInput = parseInt):")
for (const s of ["3.7", "1e3", "12abc", "0x1A", "99999999999999999999", "-0", " 42 "]) {
  const ui = makeLegacy(); ui.type(s); ui.pushElement()
  console.log(`  "${s}" -> ${ui.stack.length ? `pushed ${ui.stack[0]}` : `rejected (${ui.inputError})`}`)
}
void pick

}
if (process.argv[1]?.split("\\").join("/").endsWith("/legacy.ts")) main()
