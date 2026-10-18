// Independent references for the Priority Queue visualizer.
// 1. `best`: brute force over a plain array - which priority must be served next (max or min mode).
// 2. `TextbookHeap`: CLRS-style array binary heap (strict comparison, left child preferred on ties, as in the
//    pseudocode the page displays) that counts swaps, so the engine's heap array and its number of swap frames
//    can be compared exactly.

export interface Item {
  value: number
  priority: number
  id: number
}

/** priority that must be dequeued next from `items` */
export function best(items: Item[], isMax: boolean): number {
  return items.reduce((b, e) => (isMax ? Math.max(b, e.priority) : Math.min(b, e.priority)), isMax ? -Infinity : Infinity)
}

export function isHeap(a: Item[], isMax: boolean): boolean {
  for (let i = 1; i < a.length; i++) {
    const p = a[(i - 1) >> 1].priority
    if (isMax ? a[i].priority > p : a[i].priority < p) return false
  }
  return true
}

export class TextbookHeap {
  a: Item[] = []
  constructor(readonly isMax: boolean) {}
  private higher(i: number, j: number): boolean {
    return this.isMax ? this.a[i].priority > this.a[j].priority : this.a[i].priority < this.a[j].priority
  }
  private exchange(i: number, j: number): void {
    const t = this.a[i]
    this.a[i] = this.a[j]
    this.a[j] = t
  }
  /** returns the number of swaps */
  insert(x: Item): number {
    this.a.push(x)
    let i = this.a.length - 1
    let swaps = 0
    while (i > 0 && this.higher(i, (i - 1) >> 1)) {
      this.exchange(i, (i - 1) >> 1)
      i = (i - 1) >> 1
      swaps++
    }
    return swaps
  }
  /** returns the removed root and the number of swaps */
  extract(): { top: Item; swaps: number } | null {
    if (this.a.length === 0) return null
    const top = this.a[0]
    const last = this.a.pop() as Item
    let swaps = 0
    if (this.a.length > 0) {
      this.a[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < this.a.length && this.higher(l, m)) m = l
        if (r < this.a.length && this.higher(r, m)) m = r
        if (m === i) break
        this.exchange(i, m)
        i = m
        swaps++
      }
    }
    return { top, swaps }
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

/** [method, statement] each kind of frame should highlight */
export const EXPECTED_PQ_LINE: Record<string, [string, string | string[]]> = {
  "enqueue-append": ["enqueue", "this.heap.push(element)"],
  "enqueue-done": ["enqueue", "this.heapifyUp(this.heap.length - 1)"],
  heapifyUp: ["heapifyUp", "this.swap(index, parentIndex)"],
  heapifyDown: ["heapifyDown", "this.swap(index, targetIndex)"],
  "dequeue-empty": ["dequeue", "if (this.isEmpty()) return null"],
  "dequeue-last": ["dequeue", "if (this.heap.length === 1)"],
  "dequeue-move-last": ["dequeue", "this.heap[0] = this.heap.pop()"],
  "dequeue-done": ["dequeue", ["this.heapifyDown(0)", "return root"]],
  peek: ["peek", "return this.isEmpty() ? null : this.heap[0]"],
}
