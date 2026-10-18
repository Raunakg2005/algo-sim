// Legacy check for components/double-ended-queue-visualizer.tsx (git HEAD).
// Handlers copied verbatim from original.tsx; useState setters replaced by plain variables.
import { rng, int, lineOk, Tally } from "../_dsq_util.ts"

interface DequeStep { deque: (number | undefined)[]; front: number; rear: number; operation: string; element?: number; description: string; isError: boolean; activeCodeLine: number }

const dequeCode = [
  "class DoubleEndedQueue {", "  constructor(size) {", "    this.items = new Array(size);", "    this.front = -1;", "    this.rear = -1;", "    this.maxSize = size;", "    this.count = 0;", "  }", "",
  "  addFront(element) {", "    if (this.isFull()) return false;", "    if (this.isEmpty()) {", "      this.front = this.rear = 0;", "    } else {", "      this.front = (this.front - 1 + this.maxSize) % this.maxSize;", "    }", "    this.items[this.front] = element;", "    this.count++;", "    return true;", "  }", "",
  "  addRear(element) {", "    if (this.isFull()) return false;", "    if (this.isEmpty()) {", "      this.front = this.rear = 0;", "    } else {", "      this.rear = (this.rear + 1) % this.maxSize;", "    }", "    this.items[this.rear] = element;", "    this.count++;", "    return true;", "  }", "",
  "  removeFront() {", "    if (this.isEmpty()) return null;", "    const element = this.items[this.front];", "    this.items[this.front] = undefined;", "    this.count--;", "    if (this.isEmpty()) {", "      this.front = this.rear = -1;", "    } else {", "      this.front = (this.front + 1) % this.maxSize;", "    }", "    return element;", "  }", "",
  "  removeRear() {", "    if (this.isEmpty()) return null;", "    const element = this.items[this.rear];", "    this.items[this.rear] = undefined;", "    this.count--;", "    if (this.isEmpty()) {", "      this.front = this.rear = -1;", "    } else {", "      this.rear = (this.rear - 1 + this.maxSize) % this.maxSize;", "    }", "    return element;", "  }", "",
  "  peekFront() {", "    if (this.isEmpty()) return null;", "    return this.items[this.front];", "  }", "",
  "  peekRear() {", "    if (this.isEmpty()) return null;", "    return this.items[this.rear];", "  }", "",
  "  isEmpty() {", "    return this.count === 0;", "  }", "",
  "  isFull() {", "    return this.count === this.maxSize;", "  }", "}",
]

