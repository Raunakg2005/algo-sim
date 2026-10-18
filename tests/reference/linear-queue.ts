// Independent reference for the Linear Queue visualizer: a plain JS array holding the queue contents plus a
// counter of array slots consumed since the queue was last empty (a linear queue never reuses a slot until it
// empties, so it reports "full" once `size` slots have been consumed - the UI's "false full" condition).

export type QueueOutcome =
  | { kind: "ok"; value?: number; descriptions: string[] }
  | { kind: "error"; descriptions: string[] }

export class ArrayLinearQueue {
  items: number[] = []
  used = 0 // slots consumed; the next element goes to slot `used`
  constructor(readonly size: number) {}

  /** array index of the first element */
  get frontIndex(): number {
    return this.items.length === 0 ? -1 : this.used - this.items.length
  }

  enqueue(x: number): QueueOutcome {
    if (this.used === this.size) return { kind: "error", descriptions: [`Cannot enqueue ${x}. Queue is full!`] }
    const descriptions: string[] = []
    if (this.items.length === 0) descriptions.push("Queue is empty. Setting front to 0.")
    this.items.push(x)
    this.used++
    descriptions.push(`Enqueued ${x} at position ${this.used - 1}. Queue size: ${this.items.length}`)
    return { kind: "ok", descriptions }
  }

  dequeue(): QueueOutcome {
    if (this.items.length === 0) return { kind: "error", descriptions: ["Cannot dequeue from empty queue"] }
    const v = this.items.shift() as number
    if (this.items.length === 0) {
      this.used = 0
      return { kind: "ok", value: v, descriptions: [`Dequeued ${v}. Queue is now empty.`] }
    }
    return {
      kind: "ok",
      value: v,
      descriptions: [`Dequeued ${v}. New front is at position ${this.frontIndex}. Queue size: ${this.items.length}`],
    }
  }

  peek(): QueueOutcome {
    if (this.items.length === 0) return { kind: "error", descriptions: ["Cannot peek empty queue"] }
    return {
      kind: "ok",
      value: this.items[0],
      descriptions: [`Front element is ${this.items[0]} at position ${this.frontIndex}. Queue size: ${this.items.length}`],
    }
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

/** Expected highlighted statement for frame `i` of an operation. */
export function expectedLinearQueueLine(
  op: "enqueue" | "dequeue" | "peek",
  isError: boolean,
  frameIndex: number,
  frameCount: number,
  emptyAfter: boolean,
): string | string[] {
  if (isError) return op === "enqueue" ? "isFull()" : "isEmpty()"
  if (op === "enqueue")
    return frameCount === 2 && frameIndex === 0 ? "this.front = 0" : ["this.rear++", "this.items[this.rear] = element"]
  if (op === "dequeue") return emptyAfter ? ["if (this.front === this.rear)", "this.front = this.rear = -1"] : "this.front++"
  return "return this.items[this.front]"
}
