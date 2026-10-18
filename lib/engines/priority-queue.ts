// Operation model for the Priority Queue visualizer (binary heap, max- or min-priority first).
// Pure functions: each operation returns the new state plus the frames the visualizer plays for it.
// Ties: compare() is strict, exactly as in the displayed pseudocode, so equal priorities are not served in
// arrival order (a binary heap is not stable). serviceOrder() gives the order the elements will really leave,
// which is what the visualizer draws from "front" to "end".

export interface PriorityQueueElement {
  value: number
  priority: number
  id: number
}

export interface PriorityQueueStep {
  queue: PriorityQueueElement[] // heap array
  operation: string
  element?: PriorityQueueElement
  description: string
  isError: boolean
  activeCodeLine: number
}

export interface PriorityQueueState {
  heap: PriorityQueueElement[]
  isMaxHeap: boolean
  nextId: number
}

export interface PriorityQueueResult {
  state: PriorityQueueState
  steps: PriorityQueueStep[]
  /** element removed by dequeue / returned by peek */
  value?: PriorityQueueElement
}

export const PRIORITY_QUEUE_CODE: string[] = [
  "class PriorityQueue {",
  "  constructor(isMaxHeap = true) {",
  "    this.heap = [];",
  "    this.isMaxHeap = isMaxHeap;",
  "  }",
  "",
  "  enqueue(value, priority) {",
  "    const element = { value, priority };",
  "    this.heap.push(element);",
  "    this.heapifyUp(this.heap.length - 1);",
  "  }",
  "",
  "  dequeue() {",
  "    if (this.isEmpty()) return null;",
  "    if (this.heap.length === 1) return this.heap.pop();",
  "    ",
  "    const root = this.heap[0];",
  "    this.heap[0] = this.heap.pop();",
  "    this.heapifyDown(0);",
  "    return root;",
  "  }",
  "",
  "  peek() {",
  "    return this.isEmpty() ? null : this.heap[0];",
  "  }",
  "",
  "  heapifyUp(index) {",
  "    if (index === 0) return;",
  "    const parentIndex = Math.floor((index - 1) / 2);",
  "    if (this.compare(index, parentIndex)) {",
  "      this.swap(index, parentIndex);",
  "      this.heapifyUp(parentIndex);",
  "    }",
  "  }",
  "",
  "  heapifyDown(index) {",
  "    const leftChild = 2 * index + 1;",
  "    const rightChild = 2 * index + 2;",
  "    let targetIndex = index;",
  "",
  "    if (leftChild < this.heap.length && ",
  "        this.compare(leftChild, targetIndex)) {",
  "      targetIndex = leftChild;",
  "    }",
  "",
  "    if (rightChild < this.heap.length && ",
  "        this.compare(rightChild, targetIndex)) {",
  "      targetIndex = rightChild;",
  "    }",
  "",
  "    if (targetIndex !== index) {",
  "      this.swap(index, targetIndex);",
  "      this.heapifyDown(targetIndex);",
  "    }",
  "  }",
  "",
  "  compare(i, j) {",
  "    return this.isMaxHeap ? ",
  "      this.heap[i].priority > this.heap[j].priority :",
  "      this.heap[i].priority < this.heap[j].priority;",
  "  }",
  "",
  "  swap(i, j) {",
  "    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];",
  "  }",
  "",
  "  isEmpty() {",
  "    return this.heap.length === 0;",
  "  }",
  "}",
]

function lineIn(code: string[], method: string, text: string): number {
  const header = code.findIndex((l) => l.trim().startsWith(method + "("))
  const i = code.findIndex((l, k) => k > header && l.includes(text))
  if (header < 0 || i < 0) throw new Error(`code line not found: ${method} / ${text}`)
  return i
}

