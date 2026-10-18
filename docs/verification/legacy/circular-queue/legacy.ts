// Legacy check for components/circular-queue-visualizer.tsx (git HEAD).
// Handlers copied verbatim from original.tsx; useState setters replaced by plain variables.
import { rng, int, lineOk, Tally } from "../_dsq_util.ts"

interface CircularQueueStep { queue: (number | undefined)[]; front: number; rear: number; operation: string; element?: number; description: string; isError: boolean; activeCodeLine: number }

const circularQueueCode = [
  "class CircularQueue {", "  constructor(size) {", "    this.items = new Array(size);", "    this.front = -1;", "    this.rear = -1;", "    this.maxSize = size;", "    this.count = 0;", "  }", "",
  "  enqueue(element) {", "    if (this.isFull()) return false;", "    if (this.isEmpty()) {", "      this.front = 0;", "      this.rear = 0;", "    } else {", "      this.rear = (this.rear + 1) % this.maxSize;", "    }", "    this.items[this.rear] = element;", "    this.count++;", "    return true;", "  }", "",
  "  dequeue() {", "    if (this.isEmpty()) return null;", "    const element = this.items[this.front];", "    this.items[this.front] = undefined;", "    this.count--;", "    if (this.isEmpty()) {", "      this.front = this.rear = -1;", "    } else {", "      this.front = (this.front + 1) % this.maxSize;", "    }", "    return element;", "  }", "",
  "  peek() {", "    if (this.isEmpty()) return null;", "    return this.items[this.front];", "  }", "",
  "  isEmpty() {", "    return this.count === 0;", "  }", "",
  "  isFull() {", "    return this.count === this.maxSize;", "  }", "}",
]

