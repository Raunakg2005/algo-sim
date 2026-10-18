// Legacy check for components/linear-queue-visualizer.tsx (git HEAD).
// Handlers copied verbatim from original.tsx; useState setters replaced by plain variables.
import { rng, int, lineOk, Tally } from "../_dsq_util.ts"

interface QueueStep { queue: (number | undefined)[]; front: number; rear: number; operation: string; element?: number; description: string; isError: boolean; activeCodeLine: number }

const queueCode = [
  "class LinearQueue {", "  constructor(size) {", "    this.items = new Array(size);", "    this.front = -1;", "    this.rear = -1;", "    this.maxSize = size;", "  }", "",
  "  enqueue(element) {", "    if (this.isFull()) return false;", "    if (this.isEmpty()) this.front = 0;", "    this.rear++;", "    this.items[this.rear] = element;", "    return true;", "  }", "",
  "  dequeue() {", "    if (this.isEmpty()) return null;", "    const element = this.items[this.front];", "    this.items[this.front] = undefined;", "    if (this.front === this.rear) {", "      this.front = this.rear = -1;", "    } else {", "      this.front++;", "    }", "    return element;", "  }", "",
  "  peek() {", "    if (this.isEmpty()) return null;", "    return this.items[this.front];", "  }", "",
  "  isEmpty() {", "    return this.front === -1;", "  }", "",
  "  isFull() {", "    return this.rear === this.maxSize - 1;", "  }", "}",
]

export function makeLegacy(initialSize: number) {
  let queueSize = 8
  let sizeInput = "8"
  let sizeError = ""
  let queue: (number | undefined)[] = new Array(8).fill(undefined)
  let front = -1
  let rear = -1
  let inputValue = ""
  let inputError = ""
  let steps: QueueStep[] = []
  let currentStepIndex = 0
  const setQueueSize = (v: number) => { queueSize = v }
  const setSizeError = (v: string) => { sizeError = v }
  const setQueue = (v: (number | undefined)[]) => { queue = v }
  const setFront = (v: number) => { front = v }
  const setRear = (v: number) => { rear = v }
  const setInputValue = (v: string) => { inputValue = v }
  const setInputError = (v: string) => { inputError = v }
  const setSteps = (f: QueueStep[] | ((p: QueueStep[]) => QueueStep[])) => { steps = typeof f === "function" ? f(steps) : f }
  const setCurrentStepIndex = (i: number) => { currentStepIndex = i }
  const setIsPlaying = (_: boolean) => {}

  const addStep = (newQueue: (number | undefined)[], newFront: number, newRear: number, operation: string, element: number | undefined, description: string, isError = false, activeCodeLine = 0) => {
    const newStep: QueueStep = { queue: [...newQueue], front: newFront, rear: newRear, operation, element, description, isError, activeCodeLine }
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
  const updateQueueSize = () => {
    const size = Number.parseInt(sizeInput.trim())
    if (isNaN(size) || size < 1 || size > 20) { setSizeError("Queue size must be between 1 and 20"); return }
    setSizeError("")
    setQueueSize(size)
    setQueue(new Array(size).fill(undefined))
    setFront(-1); setRear(-1); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false)
  }
  const enqueueElement = () => {
    const element = validateInput(inputValue)
    if (element === null) return
    if (rear === queueSize - 1) {
      addStep(queue, front, rear, "enqueue", element, `Cannot enqueue ${element}. Queue is full!`, true, 9)
      setInputValue("")
      return
    }
    const newQueue = [...queue]
    let newFront = front
    let newRear = rear
    if (front === -1) {
      newFront = 0
      addStep(newQueue, newFront, newRear, "enqueue", element, `Queue is empty. Setting front to 0.`, false, 10)
    }
    newRear++
    newQueue[newRear] = element
    setQueue(newQueue); setFront(newFront); setRear(newRear)
    addStep(newQueue, newFront, newRear, "enqueue", element, `Enqueued ${element} at position ${newRear}. Queue size: ${newRear - newFront + 1}`, false, 12)
    setInputValue("")
  }
  const dequeueElement = () => {
    if (front === -1) { addStep(queue, front, rear, "dequeue", undefined, "Cannot dequeue from empty queue", true, 16); return }
    const dequeuedElement = queue[front]
    const newQueue = [...queue]
    newQueue[front] = undefined
    let newFront = front
    let newRear = rear
    if (front === rear) {
      newFront = -1; newRear = -1
      addStep(newQueue, newFront, newRear, "dequeue", dequeuedElement, `Dequeued ${dequeuedElement}. Queue is now empty.`, false, 20)
    } else {
      newFront++
      addStep(newQueue, newFront, newRear, "dequeue", dequeuedElement, `Dequeued ${dequeuedElement}. New front is at position ${newFront}. Queue size: ${newRear - newFront + 1}`, false, 23)
    }
    setQueue(newQueue); setFront(newFront); setRear(newRear)
  }
  const peekElement = () => {
    if (front === -1) { addStep(queue, front, rear, "peek", undefined, "Cannot peek empty queue", true, 27); return }
    const frontElement = queue[front]
    addStep(queue, front, rear, "peek", frontElement, `Front element is ${frontElement} at position ${front}. Queue size: ${rear - front + 1}`, false, 29)
  }
  const clearQueue = () => {
    setQueue(new Array(queueSize).fill(undefined)); setFront(-1); setRear(-1); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false); setInputError("")
  }
  const display = () => {
    const cs = steps[currentStepIndex]
    return steps.length > 0 && cs ? { q: cs.queue, f: cs.front, r: cs.rear } : { q: queue, f: front, r: rear }
  }
  sizeInput = String(initialSize)
  updateQueueSize()
  return {
    type: (v: string) => setInputValue(v), enqueueElement, dequeueElement, peekElement, clearQueue, display,
    get queue() { return queue }, get front() { return front }, get rear() { return rear }, get steps() { return steps }, get sizeError() { return sizeError },
  }
}

