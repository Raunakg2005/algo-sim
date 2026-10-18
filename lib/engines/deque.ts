// Operation model for the Double-Ended Queue visualizer (circular-array deque with an element count).
// Pure functions: each operation returns the new state plus the frames the visualizer plays for it.

export interface DequeStep {
  deque: (number | undefined)[]
  front: number
  rear: number
  operation: string
  element?: number
  description: string
  isError: boolean
  activeCodeLine: number
}

export interface DequeState {
  items: (number | undefined)[] // length === size
  front: number // -1 when empty
  rear: number // -1 when empty
  count: number
  size: number
}

export interface DequeResult {
  state: DequeState
  steps: DequeStep[]
  value?: number
}

export type DequeOperation = "addFront" | "addRear" | "removeFront" | "removeRear" | "peekFront" | "peekRear"

export const DEQUE_DEFAULT_SIZE = 8
export const DEQUE_MIN_SIZE = 2
export const DEQUE_MAX_SIZE = 12

export const DEQUE_CODE: string[] = [
  "class DoubleEndedQueue {",
  "  constructor(size) {",
  "    this.items = new Array(size);",
  "    this.front = -1;",
  "    this.rear = -1;",
  "    this.maxSize = size;",
  "    this.count = 0;",
  "  }",
  "",
  "  addFront(element) {",
  "    if (this.isFull()) return false;",
  "    if (this.isEmpty()) {",
  "      this.front = this.rear = 0;",
  "    } else {",
  "      this.front = (this.front - 1 + this.maxSize) % this.maxSize;",
  "    }",
  "    this.items[this.front] = element;",
  "    this.count++;",
  "    return true;",
  "  }",
  "",
  "  addRear(element) {",
  "    if (this.isFull()) return false;",
  "    if (this.isEmpty()) {",
  "      this.front = this.rear = 0;",
  "    } else {",
  "      this.rear = (this.rear + 1) % this.maxSize;",
  "    }",
  "    this.items[this.rear] = element;",
  "    this.count++;",
  "    return true;",
  "  }",
  "",
  "  removeFront() {",
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
  "  removeRear() {",
  "    if (this.isEmpty()) return null;",
  "    const element = this.items[this.rear];",
  "    this.items[this.rear] = undefined;",
  "    this.count--;",
  "    if (this.isEmpty()) {",
  "      this.front = this.rear = -1;",
  "    } else {",
  "      this.rear = (this.rear - 1 + this.maxSize) % this.maxSize;",
  "    }",
  "    return element;",
  "  }",
  "",
  "  peekFront() {",
  "    if (this.isEmpty()) return null;",
  "    return this.items[this.front];",
  "  }",
  "",
  "  peekRear() {",
  "    if (this.isEmpty()) return null;",
  "    return this.items[this.rear];",
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
  addFrontFull: lineIn(DEQUE_CODE, "addFront", "if (this.isFull())"),
  addFrontFirst: lineIn(DEQUE_CODE, "addFront", "this.front = this.rear = 0"),
  addFrontMove: lineIn(DEQUE_CODE, "addFront", "this.front = (this.front - 1 + this.maxSize) % this.maxSize"),
  addFrontStore: lineIn(DEQUE_CODE, "addFront", "this.items[this.front] = element"),
  addRearFull: lineIn(DEQUE_CODE, "addRear", "if (this.isFull())"),
  addRearFirst: lineIn(DEQUE_CODE, "addRear", "this.front = this.rear = 0"),
  addRearMove: lineIn(DEQUE_CODE, "addRear", "this.rear = (this.rear + 1) % this.maxSize"),
  addRearStore: lineIn(DEQUE_CODE, "addRear", "this.items[this.rear] = element"),
  removeFrontEmpty: lineIn(DEQUE_CODE, "removeFront", "if (this.isEmpty()) return null"),
  removeFrontReset: lineIn(DEQUE_CODE, "removeFront", "this.front = this.rear = -1"),
  removeFrontMove: lineIn(DEQUE_CODE, "removeFront", "this.front = (this.front + 1) % this.maxSize"),
  removeRearEmpty: lineIn(DEQUE_CODE, "removeRear", "if (this.isEmpty()) return null"),
  removeRearReset: lineIn(DEQUE_CODE, "removeRear", "this.front = this.rear = -1"),
  removeRearMove: lineIn(DEQUE_CODE, "removeRear", "this.rear = (this.rear - 1 + this.maxSize) % this.maxSize"),
  peekFrontEmpty: lineIn(DEQUE_CODE, "peekFront", "if (this.isEmpty())"),
  peekFrontDone: lineIn(DEQUE_CODE, "peekFront", "return this.items[this.front]"),
  peekRearEmpty: lineIn(DEQUE_CODE, "peekRear", "if (this.isEmpty())"),
  peekRearDone: lineIn(DEQUE_CODE, "peekRear", "return this.items[this.rear]"),
}