export function makeLegacy(size: number) {
  let dequeSize = 8
  let sizeInput = "8"
  let deque: (number | undefined)[] = new Array(8).fill(undefined)
  let front = -1
  let rear = -1
  let count = 0
  let inputValue = ""
  let inputError = ""
  let steps: DequeStep[] = []
  let currentStepIndex = 0
  const setSizeError = (_: string) => {}
  const setDequeSize = (v: number) => { dequeSize = v }
  const setDeque = (v: (number | undefined)[]) => { deque = v }
  const setFront = (v: number) => { front = v }
  const setRear = (v: number) => { rear = v }
  const setCount = (v: number) => { count = v }
  const setInputValue = (v: string) => { inputValue = v }
  const setInputError = (v: string) => { inputError = v }
  const setSteps = (f: DequeStep[] | ((p: DequeStep[]) => DequeStep[])) => { steps = typeof f === "function" ? f(steps) : f }
  const setCurrentStepIndex = (i: number) => { currentStepIndex = i }
  const setIsPlaying = (_: boolean) => {}

  const addStep = (newDeque: (number | undefined)[], newFront: number, newRear: number, newCount: number, operation: string, element: number | undefined, description: string, isError = false, activeCodeLine = 0) => {
    void newCount
    const newStep: DequeStep = { deque: [...newDeque], front: newFront, rear: newRear, operation, element, description, isError, activeCodeLine }
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
  const updateDequeSize = () => {
    const size = Number.parseInt(sizeInput.trim())
    if (isNaN(size) || size < 2 || size > 12) { setSizeError("Deque size must be between 2 and 12"); return }
    setSizeError(""); setDequeSize(size); setDeque(new Array(size).fill(undefined)); setFront(-1); setRear(-1); setCount(0); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false)
  }
  const addFront = () => {
    const element = validateInput(inputValue)
    if (element === null) return
    if (count === dequeSize) { addStep(deque, front, rear, count, "addFront", element, `Cannot add ${element} to front. Deque is full!`, true, 9); setInputValue(""); return }
    const newDeque = [...deque]
    let newFront = front
    let newRear = rear
    let newCount = count
    if (count === 0) {
      newFront = 0; newRear = 0
      addStep(newDeque, newFront, newRear, newCount, "addFront", element, `Deque is empty. Setting front and rear to 0.`, false, 11)
    } else {
      newFront = (front - 1 + dequeSize) % dequeSize
      addStep(newDeque, newFront, newRear, newCount, "addFront", element, `Moving front circularly: (${front} - 1 + ${dequeSize}) % ${dequeSize} = ${newFront}`, false, 14)
    }
    newDeque[newFront] = element
    newCount++
    setDeque(newDeque); setFront(newFront); setRear(newRear); setCount(newCount)
    addStep(newDeque, newFront, newRear, newCount, "addFront", element, `Added ${element} to front at position ${newFront}. Deque size: ${newCount}/${dequeSize}`, false, 16)
    setInputValue("")
  }
  const addRear = () => {
    const element = validateInput(inputValue)
    if (element === null) return
    if (count === dequeSize) { addStep(deque, front, rear, count, "addRear", element, `Cannot add ${element} to rear. Deque is full!`, true, 21); setInputValue(""); return }
    const newDeque = [...deque]
    let newFront = front
    let newRear = rear
    let newCount = count
    if (count === 0) {
      newFront = 0; newRear = 0
      addStep(newDeque, newFront, newRear, newCount, "addRear", element, `Deque is empty. Setting front and rear to 0.`, false, 23)
    } else {
      newRear = (rear + 1) % dequeSize
      addStep(newDeque, newFront, newRear, newCount, "addRear", element, `Moving rear circularly: (${rear} + 1) % ${dequeSize} = ${newRear}`, false, 26)
    }
    newDeque[newRear] = element
    newCount++
    setDeque(newDeque); setFront(newFront); setRear(newRear); setCount(newCount)
    addStep(newDeque, newFront, newRear, newCount, "addRear", element, `Added ${element} to rear at position ${newRear}. Deque size: ${newCount}/${dequeSize}`, false, 28)
    setInputValue("")
  }
  const removeFront = () => {
    if (count === 0) { addStep(deque, front, rear, count, "removeFront", undefined, "Cannot remove from empty deque", true, 33); return }
    const removedElement = deque[front]
    const newDeque = [...deque]
    newDeque[front] = undefined
    let newFront = front
    let newRear = rear
    const newCount = count - 1
    if (newCount === 0) {
      newFront = -1; newRear = -1
      addStep(newDeque, newFront, newRear, newCount, "removeFront", removedElement, `Removed ${removedElement} from front. Deque is now empty.`, false, 37)
    } else {
      newFront = (front + 1) % dequeSize
      addStep(newDeque, newFront, newRear, newCount, "removeFront", removedElement, `Removed ${removedElement} from front. Moving front circularly: (${front} + 1) % ${dequeSize} = ${newFront}. Deque size: ${newCount}/${dequeSize}`, false, 40)
    }
    setDeque(newDeque); setFront(newFront); setRear(newRear); setCount(newCount)
  }
  const removeRear = () => {
    if (count === 0) { addStep(deque, front, rear, count, "removeRear", undefined, "Cannot remove from empty deque", true, 45); return }
    const removedElement = deque[rear]
    const newDeque = [...deque]
    newDeque[rear] = undefined
    let newFront = front
    let newRear = rear
    const newCount = count - 1
    if (newCount === 0) {
      newFront = -1; newRear = -1
      addStep(newDeque, newFront, newRear, newCount, "removeRear", removedElement, `Removed ${removedElement} from rear. Deque is now empty.`, false, 49)
    } else {
      newRear = (rear - 1 + dequeSize) % dequeSize
      addStep(newDeque, newFront, newRear, newCount, "removeRear", removedElement, `Removed ${removedElement} from rear. Moving rear circularly: (${rear} - 1 + ${dequeSize}) % ${dequeSize} = ${newRear}. Deque size: ${newCount}/${dequeSize}`, false, 52)
    }
    setDeque(newDeque); setFront(newFront); setRear(newRear); setCount(newCount)
  }
  const peekFront = () => {
    if (count === 0) { addStep(deque, front, rear, count, "peekFront", undefined, "Cannot peek empty deque", true, 57); return }
    const frontElement = deque[front]
    addStep(deque, front, rear, count, "peekFront", frontElement, `Front element is ${frontElement} at position ${front}. Deque size: ${count}/${dequeSize}`, false, 59)
  }
  const peekRear = () => {
    if (count === 0) { addStep(deque, front, rear, count, "peekRear", undefined, "Cannot peek empty deque", true, 62); return }
    const rearElement = deque[rear]
    addStep(deque, front, rear, count, "peekRear", rearElement, `Rear element is ${rearElement} at position ${rear}. Deque size: ${count}/${dequeSize}`, false, 64)
  }
  const clearDeque = () => { setDeque(new Array(dequeSize).fill(undefined)); setFront(-1); setRear(-1); setCount(0); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false); setInputError("") }
  const display = () => {
    const cs = steps[currentStepIndex]
    return steps.length > 0 && cs ? { q: cs.deque, f: cs.front, r: cs.rear } : { q: deque, f: front, r: rear }
  }
  sizeInput = String(size)
  updateDequeSize()
  return {
    type: (v: string) => setInputValue(v), addFront, addRear, removeFront, removeRear, peekFront, peekRear, clearDeque, display,
    get deque() { return deque }, get front() { return front }, get rear() { return rear }, get count() { return count }, get steps() { return steps },
  }
}