type Op = { k: "enqueue"; v: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
const show = (cap: number, ops: Op[]) => `size=${cap}: ` + ops.map((o) => (o.k === "enqueue" ? `enqueue(${o.v})` : o.k)).join(", ")
const contents = (q: (number | undefined)[], f: number, r: number) => (f === -1 ? [] : q.slice(f, r + 1))

function check(cap: number, ops: Op[]): Set<string> {
  const bad = new Set<string>()
  const ui = makeLegacy(cap)
  let model: number[] = []
  let used = 0 // slots consumed since the queue was last empty (linear queue never reuses slots)
  for (const op of ops) {
    const before = ui.steps.length
    if (op.k === "enqueue") { ui.type(String(op.v)); ui.enqueueElement() }
    else if (op.k === "dequeue") ui.dequeueElement()
    else if (op.k === "peek") ui.peekElement()
    else ui.clearQueue()
    const frames = ui.steps.slice(before)
    const wasEmpty = model.length === 0
    let err = false
    if (op.k === "enqueue") { if (used === cap) err = true; else { model = [...model, op.v]; used++ } }
    else if (op.k === "dequeue") { if (model.length === 0) err = true; else { model = model.slice(1); if (model.length === 0) used = 0 } }
    else if (op.k === "peek") err = model.length === 0
    else { model = []; used = 0 }
    if (JSON.stringify(contents(ui.queue, ui.front, ui.rear)) !== JSON.stringify(model)) bad.add("contents differ from array model")
    if (op.k !== "clear") {
      const f = frames[frames.length - 1]
      if (!f || f.isError !== err) bad.add("error flag wrong")
      if (f && JSON.stringify(contents(f.queue, f.front, f.rear)) !== JSON.stringify(model)) bad.add("last frame differs from state")
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i]
        let expect: string | string[]
        if (err) expect = op.k === "enqueue" ? "isFull()" : "isEmpty()"
        else if (op.k === "enqueue") expect = wasEmpty && i === 0 ? "this.front = 0" : ["this.rear++", "this.items[this.rear] = element"]
        else if (op.k === "dequeue") expect = model.length === 0 ? ["if (this.front === this.rear)", "this.front = this.rear = -1"] : "this.front++"
        else expect = "return this.items[this.front]"
        if (!lineOk(queueCode, fr.activeCodeLine, op.k, expect))
          bad.add(`highlighted code line wrong (${op.k}${err ? " error" : wasEmpty && op.k === "enqueue" && i === 0 ? " set-front" : ""}: shows "${queueCode[fr.activeCodeLine]?.trim()}")`)
      }
    }
    const d = ui.display()
    if (JSON.stringify(contents(d.q, d.f, d.r)) !== JSON.stringify(model) || d.q.length !== cap) bad.add("visualization shows a stale frame, not the state after the operation")
  }
  return bad
}

function main(): void {
const r = rng(4242)
const tally = new Tally()
const N = 20000
for (let t = 0; t < N; t++) {
  const cap = int(r, 1, 20)
  const len = int(r, 1, 30)
  const ops: Op[] = []
  for (let i = 0; i < len; i++) {
    const x = r()
    ops.push(x < 0.5 ? { k: "enqueue", v: int(r, -20, 20) } : x < 0.8 ? { k: "dequeue" } : x < 0.97 ? { k: "peek" } : { k: "clear" })
  }
  for (const d of check(cap, ops)) tally.add(d, show(cap, ops))
}
console.log(`linear queue: ${N} random sequences (size 1-20, length 1-30, values -20..20)`)
tally.print(N, "sequences")

}
if (process.argv[1]?.split("\\").join("/").endsWith("/legacy.ts")) main()
