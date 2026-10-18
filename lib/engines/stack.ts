// Operation model for the Stack visualizer.
// Pure functions: each operation takes the current stack state and returns the new state plus the frames the
// visualizer plays for that operation. No React, no randomness.

export interface StackStep {
  stack: number[]
  operation: string
  element?: number
  description: string
  isError: boolean
  activeCodeLine: number
}

export interface StackState {
  items: number[] // bottom -> top
  maxSize: number
}

export interface StackResult {
  state: StackState
  steps: StackStep[]
  /** element returned by pop / peek (undefined on underflow and for push) */
  value?: number
}

export const STACK_MAX_SIZE = 10

// Pseudocode shown next to the animation. It includes the capacity check the UI enforces.
export const STACK_CODE: string[] = [
  "class Stack {",
  "  constructor(maxSize = 10) {",
  "    this.items = [];",
  "    this.top = -1;",
  "    this.maxSize = maxSize;",
  "  }",
  "",
  "  push(element) {",
  "    if (this.isFull()) return false;",
  "    this.top++;",
  "    this.items[this.top] = element;",
  "    return true;",
  "  }",
  "",
  "  pop() {",
  "    if (this.isEmpty()) return null;",
  "    const element = this.items[this.top];",
  "    this.top--;",
  "    return element;",
  "  }",
  "",
  "  peek() {",
  "    if (this.isEmpty()) return null;",
  "    return this.items[this.top];",
  "  }",
  "",
  "  isEmpty() {",
  "    return this.top === -1;",
  "  }",
  "",
  "  isFull() {",
  "    return this.top === this.maxSize - 1;",
  "  }",
  "}",
]

// index of the first line inside `method` that contains `text` (resolved once, at module load)
function lineIn(code: string[], method: string, text: string): number {
  const header = code.findIndex((l) => l.trim().startsWith(method + "("))
  const i = code.findIndex((l, k) => k > header && l.includes(text))
  if (header < 0 || i < 0) throw new Error(`code line not found: ${method} / ${text}`)
  return i
}

const LINE = {
  pushFull: lineIn(STACK_CODE, "push", "if (this.isFull())"),
  pushStore: lineIn(STACK_CODE, "push", "this.items[this.top] = element"),
  popEmpty: lineIn(STACK_CODE, "pop", "if (this.isEmpty())"),
  popDone: lineIn(STACK_CODE, "pop", "this.top--"),
  peekEmpty: lineIn(STACK_CODE, "peek", "if (this.isEmpty())"),
  peekDone: lineIn(STACK_CODE, "peek", "return this.items[this.top]"),
}

export function createStack(maxSize: number = STACK_MAX_SIZE): StackState {
  return { items: [], maxSize }
}

const frame = (
  items: number[],
  operation: string,
  element: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
): StackStep => ({ stack: [...items], operation, element, description, isError, activeCodeLine })

export function push(state: StackState, element: number): StackResult {
  if (state.items.length >= state.maxSize) {
    return {
      state,
      steps: [frame(state.items, "push", element, `Cannot push ${element}. Stack is full (max size: ${state.maxSize})`, true, LINE.pushFull)],
    }
  }
  const items = [...state.items, element]
  return {
    state: { ...state, items },
    steps: [frame(items, "push", element, `Pushed ${element} onto the stack. Stack size: ${items.length}`, false, LINE.pushStore)],
  }
}

export function pop(state: StackState): StackResult {
  if (state.items.length === 0) {
    return { state, steps: [frame(state.items, "pop", undefined, "Cannot pop from empty stack", true, LINE.popEmpty)] }
  }
  const value = state.items[state.items.length - 1]
  const items = state.items.slice(0, -1)
  return {
    state: { ...state, items },
    steps: [frame(items, "pop", value, `Popped ${value} from the stack. Stack size: ${items.length}`, false, LINE.popDone)],
    value,
  }
}

export function peek(state: StackState): StackResult {
  if (state.items.length === 0) {
    return { state, steps: [frame(state.items, "peek", undefined, "Cannot peek empty stack", true, LINE.peekEmpty)] }
  }
  const value = state.items[state.items.length - 1]
  return {
    state,
    steps: [frame(state.items, "peek", value, `Top element is ${value}. Stack size: ${state.items.length}`, false, LINE.peekDone)],
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
  return { value: n === 0 ? 0 : n } // normalise -0
}

/**
 * Where playback goes after an operation appended `added` frames to a history of `previous` frames:
 * show the operation's first frame, and play through it when it has more than one frame.
 */
export function playbackAfterOperation(previous: number, added: number): { index: number; play: boolean } {
  return { index: added > 0 ? previous : Math.max(previous - 1, 0), play: added > 1 }
}