const LINE = {
  enqueuePush: lineIn(PRIORITY_QUEUE_CODE, "enqueue", "this.heap.push(element)"),
  enqueueDone: lineIn(PRIORITY_QUEUE_CODE, "enqueue", "this.heapifyUp(this.heap.length - 1)"),
  dequeueEmpty: lineIn(PRIORITY_QUEUE_CODE, "dequeue", "if (this.isEmpty()) return null"),
  dequeueLast: lineIn(PRIORITY_QUEUE_CODE, "dequeue", "if (this.heap.length === 1)"),
  dequeueMoveLast: lineIn(PRIORITY_QUEUE_CODE, "dequeue", "this.heap[0] = this.heap.pop()"),
  dequeueDone: lineIn(PRIORITY_QUEUE_CODE, "dequeue", "this.heapifyDown(0)"),
  peek: lineIn(PRIORITY_QUEUE_CODE, "peek", "return this.isEmpty() ? null : this.heap[0]"),
  upSwap: lineIn(PRIORITY_QUEUE_CODE, "heapifyUp", "this.swap(index, parentIndex)"),
  downSwap: lineIn(PRIORITY_QUEUE_CODE, "heapifyDown", "this.swap(index, targetIndex)"),
}

export function createPriorityQueue(isMaxHeap: boolean = true): PriorityQueueState {
  return { heap: [], isMaxHeap, nextId: 1 }
}

const frame = (
  heap: PriorityQueueElement[],
  operation: string,
  element: PriorityQueueElement | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
): PriorityQueueStep => ({ queue: [...heap], operation, element, description, isError, activeCodeLine })

// compare(i, j) of the pseudocode: strictly higher (max-heap) or strictly lower (min-heap) priority
const outranks = (isMaxHeap: boolean, a: PriorityQueueElement, b: PriorityQueueElement): boolean =>
  isMaxHeap ? a.priority > b.priority : a.priority < b.priority

function swap(heap: PriorityQueueElement[], i: number, j: number): void {
  const t = heap[i]
  heap[i] = heap[j]
  heap[j] = t
}

/** heapifyUp on `heap` (mutated), recording one frame per swap */
function siftUp(heap: PriorityQueueElement[], start: number, isMaxHeap: boolean, steps: PriorityQueueStep[] | null): void {
  let index = start
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2)
    if (!outranks(isMaxHeap, heap[index], heap[parentIndex])) return
    swap(heap, index, parentIndex)
    steps?.push(frame(heap, "heapifyUp", undefined, `Swapped elements at positions ${index} and ${parentIndex} to maintain heap property`, false, LINE.upSwap))
    index = parentIndex
  }
}

/** heapifyDown on `heap` (mutated), recording one frame per swap */
function siftDown(heap: PriorityQueueElement[], start: number, isMaxHeap: boolean, steps: PriorityQueueStep[] | null): void {
  let index = start
  for (;;) {
    const leftChild = 2 * index + 1
    const rightChild = 2 * index + 2
    let targetIndex = index
    if (leftChild < heap.length && outranks(isMaxHeap, heap[leftChild], heap[targetIndex])) targetIndex = leftChild
    if (rightChild < heap.length && outranks(isMaxHeap, heap[rightChild], heap[targetIndex])) targetIndex = rightChild
    if (targetIndex === index) return
    swap(heap, index, targetIndex)
    steps?.push(frame(heap, "heapifyDown", undefined, `Swapped elements at positions ${index} and ${targetIndex} to maintain heap property`, false, LINE.downSwap))
    index = targetIndex
  }
}

export function enqueue(state: PriorityQueueState, value: number, priority: number): PriorityQueueResult {
  const element: PriorityQueueElement = { value, priority, id: state.nextId }
  const heap = [...state.heap, element]
  const steps: PriorityQueueStep[] = [
    frame(heap, "enqueue", element, `Added element ${value} with priority ${priority} to the end of heap`, false, LINE.enqueuePush),
  ]
  siftUp(heap, heap.length - 1, state.isMaxHeap, steps)
  steps.push(frame(heap, "enqueue", element, `Enqueued element ${value} with priority ${priority}. Heap property maintained.`, false, LINE.enqueueDone))
  return { state: { ...state, heap, nextId: state.nextId + 1 }, steps }
}

