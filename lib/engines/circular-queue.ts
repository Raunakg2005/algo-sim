// Operation model for the Circular Queue visualizer (array-backed ring buffer with an element count).
// Pure functions: each operation returns the new state plus the frames the visualizer plays for it.

export interface CircularQueueStep {
  queue: (number | undefined)[]
  front: number
  rear: number
  operation: string
  element?: number
  description: string
  isError: boolean
  activeCodeLine: number
}

export interface CircularQueueState {
  items: (number | undefined)[] // length === size
  front: number // -1 when empty
  rear: number // -1 when empty
  count: number
  size: number
}

export interface CircularQueueResult {
  state: CircularQueueState
  steps: CircularQueueStep[]
  value?: number
}

export const CIRCULAR_QUEUE_DEFAULT_SIZE = 8
export const CIRCULAR_QUEUE_MIN_SIZE = 2
export const CIRCULAR_QUEUE_MAX_SIZE = 12

export const CIRCULAR_QUEUE_CODE: string[] = [
  "class CircularQueue {",
  "  constructor(size) {",
  "    this.items = new Array(size);",
  "    this.front = -1;",
  "    this.rear = -1;",
  "    this.maxSize = size;",
  "    this.count = 0;",
  "  }",
  "",
  "  enqueue(element) {",
  "    if (this.isFull()) return false;",
  "    if (this.isEmpty()) {",
  "      this.front = 0;",
  "      this.rear = 0;",
  "    } else {",
  "      this.rear = (this.rear + 1) % this.maxSize;",
  "    }",
  "    this.items[this.rear] = element;",
  "    this.count++;",
  "    return true;",
  "  }",
  "",
  "  dequeue() {",
  "    if (this.isEmpty()) return null;",
  "    const element = this.items[this.front];",
  "    this.items[this.front] = undefined;",
  "    this.count--;",
  "    if (this.isEmpty()) {",
  "      this.front = this.rear = -1;",
  "    } else {",
  "      this.front = (this.front + 1) % this.maxSize;",
  "    }",
  "    return element;",
  "  }",
  "",
  "  peek() {",
  "    if (this.isEmpty()) return null;",
  "    return this.items[this.front];",
  "  }",
  "",
  "  isEmpty() {",
  "    return this.count === 0;",
  "  }",
  "",
  "  isFull() {",
  "    return this.count === this.maxSize;",
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
  enqueueFull: lineIn(CIRCULAR_QUEUE_CODE, "enqueue", "if (this.isFull())"),
  enqueueFirst: lineIn(CIRCULAR_QUEUE_CODE, "enqueue", "this.front = 0"),
  enqueueMoveRear: lineIn(CIRCULAR_QUEUE_CODE, "enqueue", "this.rear = (this.rear + 1) % this.maxSize"),
  enqueueStore: lineIn(CIRCULAR_QUEUE_CODE, "enqueue", "this.items[this.rear] = element"),
  dequeueEmpty: lineIn(CIRCULAR_QUEUE_CODE, "dequeue", "if (this.isEmpty()) return null"),
  dequeueReset: lineIn(CIRCULAR_QUEUE_CODE, "dequeue", "this.front = this.rear = -1"),
  dequeueMoveFront: lineIn(CIRCULAR_QUEUE_CODE, "dequeue", "this.front = (this.front + 1) % this.maxSize"),
  peekEmpty: lineIn(CIRCULAR_QUEUE_CODE, "peek", "if (this.isEmpty())"),
  peekDone: lineIn(CIRCULAR_QUEUE_CODE, "peek", "return this.items[this.front]"),
}

/** The size control accepts whole numbers from 2 to 12 (anything else, e.g. 2.5, is ignored). */
export function isValidCircularQueueSize(n: number): boolean {
  return Number.isInteger(n) && n >= CIRCULAR_QUEUE_MIN_SIZE && n <= CIRCULAR_QUEUE_MAX_SIZE
}