export function createDeque(size: number = DEQUE_DEFAULT_SIZE): DequeState {
  if (!Number.isInteger(size) || size < 1) throw new RangeError(`invalid deque size ${size}`)
  return { items: new Array<number | undefined>(size).fill(undefined), front: -1, rear: -1, count: 0, size }
}

const frame = (
  s: { items: (number | undefined)[]; front: number; rear: number },
  operation: DequeOperation,
  element: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
): DequeStep => ({ deque: [...s.items], front: s.front, rear: s.rear, operation, element, description, isError, activeCodeLine })

export function addFront(state: DequeState, element: number): DequeResult {
  const { size } = state
  if (state.count === size) {
    return { state, steps: [frame(state, "addFront", element, `Cannot add ${element} to front. Deque is full!`, true, LINE.addFrontFull)] }
  }
  const steps: DequeStep[] = []
  let front: number
  let rear = state.rear
  if (state.count === 0) {
    front = 0
    rear = 0
    steps.push(frame({ items: state.items, front, rear }, "addFront", element, `Deque is empty. Setting front and rear to 0.`, false, LINE.addFrontFirst))
  } else {
    front = (state.front - 1 + size) % size
    steps.push(
      frame(
        { items: state.items, front, rear },
        "addFront",
        element,
        `Moving front circularly: (${state.front} - 1 + ${size}) % ${size} = ${front}`,
        false,
        LINE.addFrontMove,
      ),
    )
  }
  const items = [...state.items]
  items[front] = element
  const next: DequeState = { ...state, items, front, rear, count: state.count + 1 }
  steps.push(frame(next, "addFront", element, `Added ${element} to front at position ${front}. Deque size: ${next.count}/${size}`, false, LINE.addFrontStore))
  return { state: next, steps }
}

export function addRear(state: DequeState, element: number): DequeResult {
  const { size } = state
  if (state.count === size) {
    return { state, steps: [frame(state, "addRear", element, `Cannot add ${element} to rear. Deque is full!`, true, LINE.addRearFull)] }
  }
  const steps: DequeStep[] = []
  let front = state.front
  let rear: number
  if (state.count === 0) {
    front = 0
    rear = 0
    steps.push(frame({ items: state.items, front, rear }, "addRear", element, `Deque is empty. Setting front and rear to 0.`, false, LINE.addRearFirst))
  } else {
    rear = (state.rear + 1) % size
    steps.push(
      frame({ items: state.items, front, rear }, "addRear", element, `Moving rear circularly: (${state.rear} + 1) % ${size} = ${rear}`, false, LINE.addRearMove),
    )
  }
  const items = [...state.items]
  items[rear] = element
  const next: DequeState = { ...state, items, front, rear, count: state.count + 1 }
  steps.push(frame(next, "addRear", element, `Added ${element} to rear at position ${rear}. Deque size: ${next.count}/${size}`, false, LINE.addRearStore))
  return { state: next, steps }
}