const rank = (isMaxHeap: boolean) => (isMaxHeap ? "highest" : "lowest")

export function dequeue(state: PriorityQueueState): PriorityQueueResult {
  if (state.heap.length === 0) {
    return { state, steps: [frame(state.heap, "dequeue", undefined, "Cannot dequeue from empty priority queue", true, LINE.dequeueEmpty)] }
  }
  const root = state.heap[0]
  if (state.heap.length === 1) {
    return {
      state: { ...state, heap: [] },
      steps: [frame([], "dequeue", root, `Dequeued element ${root.value} with priority ${root.priority}. Queue is now empty.`, false, LINE.dequeueLast)],
      value: root,
    }
  }
  const heap = state.heap.slice(0, -1)
  heap[0] = state.heap[state.heap.length - 1]
  const steps: PriorityQueueStep[] = [
    frame(heap, "dequeue", root, `Moved last element to root position and removed the ${rank(state.isMaxHeap)} priority element`, false, LINE.dequeueMoveLast),
  ]
  siftDown(heap, 0, state.isMaxHeap, steps)
  steps.push(frame(heap, "dequeue", root, `Dequeued element ${root.value} with priority ${root.priority}. Heap property restored.`, false, LINE.dequeueDone))
  return { state: { ...state, heap }, steps, value: root }
}

export function peek(state: PriorityQueueState): PriorityQueueResult {
  if (state.heap.length === 0) {
    return { state, steps: [frame(state.heap, "peek", undefined, "Cannot peek empty priority queue", true, LINE.peek)] }
  }
  const top = state.heap[0]
  const Rank = state.isMaxHeap ? "Highest" : "Lowest"
  return {
    state,
    steps: [frame(state.heap, "peek", top, `${Rank} priority element is ${top.value} with priority ${top.priority}`, false, LINE.peek)],
    value: top,
  }
}

/** The order in which repeated dequeues would remove the elements of `heap` (front of the queue first). */
export function serviceOrder(heap: PriorityQueueElement[], isMaxHeap: boolean): PriorityQueueElement[] {
  const h = [...heap]
  const out: PriorityQueueElement[] = []
  while (h.length > 0) {
    out.push(h[0])
    const last = h.pop() as PriorityQueueElement
    if (h.length === 0) break
    h[0] = last
    siftDown(h, 0, isMaxHeap, null)
  }
  return out
}

/** "Next Priority" statistic: the priority of the next element (0 is a real priority, not "N/A"). */
export function nextPriorityLabel(heap: PriorityQueueElement[]): string {
  return heap.length > 0 ? String(heap[0].priority) : "N/A"
}

const INTEGER = /^[+-]?\d+$/

/** Validates the value and priority boxes: both must be whole numbers (safe integers). */
export function parsePriorityQueueInput(
  valueRaw: string,
  priorityRaw: string,
): { value: number; priority: number } | { error: string } {
  const v = valueRaw.trim()
  const p = priorityRaw.trim()
  if (!v || !p) return { error: "Please enter both value and priority" }
  const value = INTEGER.test(v) ? Number(v) : NaN
  const priority = INTEGER.test(p) ? Number(p) : NaN
  if (!Number.isSafeInteger(value) || !Number.isSafeInteger(priority)) return { error: "Please enter valid integers" }
  return { value: value === 0 ? 0 : value, priority: priority === 0 ? 0 : priority }
}

/** After an operation appended `added` frames to `previous` ones: show its first frame, play if several. */
export function playbackAfterOperation(previous: number, added: number): { index: number; play: boolean } {
  return { index: added > 0 ? previous : Math.max(previous - 1, 0), play: added > 1 }
}