export function createCircularQueue(size: number = CIRCULAR_QUEUE_DEFAULT_SIZE): CircularQueueState {
  if (!Number.isInteger(size) || size < 1) throw new RangeError(`invalid queue size ${size}`)
  return { items: new Array<number | undefined>(size).fill(undefined), front: -1, rear: -1, count: 0, size }
}

const frame = (
  s: { items: (number | undefined)[]; front: number; rear: number },
  operation: string,
  element: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
): CircularQueueStep => ({ queue: [...s.items], front: s.front, rear: s.rear, operation, element, description, isError, activeCodeLine })

export function enqueue(state: CircularQueueState, element: number): CircularQueueResult {
  const { size } = state
  if (state.count === size) {
    return { state, steps: [frame(state, "enqueue", element, `Cannot enqueue ${element}. Queue is full!`, true, LINE.enqueueFull)] }
  }
  const steps: CircularQueueStep[] = []
  let front = state.front
  let rear: number
  if (state.count === 0) {
    front = 0
    rear = 0
    steps.push(frame({ items: state.items, front, rear }, "enqueue", element, `Queue is empty. Setting front and rear to 0.`, false, LINE.enqueueFirst))
  } else {
    rear = (state.rear + 1) % size
    steps.push(
      frame({ items: state.items, front, rear }, "enqueue", element, `Moving rear circularly: (${state.rear} + 1) % ${size} = ${rear}`, false, LINE.enqueueMoveRear),
    )
  }
  const items = [...state.items]
  items[rear] = element
  const next: CircularQueueState = { ...state, items, front, rear, count: state.count + 1 }
  steps.push(frame(next, "enqueue", element, `Enqueued ${element} at position ${rear}. Queue size: ${next.count}/${size}`, false, LINE.enqueueStore))
  return { state: next, steps }
}

export function dequeue(state: CircularQueueState): CircularQueueResult {
  const { size } = state
  if (state.count === 0) {
    return { state, steps: [frame(state, "dequeue", undefined, "Cannot dequeue from empty queue", true, LINE.dequeueEmpty)] }
  }
  const value = state.items[state.front] as number
  const items = [...state.items]
  items[state.front] = undefined
  const count = state.count - 1
  if (count === 0) {
    const next: CircularQueueState = { ...state, items, front: -1, rear: -1, count }
    return { state: next, steps: [frame(next, "dequeue", value, `Dequeued ${value}. Queue is now empty.`, false, LINE.dequeueReset)], value }
  }
  const front = (state.front + 1) % size
  const next: CircularQueueState = { ...state, items, front, count }
  return {
    state: next,
    steps: [
      frame(
        next,
        "dequeue",
        value,
        `Dequeued ${value}. Moving front circularly: (${state.front} + 1) % ${size} = ${front}. Queue size: ${count}/${size}`,
        false,
        LINE.dequeueMoveFront,
      ),
    ],
    value,
  }
}

export function peek(state: CircularQueueState): CircularQueueResult {
  if (state.count === 0) {
    return { state, steps: [frame(state, "peek", undefined, "Cannot peek empty queue", true, LINE.peekEmpty)] }
  }
  const value = state.items[state.front] as number
  return {
    state,
    steps: [
      frame(state, "peek", value, `Front element is ${value} at position ${state.front}. Queue size: ${state.count}/${state.size}`, false, LINE.peekDone),
    ],
    value,
  }
}

/** Parses the number typed into the input box. Only whole numbers (safe integers) are accepted. */
export function parseIntegerInput(raw: string): { value: number } | { error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { error: "Please enter a number" }
  if (!/^[+-]?\d+$/.test(trimmed)) return { error: "Please enter a valid integer" }
  const n = Number(trimmed)
  if (!Number.isSafeInteger(n)) return { error: "Please enter a valid integer" }
  return { value: n === 0 ? 0 : n }
}

/** After an operation appended `added` frames to `previous` ones: show its first frame, play if several. */
export function playbackAfterOperation(previous: number, added: number): { index: number; play: boolean } {
  return { index: added > 0 ? previous : Math.max(previous - 1, 0), play: added > 1 }
}