export function makeLegacy(size: number) {
  let queueSize = 8
  let queue: (number | undefined)[] = new Array(8).fill(undefined)
  let front = -1
  let rear = -1
  let count = 0
  let inputValue = ""
  let inputError = ""
  let steps: CircularQueueStep[] = []
  let currentStepIndex = 0
  const setQueue = (v: (number | undefined)[]) => { queue = v }
  const setFront = (v: number) => { front = v }
  const setRear = (v: number) => { rear = v }
  const setCount = (v: number) => { count = v }
  const setInputValue = (v: string) => { inputValue = v }
  const setInputError = (v: string) => { inputError = v }
  const setSteps = (f: CircularQueueStep[] | ((p: CircularQueueStep[]) => CircularQueueStep[])) => { steps = typeof f === "function" ? f(steps) : f }
  const setCurrentStepIndex = (i: number) => { currentStepIndex = i }
  const setIsPlaying = (_: boolean) => {}
  // useEffect(() => { reset }, [queueSize])
  const onQueueSizeChanged = () => { setQueue(new Array(queueSize).fill(undefined)); setFront(-1); setRear(-1); setCount(0); setSteps([]); setCurrentStepIndex(0) }
  const setQueueSize = (v: number) => { if (v !== queueSize) { queueSize = v; onQueueSizeChanged() } }
  const updateQueueSize = (newSize: number) => { if (newSize >= 2 && newSize <= 12) setQueueSize(newSize) }

  const addStep = (newQueue: (number | undefined)[], newFront: number, newRear: number, newCount: number, operation: string, element: number | undefined, description: string, isError = false, activeCodeLine = 0) => {
    void newCount
    const newStep: CircularQueueStep = { queue: [...newQueue], front: newFront, rear: newRear, operation, element, description, isError, activeCodeLine }
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
  const enqueueElement = () => {
    const element = validateInput(inputValue)
    if (element === null) return
    if (count === queueSize) {
      addStep(queue, front, rear, count, "enqueue", element, `Cannot enqueue ${element}. Queue is full!`, true, 9)
      setInputValue("")
      return
    }
    const newQueue = [...queue]
    let newFront = front
    let newRear = rear
    let newCount = count
    if (count === 0) {
      newFront = 0; newRear = 0
      addStep(newQueue, newFront, newRear, newCount, "enqueue", element, `Queue is empty. Setting front and rear to 0.`, false, 11)
    } else {
      newRear = (rear + 1) % queueSize
      addStep(newQueue, newFront, newRear, newCount, "enqueue", element, `Moving rear circularly: (${rear} + 1) % ${queueSize} = ${newRear}`, false, 14)
    }
    newQueue[newRear] = element
    newCount++
    setQueue(newQueue); setFront(newFront); setRear(newRear); setCount(newCount)
    addStep(newQueue, newFront, newRear, newCount, "enqueue", element, `Enqueued ${element} at position ${newRear}. Queue size: ${newCount}/${queueSize}`, false, 16)
    setInputValue("")
  }
  const dequeueElement = () => {
    if (count === 0) { addStep(queue, front, rear, count, "dequeue", undefined, "Cannot dequeue from empty queue", true, 21); return }
    const dequeuedElement = queue[front]
    const newQueue = [...queue]
    newQueue[front] = undefined
    let newFront = front
    let newRear = rear
    const newCount = count - 1
    if (newCount === 0) {
      newFront = -1; newRear = -1
      addStep(newQueue, newFront, newRear, newCount, "dequeue", dequeuedElement, `Dequeued ${dequeuedElement}. Queue is now empty.`, false, 25)
    } else {
      newFront = (front + 1) % queueSize
      addStep(newQueue, newFront, newRear, newCount, "dequeue", dequeuedElement, `Dequeued ${dequeuedElement}. Moving front circularly: (${front} + 1) % ${queueSize} = ${newFront}. Queue size: ${newCount}/${queueSize}`, false, 27)
    }
    setQueue(newQueue); setFront(newFront); setRear(newRear); setCount(newCount)
  }
  const peekElement = () => {
    if (count === 0) { addStep(queue, front, rear, count, "peek", undefined, "Cannot peek empty queue", true, 32); return }
    const frontElement = queue[front]
    addStep(queue, front, rear, count, "peek", frontElement, `Front element is ${frontElement} at position ${front}. Queue size: ${count}/${queueSize}`, false, 34)
  }
  const clearQueue = () => { setQueue(new Array(queueSize).fill(undefined)); setFront(-1); setRear(-1); setCount(0); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false); setInputError("") }
  const display = () => {
    const cs = steps[currentStepIndex]
    return steps.length > 0 && cs ? { q: cs.queue, f: cs.front, r: cs.rear } : { q: queue, f: front, r: rear }
  }
  updateQueueSize(size)
  return {
    type: (v: string) => setInputValue(v), enqueueElement, dequeueElement, peekElement, clearQueue, display, updateQueueSize,
    get queue() { return queue }, get front() { return front }, get rear() { return rear }, get count() { return count }, get steps() { return steps }, get queueSize() { return queueSize },
  }
}