type K = "addFront" | "addRear" | "removeFront" | "removeRear" | "peekFront" | "peekRear" | "clear"
type Op = { k: K; v?: number }
const show = (cap: number, ops: Op[]) => `size=${cap}: ` + ops.map((o) => (o.v !== undefined ? `${o.k}(${o.v})` : o.k)).join(", ")
function contents(q: (number | undefined)[], f: number, n: number): (number | undefined)[] {
  const out: (number | undefined)[] = []
  for (let i = 0; i < n; i++) out.push(q[(f + i) % q.length])
  return out
}

function check(cap: number, ops: Op[]): Set<string> {
  const bad = new Set<string>()
  const ui = makeLegacy(cap)
  let model: number[] = []
  for (const op of ops) {
    const before = ui.steps.length
    if (op.v !== undefined) ui.type(String(op.v))
    const fn = op.k === "clear" ? ui.clearDeque : ui[op.k]
    fn()
    const frames = ui.steps.slice(before)
    const wasEmpty = model.length === 0
    let err = false
    let returned: number | undefined
    switch (op.k) {
      case "addFront": if (model.length === cap) err = true; else model = [op.v!, ...model]; break
      case "addRear": if (model.length === cap) err = true; else model = [...model, op.v!]; break
      case "removeFront": if (!model.length) err = true; else { returned = model[0]; model = model.slice(1) } break
      case "removeRear": if (!model.length) err = true; else { returned = model[model.length - 1]; model = model.slice(0, -1) } break
      case "peekFront": if (!model.length) err = true; else returned = model[0]; break
      case "peekRear": if (!model.length) err = true; else returned = model[model.length - 1]; break
      case "clear": model = []
    }
    if (ui.count !== model.length) bad.add("count differs from model")
    if (JSON.stringify(contents(ui.deque, ui.front, ui.count)) !== JSON.stringify(model)) bad.add("contents differ from array model")
    if (model.length > 0 && ui.rear !== (ui.front + model.length - 1) % cap) bad.add("rear != (front + count - 1) mod size")
    if (op.k !== "clear") {
      const f = frames[frames.length - 1]
      if (!f || f.isError !== err) bad.add("error flag wrong")
      if (!err && returned !== undefined && f.element !== returned) bad.add("returned element differs from model")
      const m = /Deque size: (\d+)\/(\d+)/.exec(f.description)
      if (m && (Number(m[1]) !== model.length || Number(m[2]) !== cap)) bad.add("caption size wrong")
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i]
        let expect: string | string[]
        const end = op.k.endsWith("Front") ? "front" : "rear"
        if (err) expect = op.k.startsWith("add") ? "isFull()" : "isEmpty()"
        else if (op.k.startsWith("add")) {
          expect = i === 0
            ? (wasEmpty ? "this.front = this.rear = 0" : end === "front" ? "this.front = (this.front - 1 + this.maxSize) % this.maxSize" : "this.rear = (this.rear + 1) % this.maxSize")
            : [`this.items[this.${end}] = element`, "this.count++"]
        } else if (op.k.startsWith("remove")) {
          expect = model.length === 0 ? ["if (this.isEmpty()) {", "this.front = this.rear = -1"] : end === "front" ? "this.front = (this.front + 1) % this.maxSize" : "this.rear = (this.rear - 1 + this.maxSize) % this.maxSize"
        } else expect = `return this.items[this.${end}]`
        if (!lineOk(dequeCode, fr.activeCodeLine, op.k, expect)) {
          const what = err ? " error" : op.k.startsWith("add") ? (i === 0 ? (wasEmpty ? " set-front-rear" : " move-pointer") : " store") : op.k.startsWith("remove") ? (model.length === 0 ? " to-empty" : " move-pointer") : ""
          bad.add(`highlighted code line wrong (${op.k}${what}: shows "${dequeCode[fr.activeCodeLine]?.trim()}")`)
        }
      }
    }
    const d = ui.display()
    const dn = d.f === -1 ? 0 : d.q.filter((x) => x !== undefined).length
    if (JSON.stringify(contents(d.q, Math.max(d.f, 0), dn)) !== JSON.stringify(model) || d.r !== ui.rear) bad.add("visualization shows a stale frame, not the state after the operation")
  }
  return bad
}

const kinds: K[] = ["addFront", "addRear", "removeFront", "removeRear", "peekFront", "peekRear"]
function main(): void {
const r = rng(999)
const tally = new Tally()
const N = 20000
for (let t = 0; t < N; t++) {
  const cap = int(r, 2, 12)
  const len = int(r, 1, 40)
  const ops: Op[] = []
  for (let i = 0; i < len; i++) {
    if (r() < 0.02) { ops.push({ k: "clear" }); continue }
    const x = r()
    const k = x < 0.25 ? "addFront" : x < 0.5 ? "addRear" : x < 0.68 ? "removeFront" : x < 0.86 ? "removeRear" : x < 0.93 ? "peekFront" : "peekRear"
    ops.push(k.startsWith("add") ? { k, v: int(r, -20, 20) } : { k })
  }
  for (const d of check(cap, ops)) tally.add(d, show(cap, ops))
}
void kinds
console.log(`deque: ${N} random sequences (size 2-12, length 1-40, values -20..20)`)
tally.print(N, "sequences")

}
if (process.argv[1]?.split("\\").join("/").endsWith("/legacy.ts")) main()
