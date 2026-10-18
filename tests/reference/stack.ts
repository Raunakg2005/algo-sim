// Independent reference for the Stack visualizer: a plain JS array used as a bounded stack, plus the
// UI's overflow / underflow messages, and an oracle for which pseudocode line a frame should highlight.

export type StackOutcome =
  | { kind: "ok"; value?: number; description: string }
  | { kind: "error"; description: string }

export class ArrayStack {
  items: number[] = []
  constructor(readonly capacity: number) {}

  push(x: number): StackOutcome {
    if (this.items.length === this.capacity)
      return { kind: "error", description: `Cannot push ${x}. Stack is full (max size: ${this.capacity})` }
    this.items.push(x)
    return { kind: "ok", description: `Pushed ${x} onto the stack. Stack size: ${this.items.length}` }
  }

  pop(): StackOutcome {
    if (this.items.length === 0) return { kind: "error", description: "Cannot pop from empty stack" }
    const v = this.items.pop() as number
    return { kind: "ok", value: v, description: `Popped ${v} from the stack. Stack size: ${this.items.length}` }
  }

  peek(): StackOutcome {
    if (this.items.length === 0) return { kind: "error", description: "Cannot peek empty stack" }
    const v = this.items[this.items.length - 1]
    return { kind: "ok", value: v, description: `Top element is ${v}. Stack size: ${this.items.length}` }
  }
}

/** True when line `idx` of `code` lies inside method `method` and contains one of `expect`. */
export function highlightsLine(code: string[], idx: number, method: string, expect: string | string[]): boolean {
  const want = Array.isArray(expect) ? expect : [expect]
  const header = code.findIndex((l) => l.trim().startsWith(method + "("))
  if (header < 0) return false
  let end = header + 1
  while (end < code.length && code[end] !== "  }") end++
  return idx > header && idx < end && want.some((w) => code[idx].includes(w))
}

/** What line each stack frame should highlight: the guard on error, otherwise the statement that does the work. */
export function expectedStackLine(op: "push" | "pop" | "peek", isError: boolean): string | string[] {
  if (isError) return op === "push" ? "isFull()" : "isEmpty()"
  if (op === "push") return ["this.top++", "this.items[this.top] = element"]
  if (op === "pop") return ["const element = this.items[this.top]", "this.top--", "return element"]
  return "return this.items[this.top]"
}

/** Reference integer parser: accepts optional sign + decimal digits that fit a safe integer. */
export function referenceParseInteger(raw: string): number | null {
  const t = raw.trim()
  if (t === "" || !/^[+-]?[0-9]+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n + 0 : null
}