type Op = { k: "enqueue"; v: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
const show = (cap: number, ops: Op[]) => `size=${cap}: ` + ops.map((o) => (o.k === "enqueue" ? `enqueue(${o.v})` : o.k)).join(", ")
// read the logical queue front -> rear following the wrap-around
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
    if (op.k === "enqueue") { ui.type(String(op.v)); ui.enqueueElement() }
    else if (op.k === "dequeue") ui.dequeueElement()
    else if (op.k === "peek") ui.peekElement()
    else ui.clearQueue()
    const frames = ui.steps.slice(before)
    const wasEmpty = model.length === 0
    let err = false
    if (op.k === "enqueue") { if (model.length === cap) err = true; else model = [...model, op.v] }
    else if (op.k === "dequeue") { if (model.length === 0) err = true; else model = model.slice(1) }
    else if (op.k === "peek") err = model.length === 0
    else model = []
    if (ui.count !== model.length) bad.add("count differs from model")
    if (JSON.stringify(contents(ui.queue, ui.front, ui.count)) !== JSON.stringify(model)) bad.add("contents differ from array model")
    if (ui.queue.filter((x) => x !== undefined).length !== model.length) bad.add("stray cells outside front..rear")
    if (model.length > 0 && ui.rear !== (ui.front + model.length - 1) % cap) bad.add("rear != (front + count - 1) mod size")
    if (model.length === 0 && (ui.front !== -1 || ui.rear !== -1)) bad.add("empty queue but pointers not reset")
    if (op.k !== "clear") {
      const f = frames[frames.length - 1]
      if (!f || f.isError !== err) bad.add("error flag wrong")
      const shownCount = f.front === -1 ? 0 : f.queue.filter((x) => x !== undefined).length // as rendered
      if (f && JSON.stringify(contents(f.queue, Math.max(f.front, 0), shownCount)) !== JSON.stringify(model)) bad.add("last frame differs from state")
      const m = /Queue size: (\d+)\/(\d+)/.exec(f.description)
      if (m && (Number(m[1]) !== model.length || Number(m[2]) !== cap)) bad.add("caption size wrong")
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i]
        let expect: string | string[]
        if (err) expect = op.k === "enqueue" ? "isFull()" : "isEmpty()"
        else if (op.k === "enqueue") expect = i === 0 ? (wasEmpty ? ["this.front = 0", "this.rear = 0"] : "this.rear = (this.rear + 1) % this.maxSize") : ["this.items[this.rear] = element", "this.count++"]
        else if (op.k === "dequeue") expect = model.length === 0 ? ["if (this.isEmpty()) {", "this.front = this.rear = -1"] : "this.front = (this.front + 1) % this.maxSize"
        else expect = "return this.items[this.front]"
        if (!lineOk(circularQueueCode, fr.activeCodeLine, op.k, expect)) {
          const what = err ? " error" : op.k === "enqueue" ? (i === 0 ? (wasEmpty ? " set-front-rear" : " move-rear") : " store") : op.k === "dequeue" ? (model.length === 0 ? " to-empty" : " move-front") : ""
          bad.add(`highlighted code line wrong (${op.k}${what}: shows "${circularQueueCode[fr.activeCodeLine]?.trim()}")`)
        }
      }
    }
    const d = ui.display()
    const dn = d.f === -1 ? 0 : d.q.filter((x) => x !== undefined).length
    if (JSON.stringify(contents(d.q, Math.max(d.f, 0), dn)) !== JSON.stringify(model) || d.r !== ui.rear) bad.add("visualization shows a stale frame, not the state after the operation")
  }
  return bad
}

function main(): void {
const r = rng(777)
const tally = new Tally()
const N = 20000
let wraps = 0
for (let t = 0; t < N; t++) {
  const cap = int(r, 2, 12)
  const len = int(r, 1, 40)
  const ops: Op[] = []
  for (let i = 0; i < len; i++) {
    const x = r()
    ops.push(x < 0.5 ? { k: "enqueue", v: int(r, -20, 20) } : x < 0.85 ? { k: "dequeue" } : x < 0.98 ? { k: "peek" } : { k: "clear" })
  }
  // count sequences that really wrap (rear index goes from size-1 back to 0 while non-empty)
  {
    let m = 0, fr = -1, re = -1, w = false
    for (const o of ops) {
      if (o.k === "enqueue" && m < cap) { if (m === 0) { fr = 0; re = 0 } else { if (re === cap - 1) w = true; re = (re + 1) % cap } m++ }
      else if (o.k === "dequeue" && m > 0) { m--; if (m === 0) { fr = re = -1 } else fr = (fr + 1) % cap }
      else if (o.k === "clear") { m = 0; fr = re = -1 }
    }
    if (w) wraps++
  }
  for (const d of check(cap, ops)) tally.add(d, show(cap, ops))
}
console.log(`circular queue: ${N} random sequences (size 2-12, length 1-40, values -20..20); ${wraps} of them wrap rear past the end`)
tally.print(N, "sequences")

// queue-size input: <Input type="number" onChange={(e) => updateQueueSize(Number(e.target.value))}>
console.log("queue-size input (type=number, accepted when 2 <= n <= 12):")
for (const s of ["2", "12", "13", "1", "2.5", "7.5", "11.9"]) {
  const ui = makeLegacy(8)
  try { ui.updateQueueSize(Number(s)); console.log(`  "${s}" -> queueSize ${ui.queueSize}, array length ${ui.queue.length}`) }
  catch (e) { console.log(`  "${s}" -> CRASH: ${(e as Error).name}: ${(e as Error).message}`) }
}

}
if (process.argv[1]?.split("\\").join("/").endsWith("/legacy.ts")) main()
