// Independent reference for the Deque visualizer: a plain JS array with unshift/push/shift/pop as the deque,
// a ring-position tracker for where a textbook circular-array deque keeps front/rear, the UI's messages,
// and the oracle for highlighted pseudocode lines.

export type DequeOp = "addFront" | "addRear" | "removeFront" | "removeRear" | "peekFront" | "peekRear"
export type Outcome = { kind: "ok"; value?: number } | { kind: "error"; message: string }

export class ArrayDeque {
  items: number[] = []
  constructor(readonly capacity: number) {}
  apply(op: DequeOp, x?: number): Outcome {
    const empty = this.items.length === 0
    switch (op) {
      case "addFront":
        if (this.items.length === this.capacity) return { kind: "error", message: `Cannot add ${x} to front. Deque is full!` }
        this.items.unshift(x as number)
        return { kind: "ok" }
      case "addRear":
        if (this.items.length === this.capacity) return { kind: "error", message: `Cannot add ${x} to rear. Deque is full!` }
        this.items.push(x as number)
        return { kind: "ok" }
      case "removeFront":
        return empty ? { kind: "error", message: "Cannot remove from empty deque" } : { kind: "ok", value: this.items.shift() }
      case "removeRear":
        return empty ? { kind: "error", message: "Cannot remove from empty deque" } : { kind: "ok", value: this.items.pop() }
      case "peekFront":
        return empty ? { kind: "error", message: "Cannot peek empty deque" } : { kind: "ok", value: this.items[0] }
      case "peekRear":
        return empty ? { kind: "error", message: "Cannot peek empty deque" } : { kind: "ok", value: this.items[this.items.length - 1] }
    }
  }
}

/** Physical slots of a circular-array deque with n slots; head = slot of the first element (-1 when empty). */
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
  pushFront(): void {
    this.head = this.length === 0 ? 0 : (this.head - 1 + this.n) % this.n
    this.length++
  }
  pushBack(): void {
    if (this.length === 0) this.head = 0
    this.length++
  }
  popFront(): void {
    this.length--
    this.head = this.length === 0 ? -1 : (this.head + 1) % this.n
  }
  popBack(): void {
    this.length--
    if (this.length === 0) this.head = -1
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

/** Expected statements for the frames of one deque operation, in order. */
export function expectedDequeLines(op: DequeOp, isError: boolean, wasEmpty: boolean, emptyAfter: boolean): (string | string[])[] {
  const end = op.endsWith("Front") ? "front" : "rear"
  if (isError) return [op.startsWith("add") ? "isFull()" : "isEmpty()"]
  if (op.startsWith("add")) {
    const move = end === "front" ? "this.front = (this.front - 1 + this.maxSize) % this.maxSize" : "this.rear = (this.rear + 1) % this.maxSize"
    return [wasEmpty ? "this.front = this.rear = 0" : move, [`this.items[this.${end}] = element`, "this.count++"]]
  }
  if (op.startsWith("remove")) {
    const move = end === "front" ? "this.front = (this.front + 1) % this.maxSize" : "this.rear = (this.rear - 1 + this.maxSize) % this.maxSize"
    return [emptyAfter ? ["if (this.isEmpty()) {", "this.front = this.rear = -1"] : move]
  }
  return [`return this.items[this.${end}]`]
}
