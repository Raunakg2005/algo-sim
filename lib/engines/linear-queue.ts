// Operation model for the Linear Queue visualizer (array-backed queue whose slots are not reused until it empties).
// Pure functions: each operation returns the new state plus the frames the visualizer plays for it.

export interface QueueStep {
  queue: (number | undefined)[]
  front: number
  rear: number
  operation: string
  element?: number
  description: string
  isError: boolean
  activeCodeLine: number
}

export interface LinearQueueState {
  items: (number | undefined)[] // length === size
  front: number // -1 when empty
  rear: number // -1 when empty
  size: number
}

export interface LinearQueueResult {
  state: LinearQueueState
  steps: QueueStep[]
  value?: number
}

export const LINEAR_QUEUE_DEFAULT_SIZE = 8
export const LINEAR_QUEUE_MIN_SIZE = 1
export const LINEAR_QUEUE_MAX_SIZE = 20

export const LINEAR_QUEUE_CODE: string[] = [
  "class LinearQueue {",
  "  constructor(size) {",
  "    this.items = new Array(size);",
  "    this.front = -1;",
  "    this.rear = -1;",
  "    this.maxSize = size;",
  "  }",
  "",
  "  enqueue(element) {",
  "    if (this.isFull()) return false;",
  "    if (this.isEmpty()) this.front = 0;",
  "    this.rear++;",
  "    this.items[this.rear] = element;",
  "    return true;",
  "  }",
  "",
  "  dequeue() {",
  "    if (this.isEmpty()) return null;",
  "    const element = this.items[this.front];",
  "    this.items[this.front] = undefined;",
  "    if (this.front === this.rear) {",
  "      this.front = this.rear = -1;",
  "    } else {",
  "      this.front++;",
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
  "    return this.front === -1;",
  "  }",
  "",
  "  isFull() {",
  "    return this.rear === this.maxSize - 1;",
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
  enqueueFull: lineIn(LINEAR_QUEUE_CODE, "enqueue", "if (this.isFull())"),
  enqueueSetFront: lineIn(LINEAR_QUEUE_CODE, "enqueue", "this.front = 0"),
  enqueueStore: lineIn(LINEAR_QUEUE_CODE, "enqueue", "this.items[this.rear] = element"),
  dequeueEmpty: lineIn(LINEAR_QUEUE_CODE, "dequeue", "if (this.isEmpty())"),
  dequeueReset: lineIn(LINEAR_QUEUE_CODE, "dequeue", "this.front = this.rear = -1"),
  dequeueAdvance: lineIn(LINEAR_QUEUE_CODE, "dequeue", "this.front++"),
  peekEmpty: lineIn(LINEAR_QUEUE_CODE, "peek", "if (this.isEmpty())"),
  peekDone: lineIn(LINEAR_QUEUE_CODE, "peek", "return this.items[this.front]"),
}

export function createLinearQueue(size: number = LINEAR_QUEUE_DEFAULT_SIZE): LinearQueueState {
  if (!Number.isInteger(size) || size < 1) throw new RangeError(`invalid queue size ${size}`)
  return { items: new Array<number | undefined>(size).fill(undefined), front: -1, rear: -1, size }
}

const frame = (
  s: { items: (number | undefined)[]; front: number; rear: number },
  operation: string,
  element: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
): QueueStep => ({ queue: [...s.items], front: s.front, rear: s.rear, operation, element, description, isError, activeCodeLine })

export function enqueue(state: LinearQueueState, element: number): LinearQueueResult {
  if (state.rear === state.size - 1) {
    return { state, steps: [frame(state, "enqueue", element, `Cannot enqueue ${element}. Queue is full!`, true, LINE.enqueueFull)] }
  }
  const steps: QueueStep[] = []
  let front = state.front
  if (front === -1) {
    front = 0
    steps.push(frame({ ...state, front }, "enqueue", element, `Queue is empty. Setting front to 0.`, false, LINE.enqueueSetFront))
  }
  const rear = state.rear + 1
  const items = [...state.items]
  items[rear] = element
  const next: LinearQueueState = { ...state, items, front, rear }
  steps.push(
    frame(next, "enqueue", element, `Enqueued ${element} at position ${rear}. Queue size: ${rear - front + 1}`, false, LINE.enqueueStore),
  )
  return { state: next, steps }
}

export function dequeue(state: LinearQueueState): LinearQueueResult {
  if (state.front === -1) {
    return { state, steps: [frame(state, "dequeue", undefined, "Cannot dequeue from empty queue", true, LINE.dequeueEmpty)] }
  }
  const value = state.items[state.front] as number
  const items = [...state.items]
  items[state.front] = undefined
  if (state.front === state.rear) {
    const next: LinearQueueState = { ...state, items, front: -1, rear: -1 }
    return {
      state: next,
      steps: [frame(next, "dequeue", value, `Dequeued ${value}. Queue is now empty.`, false, LINE.dequeueReset)],
      value,
    }
  }
  const front = state.front + 1
  const next: LinearQueueState = { ...state, items, front }
  return {
    state: next,
    steps: [
      frame(
        next,
        "dequeue",
        value,
        `Dequeued ${value}. New front is at position ${front}. Queue size: ${next.rear - front + 1}`,
        false,
        LINE.dequeueAdvance,
      ),
    ],
    value,
  }
}

export function peek(state: LinearQueueState): LinearQueueResult {
  if (state.front === -1) {
    return { state, steps: [frame(state, "peek", undefined, "Cannot peek empty queue", true, LINE.peekEmpty)] }
  }
  const value = state.items[state.front] as number
  return {
    state,
    steps: [
      frame(
        state,
        "peek",
        value,
        `Front element is ${value} at position ${state.front}. Queue size: ${state.rear - state.front + 1}`,
        false,
        LINE.peekDone,
      ),
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

/** Parses the "Queue size" box: an integer from 1 to 20. */
export function parseQueueSize(raw: string): { value: number } | { error: string } {
  const t = raw.trim()
  const n = /^[+-]?\d+$/.test(t) ? Number(t) : NaN
  if (!Number.isInteger(n) || n < LINEAR_QUEUE_MIN_SIZE || n > LINEAR_QUEUE_MAX_SIZE)
    return { error: `Queue size must be between ${LINEAR_QUEUE_MIN_SIZE} and ${LINEAR_QUEUE_MAX_SIZE}` }
  return { value: n }
}

/** After an operation appended `added` frames to `previous` ones: show its first frame, play if several. */
export function playbackAfterOperation(previous: number, added: number): { index: number; play: boolean } {
  return { index: added > 0 ? previous : Math.max(previous - 1, 0), play: added > 1 }
}
