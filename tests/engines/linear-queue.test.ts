import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  LINEAR_QUEUE_CODE,
  createLinearQueue,
  dequeue,
  enqueue,
  parseIntegerInput,
  parseQueueSize,
  peek,
  playbackAfterOperation,
  type LinearQueueResult,
  type LinearQueueState,
  type QueueStep,
} from "@/lib/engines/linear-queue"
import { ArrayLinearQueue, expectedLinearQueueLine, highlightsLine } from "../reference/linear-queue"

type Op = { k: "enqueue"; v: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 5, arbitrary: fc.integer({ min: -20, max: 20 }).map((v): Op => ({ k: "enqueue", v })) },
  { weight: 3, arbitrary: fc.constant<Op>({ k: "dequeue" }) },
  { weight: 2, arbitrary: fc.constant<Op>({ k: "peek" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "clear" }) },
)
// UI accepts queue sizes 1..20
const caseArb = fc.tuple(fc.integer({ min: 1, max: 20 }), fc.array(opArb, { minLength: 1, maxLength: 45 }))

const apply = (s: LinearQueueState, op: Exclude<Op, { k: "clear" }>): LinearQueueResult =>
  op.k === "enqueue" ? enqueue(s, op.v) : op.k === "dequeue" ? dequeue(s) : peek(s)
const contents = (q: (number | undefined)[], front: number, rear: number) => (front === -1 ? [] : q.slice(front, rear + 1))

describe("linear queue engine (model-based against a plain JS array)", { timeout: 20_000 }, () => {
  it("matches the array model after every operation, including the full/empty messages", () => {
    fc.assert(
      fc.property(caseArb, ([size, ops]) => {
        let s = createLinearQueue(size)
        let m = new ArrayLinearQueue(size)
        for (const op of ops) {
          if (op.k === "clear") { s = createLinearQueue(size); m = new ArrayLinearQueue(size); continue }
          const r = apply(s, op)
          const o = op.k === "enqueue" ? m.enqueue(op.v) : op.k === "dequeue" ? m.dequeue() : m.peek()
          s = r.state
          expect(contents(s.items, s.front, s.rear)).toEqual(m.items)
          expect(s.front).toBe(m.frontIndex)
          expect(s.rear).toBe(m.items.length ? m.used - 1 : -1)
          expect(r.steps.map((f) => f.description)).toEqual(o.descriptions)
          expect(r.steps.map((f) => f.isError)).toEqual(o.descriptions.map(() => o.kind === "error"))
          expect(r.value).toBe(o.kind === "ok" ? o.value : undefined)
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("every frame is consistent: array of the chosen size, pointers in range, values only in front..rear", () => {
    fc.assert(
      fc.property(caseArb, ([size, ops]) => {
        let s = createLinearQueue(size)
        for (const op of ops) {
          if (op.k === "clear") { s = createLinearQueue(size); continue }
          const before = s
          const r = apply(s, op)
          for (const f of r.steps) {
            const inRange = (i: number) => i >= -1 && i < size
            expect(f.queue.length === size && inRange(f.front) && inRange(f.rear) && f.operation === op.k).toBe(true)
          }
          const last = r.steps[r.steps.length - 1]
          expect(last.queue).toEqual(r.state.items)
          expect([last.front, last.rear]).toEqual([r.state.front, r.state.rear])
          // occupied cells are exactly front..rear
          const strays = r.state.items.filter((v, i) => (v !== undefined) !== (r.state.front !== -1 && i >= r.state.front && i <= r.state.rear))
          expect(strays).toEqual([])
          if (last.isError) expect(r.state).toBe(before)
          s = r.state
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("highlights the pseudocode line that performs each step (guard on error)", () => {
    fc.assert(
      fc.property(caseArb, ([size, ops]) => {
        let s = createLinearQueue(size)
        for (const op of ops) {
          if (op.k === "clear") { s = createLinearQueue(size); continue }
          const r = apply(s, op)
          r.steps.forEach((f, i) => {
            const want = expectedLinearQueueLine(op.k, f.isError, i, r.steps.length, r.state.front === -1)
            expect(highlightsLine(LINEAR_QUEUE_CODE, f.activeCodeLine, op.k, want)).toBe(true)
          })
          s = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("playback starts at the new operation's first frame and ends on the state after it", () => {
    fc.assert(
      fc.property(caseArb, ([size, ops]) => {
        let s = createLinearQueue(size)
        let history: QueueStep[] = []
        for (const op of ops) {
          if (op.k === "clear") { s = createLinearQueue(size); history = []; continue }
          const r = apply(s, op)
          const p = playbackAfterOperation(history.length, r.steps.length)
          history = [...history, ...r.steps]
          expect(p.index).toBe(history.length - r.steps.length)
          expect(p.play).toBe(r.steps.length > 1)
          expect(history[history.length - 1].queue).toEqual(r.state.items)
          s = r.state
        }
      }),
      { numRuns: 500 },
    )
  })

  it("size box accepts exactly the integers 1..20; value box accepts exactly integers", () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ min: -5, max: 30 }).map(String), fc.double({ min: -5, max: 30, noNaN: true }).map(String), fc.string({ maxLength: 5 })), (t) => {
        const r = parseQueueSize(t)
        const ok = /^\s*[+-]?\d+\s*$/.test(t) && Number(t) >= 1 && Number(t) <= 20
        expect("value" in r).toBe(ok)
        if ("value" in r) expect(r.value).toBe(Number(t))
      }),
      { numRuns: 3000 },
    )
    expect(parseQueueSize("2.5")).toEqual({ error: "Queue size must be between 1 and 20" })
    expect(parseIntegerInput("3.7")).toEqual({ error: "Please enter a valid integer" })
    expect(parseIntegerInput(" -4 ")).toEqual({ value: -4 })
  })

  it("shows the 'false full' condition of a linear queue", () => {
    let s = createLinearQueue(3)
    for (const v of [1, 2, 3]) s = enqueue(s, v).state
    s = dequeue(s).state
    const r = enqueue(s, 4)
    expect(r.steps[0]).toMatchObject({ isError: true, description: "Cannot enqueue 4. Queue is full!" })
    expect(contents(r.state.items, r.state.front, r.state.rear)).toEqual([2, 3])
  })
})
