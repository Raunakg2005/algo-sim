// Independent reference for the Circular Queue visualizer.
// `ArrayModel` is the plain JS array the engine is compared with (contents, capacity, messages);
// `RingPositions` tracks where a textbook ring buffer puts the front/rear indices so captions and pointers
// can be checked. Neither is derived from the engine.

export type Outcome = { kind: "ok"; value?: number } | { kind: "error"; message: string }

export class ArrayModel {
  items: number[] = []
  constructor(readonly capacity: number) {}
  enqueue(x: number): Outcome {
    if (this.items.length === this.capacity) return { kind: "error", message: `Cannot enqueue ${x}. Queue is full!` }
    this.items.push(x)
    return { kind: "ok" }
  }
  dequeue(): Outcome {
    if (this.items.length === 0) return { kind: "error", message: "Cannot dequeue from empty queue" }
    return { kind: "ok", value: this.items.shift() as number }
  }
  peek(): Outcome {
    if (this.items.length === 0) return { kind: "error", message: "Cannot peek empty queue" }
    return { kind: "ok", value: this.items[0] }
  }
}

/** Physical positions in a ring buffer of `n` slots: head = index of the first element, -1 when empty. */
export class RingPositions {
  head = -1
  length = 0
  constructor(readonly n: number) {}
  get tail(): number {
    return this.length === 0 ? -1 : (this.head + this.length - 1) % this.n
  }
  slotOf(i: number): number {
    return (this.head + i) % this.n
  }
  pushBack(): void {
    if (this.length === 0) this.head = 0
    this.length++
  }
  popFront(): void {
    this.length--
    this.head = this.length === 0 ? -1 : (this.head + 1) % this.n
  }
  reset(): void {
    this.head = -1
    this.length = 0
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

export type CircularFrameKind =
  | "enqueue-full" | "enqueue-first" | "enqueue-move-rear" | "enqueue-store"
  | "dequeue-empty" | "dequeue-to-empty" | "dequeue-move-front" | "peek-empty" | "peek"

export const EXPECTED_CIRCULAR_LINE: Record<CircularFrameKind, [string, string | string[]]> = {
  "enqueue-full": ["enqueue", "isFull()"],
  "enqueue-first": ["enqueue", ["this.front = 0", "this.rear = 0"]],
  "enqueue-move-rear": ["enqueue", "this.rear = (this.rear + 1) % this.maxSize"],
  "enqueue-store": ["enqueue", ["this.items[this.rear] = element", "this.count++"]],
  "dequeue-empty": ["dequeue", "if (this.isEmpty()) return null"],
  "dequeue-to-empty": ["dequeue", ["if (this.isEmpty()) {", "this.front = this.rear = -1"]],
  "dequeue-move-front": ["dequeue", "this.front = (this.front + 1) % this.maxSize"],
  "peek-empty": ["peek", "isEmpty()"],
  peek: ["peek", "return this.items[this.front]"],
}
