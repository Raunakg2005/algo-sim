// Legacy check for components/priority-queue-visualizer.tsx (git HEAD).
// Handlers copied verbatim from original.tsx; useState setters replaced by plain variables.
import { rng, int, lineOk, Tally } from "../_dsq_util.ts"

interface PriorityQueueElement { value: number; priority: number; id: number }
interface PriorityQueueStep { queue: PriorityQueueElement[]; operation: string; element?: PriorityQueueElement; description: string; isError: boolean; activeCodeLine: number }

const priorityQueueCode = [
  "class PriorityQueue {", "  constructor(isMaxHeap = true) {", "    this.heap = [];", "    this.isMaxHeap = isMaxHeap;", "  }", "",
  "  enqueue(value, priority) {", "    const element = { value, priority };", "    this.heap.push(element);", "    this.heapifyUp(this.heap.length - 1);", "  }", "",
  "  dequeue() {", "    if (this.isEmpty()) return null;", "    if (this.heap.length === 1) return this.heap.pop();", "    ", "    const root = this.heap[0];", "    this.heap[0] = this.heap.pop();", "    this.heapifyDown(0);", "    return root;", "  }", "",
  "  peek() {", "    return this.isEmpty() ? null : this.heap[0];", "  }", "",
  "  heapifyUp(index) {", "    if (index === 0) return;", "    const parentIndex = Math.floor((index - 1) / 2);", "    if (this.compare(index, parentIndex)) {", "      this.swap(index, parentIndex);", "      this.heapifyUp(parentIndex);", "    }", "  }", "",
  "  heapifyDown(index) {", "    const leftChild = 2 * index + 1;", "    const rightChild = 2 * index + 2;", "    let targetIndex = index;", "",
  "    if (leftChild < this.heap.length && ", "        this.compare(leftChild, targetIndex)) {", "      targetIndex = leftChild;", "    }", "",
  "    if (rightChild < this.heap.length && ", "        this.compare(rightChild, targetIndex)) {", "      targetIndex = rightChild;", "    }", "",
  "    if (targetIndex !== index) {", "      this.swap(index, targetIndex);", "      this.heapifyDown(targetIndex);", "    }", "  }", "",
  "  compare(i, j) {", "    return this.isMaxHeap ? ", "      this.heap[i].priority > this.heap[j].priority :", "      this.heap[i].priority < this.heap[j].priority;", "  }", "",
  "  swap(i, j) {", "    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];", "  }", "",
  "  isEmpty() {", "    return this.heap.length === 0;", "  }", "}",
]