export function removeFront(state: DequeState): DequeResult {
  const { size } = state
  if (state.count === 0) {
    return { state, steps: [frame(state, "removeFront", undefined, "Cannot remove from empty deque", true, LINE.removeFrontEmpty)] }
  }
  const value = state.items[state.front] as number
  const items = [...state.items]
  items[state.front] = undefined
  const count = state.count - 1
  if (count === 0) {
    const next: DequeState = { ...state, items, front: -1, rear: -1, count }
    return {
      state: next,
      steps: [frame(next, "removeFront", value, `Removed ${value} from front. Deque is now empty.`, false, LINE.removeFrontReset)],
      value,
    }
  }
  const front = (state.front + 1) % size
  const next: DequeState = { ...state, items, front, count }
  return {
    state: next,
    steps: [
      frame(
        next,
        "removeFront",
        value,
        `Removed ${value} from front. Moving front circularly: (${state.front} + 1) % ${size} = ${front}. Deque size: ${count}/${size}`,
        false,
        LINE.removeFrontMove,
      ),
    ],
    value,
  }
}

export function removeRear(state: DequeState): DequeResult {
  const { size } = state
  if (state.count === 0) {
    return { state, steps: [frame(state, "removeRear", undefined, "Cannot remove from empty deque", true, LINE.removeRearEmpty)] }
  }
  const value = state.items[state.rear] as number
  const items = [...state.items]
  items[state.rear] = undefined
  const count = state.count - 1
  if (count === 0) {
    const next: DequeState = { ...state, items, front: -1, rear: -1, count }
    return {
      state: next,
      steps: [frame(next, "removeRear", value, `Removed ${value} from rear. Deque is now empty.`, false, LINE.removeRearReset)],
      value,
    }
  }
  const rear = (state.rear - 1 + size) % size
  const next: DequeState = { ...state, items, rear, count }
  return {
    state: next,
    steps: [
      frame(
        next,
        "removeRear",
        value,
        `Removed ${value} from rear. Moving rear circularly: (${state.rear} - 1 + ${size}) % ${size} = ${rear}. Deque size: ${count}/${size}`,
        false,
        LINE.removeRearMove,
      ),
    ],
    value,
  }
}

export function peekFront(state: DequeState): DequeResult {
  if (state.count === 0) {
    return { state, steps: [frame(state, "peekFront", undefined, "Cannot peek empty deque", true, LINE.peekFrontEmpty)] }
  }
  const value = state.items[state.front] as number
  return {
    state,
    steps: [
      frame(state, "peekFront", value, `Front element is ${value} at position ${state.front}. Deque size: ${state.count}/${state.size}`, false, LINE.peekFrontDone),
    ],
    value,
  }
}

export function peekRear(state: DequeState): DequeResult {
  if (state.count === 0) {
    return { state, steps: [frame(state, "peekRear", undefined, "Cannot peek empty deque", true, LINE.peekRearEmpty)] }
  }
  const value = state.items[state.rear] as number
  return {
    state,
    steps: [
      frame(state, "peekRear", value, `Rear element is ${value} at position ${state.rear}. Deque size: ${state.count}/${state.size}`, false, LINE.peekRearDone),
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

/** Parses the "Deque size" box: an integer from 2 to 12. */
export function parseDequeSize(raw: string): { value: number } | { error: string } {
  const t = raw.trim()
  const n = /^[+-]?\d+$/.test(t) ? Number(t) : NaN
  if (!Number.isInteger(n) || n < DEQUE_MIN_SIZE || n > DEQUE_MAX_SIZE)
    return { error: `Deque size must be between ${DEQUE_MIN_SIZE} and ${DEQUE_MAX_SIZE}` }
  return { value: n }
}

/** After an operation appended `added` frames to `previous` ones: show its first frame, play if several. */
export function playbackAfterOperation(previous: number, added: number): { index: number; play: boolean } {
  return { index: added > 0 ? previous : Math.max(previous - 1, 0), play: added > 1 }
}