export function makeLegacy(isMax: boolean) {
  let queue: PriorityQueueElement[] = []
  let valueInput = ""
  let priorityInput = ""
  let inputError = ""
  let steps: PriorityQueueStep[] = []
  let currentStepIndex = 0
  let isMaxHeap = true
  let nextId = 1
  const setQueue = (v: PriorityQueueElement[]) => { queue = v }
  const setValueInput = (v: string) => { valueInput = v }
  const setPriorityInput = (v: string) => { priorityInput = v }
  const setInputError = (v: string) => { inputError = v }
  const setSteps = (f: PriorityQueueStep[] | ((p: PriorityQueueStep[]) => PriorityQueueStep[])) => { steps = typeof f === "function" ? f(steps) : f }
  const setCurrentStepIndex = (i: number) => { currentStepIndex = i }
  const setIsPlaying = (_: boolean) => {}
  const setIsMaxHeap = (v: boolean) => { isMaxHeap = v }
  const setNextId = (v: number) => { nextId = v }

  const addStep = (newQueue: PriorityQueueElement[], operation: string, element: PriorityQueueElement | undefined, description: string, isError = false, activeCodeLine = 0) => {
    const newStep: PriorityQueueStep = { queue: [...newQueue], operation, element, description, isError, activeCodeLine }
    setSteps((prev) => [...prev, newStep])
  }
  const validateInput = (): { value: number; priority: number } | null => {
    const value = valueInput.trim()
    const priority = priorityInput.trim()
    if (!value || !priority) { setInputError("Please enter both value and priority"); return null }
    const numValue = Number.parseInt(value, 10)
    const numPriority = Number.parseInt(priority, 10)
    if (isNaN(numValue) || isNaN(numPriority)) { setInputError("Please enter valid numbers"); return null }
    setInputError("")
    return { value: numValue, priority: numPriority }
  }
  const compare = (i: number, j: number, heap: PriorityQueueElement[]): boolean => (isMaxHeap ? heap[i].priority > heap[j].priority : heap[i].priority < heap[j].priority)
  const swap = (heap: PriorityQueueElement[], i: number, j: number) => { ;[heap[i], heap[j]] = [heap[j], heap[i]] }
  const heapifyUp = (heap: PriorityQueueElement[], index: number): PriorityQueueElement[] => {
    if (index === 0) return heap
    const parentIndex = Math.floor((index - 1) / 2)
    if (compare(index, parentIndex, heap)) {
      swap(heap, index, parentIndex)
      addStep(heap, "heapifyUp", undefined, `Swapped elements at positions ${index} and ${parentIndex} to maintain heap property`, false, 28)
      return heapifyUp(heap, parentIndex)
    }
    return heap
  }
  const heapifyDown = (heap: PriorityQueueElement[], index: number): PriorityQueueElement[] => {
    const leftChild = 2 * index + 1
    const rightChild = 2 * index + 2
    let targetIndex = index
    if (leftChild < heap.length && compare(leftChild, targetIndex, heap)) targetIndex = leftChild
    if (rightChild < heap.length && compare(rightChild, targetIndex, heap)) targetIndex = rightChild
    if (targetIndex !== index) {
      swap(heap, index, targetIndex)
      addStep(heap, "heapifyDown", undefined, `Swapped elements at positions ${index} and ${targetIndex} to maintain heap property`, false, 45)
      return heapifyDown(heap, targetIndex)
    }
    return heap
  }
  const enqueueElement = () => {
    const input = validateInput()
    if (input === null) return
    const newElement: PriorityQueueElement = { value: input.value, priority: input.priority, id: nextId }
    const newQueue = [...queue, newElement]
    setNextId(nextId + 1)
    addStep(newQueue, "enqueue", newElement, `Added element ${input.value} with priority ${input.priority} to the end of heap`, false, 8)
    const heapifiedQueue = heapifyUp(newQueue, newQueue.length - 1)
    setQueue(heapifiedQueue)
    addStep(heapifiedQueue, "enqueue", newElement, `Enqueued element ${input.value} with priority ${input.priority}. Heap property maintained.`, false, 10)
    setValueInput(""); setPriorityInput("")
  }
  const dequeueElement = () => {
    if (queue.length === 0) { addStep(queue, "dequeue", undefined, "Cannot dequeue from empty priority queue", true, 12); return }
    if (queue.length === 1) {
      const dequeuedElement = queue[0]
      const newQueue: PriorityQueueElement[] = []
      setQueue(newQueue)
      addStep(newQueue, "dequeue", dequeuedElement, `Dequeued element ${dequeuedElement.value} with priority ${dequeuedElement.priority}. Queue is now empty.`, false, 14)
      return
    }
    const dequeuedElement = queue[0]
    const newQueue = [...queue]
    newQueue[0] = newQueue.pop()!
    addStep(newQueue, "dequeue", dequeuedElement, `Moved last element to root position and removed the highest priority element`, false, 16)
    const heapifiedQueue = heapifyDown(newQueue, 0)
    setQueue(heapifiedQueue)
    addStep(heapifiedQueue, "dequeue", dequeuedElement, `Dequeued element ${dequeuedElement.value} with priority ${dequeuedElement.priority}. Heap property restored.`, false, 18)
  }
  const peekElement = () => {
    if (queue.length === 0) { addStep(queue, "peek", undefined, "Cannot peek empty priority queue", true, 21); return }
    const frontElement = queue[0]
    addStep(queue, "peek", frontElement, `Highest priority element is ${frontElement.value} with priority ${frontElement.priority}`, false, 22)
  }
  const clearQueue = () => { setQueue([]); setSteps([]); setCurrentStepIndex(0); setIsPlaying(false); setInputError(""); setNextId(1) }
  const toggleHeapType = (type: string) => { setIsMaxHeap(type === "max"); clearQueue() }
  // render-side derived values (renderPriorityQueueVisualization)
  const view = () => {
    const displayQueue = steps.length > 0 ? (steps[currentStepIndex] ?? { queue: [] }).queue : queue
    const sortedForDisplay = [...displayQueue].sort((a, b) => (isMaxHeap ? b.priority - a.priority : a.priority - b.priority))
    return {
      displayQueue, sortedForDisplay,
      nextToDequeue: sortedForDisplay[0],
      nextPriorityStat: sortedForDisplay[0]?.priority || "N/A",
    }
  }
  toggleHeapType(isMax ? "max" : "min")
  return {
    type: (v: string, p: string) => { setValueInput(v); setPriorityInput(p) }, enqueueElement, dequeueElement, peekElement, clearQueue, view,
    get queue() { return queue }, get steps() { return steps },
  }
}

type Op = { k: "enqueue"; v: number; p: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
const show = (isMax: boolean, ops: Op[]) => `${isMax ? "max" : "min"}: ` + ops.map((o) => (o.k === "enqueue" ? `enqueue(${o.v},p=${o.p})` : o.k)).join(", ")
const better = (isMax: boolean, a: number, b: number) => (isMax ? a > b : a < b)
const heapOk = (h: PriorityQueueElement[], isMax: boolean) => h.every((e, i) => i === 0 || !better(isMax, e.priority, h[Math.floor((i - 1) / 2)].priority))
// actual service order: repeatedly apply the component's own dequeue to a copy of the heap
function serviceOrder(heap: PriorityQueueElement[], isMax: boolean): number[] {
  const h = [...heap]
  const out: number[] = []
  while (h.length) {
    out.push(h[0].id)
    const last = h.pop()!
    if (!h.length) break
    h[0] = last
    let i = 0
    for (;;) {
      const l = 2 * i + 1, r = 2 * i + 2
      let t = i
      if (l < h.length && better(isMax, h[l].priority, h[t].priority)) t = l
      if (r < h.length && better(isMax, h[r].priority, h[t].priority)) t = r
      if (t === i) break
      ;[h[i], h[t]] = [h[t], h[i]]
      i = t
    }
  }
  return out
}

function check(isMax: boolean, ops: Op[]): Set<string> {
  const bad = new Set<string>()
  const ui = makeLegacy(isMax)
  let model: PriorityQueueElement[] = [] // plain array, insertion order
  let nextId = 1
  for (const op of ops) {
    const before = ui.steps.length
    const wasLen = model.length
    if (op.k === "enqueue") { ui.type(String(op.v), String(op.p)); ui.enqueueElement() }
    else if (op.k === "dequeue") ui.dequeueElement()
    else if (op.k === "peek") ui.peekElement()
    else ui.clearQueue()
    const frames = ui.steps.slice(before)
    const err = (op.k === "dequeue" || op.k === "peek") && wasLen === 0
    if (op.k === "enqueue") model = [...model, { value: op.v, priority: op.p, id: nextId++ }]
    else if (op.k === "dequeue" && !err) {
      const got = frames[frames.length - 1].element!
      const best = model.reduce((b, e) => (better(isMax, e.priority, b) ? e.priority : b), model[0].priority)
      if (got.priority !== best) bad.add(`dequeued element is not the ${isMax ? "max" : "min"}-priority one`)
      const firstArrived = model.find((e) => e.priority === best)!
      if (got.id !== firstArrived.id) bad.add("[info] equal priorities not served in arrival (FIFO) order")
      model = model.filter((e) => e.id !== got.id)
    } else if (op.k === "clear") { model = []; nextId = 1 }
    const ids = (xs: PriorityQueueElement[]) => xs.map((e) => e.id).sort((a, b) => a - b).join(",")
    if (ids(ui.queue) !== ids(model)) bad.add("contents differ from model")
    if (!heapOk(ui.queue, isMax)) bad.add("heap property violated")
    if (op.k !== "clear") {
      const f = frames[frames.length - 1]
      if (!f || f.isError !== err) bad.add("error flag wrong")
      if (!isMax && frames.some((fr) => /highest priority/i.test(fr.description))) bad.add('min-heap caption says "highest priority" for the lowest-priority element')
      for (let i = 0; i < frames.length; i++) {
        const fr = frames[i]
        let method = op.k as string
        let expect: string | string[]
        if (fr.operation === "heapifyUp") { method = "heapifyUp"; expect = "this.swap(index, parentIndex)" }
        else if (fr.operation === "heapifyDown") { method = "heapifyDown"; expect = "this.swap(index, targetIndex)" }
        else if (op.k === "enqueue") expect = i === 0 ? "this.heap.push(element)" : "this.heapifyUp(this.heap.length - 1)"
        else if (op.k === "dequeue") expect = err ? "if (this.isEmpty()) return null" : wasLen === 1 ? "if (this.heap.length === 1)" : i === 0 ? "this.heap[0] = this.heap.pop()" : ["this.heapifyDown(0)", "return root"]
        else expect = "return this.isEmpty() ? null : this.heap[0]"
        if (!lineOk(priorityQueueCode, fr.activeCodeLine, method, expect)) {
          const what = fr.operation !== op.k ? fr.operation : err ? `${op.k} error` : op.k === "dequeue" && wasLen === 1 ? "dequeue last" : `${op.k}${i === 0 ? " first" : " last"} frame`
          bad.add(`highlighted code line wrong (${what}: shows "${priorityQueueCode[fr.activeCodeLine]?.trim()}")`)
        }
      }
    }
    // what the page shows
    const v = ui.view()
    if (ids(v.displayQueue) !== ids(model) || JSON.stringify(v.displayQueue) !== JSON.stringify(ui.queue)) bad.add("visualization shows a stale frame, not the state after the operation")
    // judge the order/labels on the current state (as if the user had stepped to the last frame)
    const sorted = [...ui.queue].sort((a, b) => (isMax ? b.priority - a.priority : a.priority - b.priority))
    const actual = serviceOrder(ui.queue, isMax)
    if (sorted.length && sorted[0].id !== ui.queue[0].id) bad.add('"Next to dequeue" is not the element dequeue removes')
    if (sorted.map((e) => e.id).join(",") !== actual.join(",")) bad.add("displayed queue order (front to end) differs from the actual dequeue order among equal priorities")
    if (sorted.length && sorted[0].priority === 0) bad.add('"Next Priority" statistic shows N/A when the next priority is 0')
  }
  return bad
}

function main(): void {
const r = rng(2024)
const tally = new Tally()
const N = 20000
for (let t = 0; t < N; t++) {
  const isMax = r() < 0.5
  const len = int(r, 1, 30)
  const ops: Op[] = []
  for (let i = 0; i < len; i++) {
    const x = r()
    ops.push(x < 0.6 ? { k: "enqueue", v: int(r, -20, 20), p: int(r, -3, 6) } : x < 0.88 ? { k: "dequeue" } : x < 0.98 ? { k: "peek" } : { k: "clear" })
  }
  for (const d of check(isMax, ops)) tally.add(d, show(isMax, ops))
}
console.log(`priority queue: ${N} random sequences (max/min, length 1-30, values -20..20, priorities -3..6)`)
tally.print(N, "sequences")

}
if (process.argv[1]?.split("\\").join("/").endsWith("/legacy.ts")) main()
