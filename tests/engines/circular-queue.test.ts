import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  CIRCULAR_QUEUE_CODE,
  createCircularQueue,
  dequeue,
  enqueue,
  isValidCircularQueueSize,
  parseIntegerInput,
  peek,
  playbackAfterOperation,
  type CircularQueueResult,
  type CircularQueueState,
  type CircularQueueStep,
} from "@/lib/engines/circular-queue"
import { ArrayModel, EXPECTED_CIRCULAR_LINE, RingPositions, highlightsLine, type CircularFrameKind } from "../reference/circular-queue"

type Op = { k: "enqueue"; v: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 5, arbitrary: fc.integer({ min: -20, max: 20 }).map((v): Op => ({ k: "enqueue", v })) },
  { weight: 4, arbitrary: fc.constant<Op>({ k: "dequeue" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "peek" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "clear" }) },
)
// UI accepts sizes 2..12; long sequences make the pointers wrap many times
const caseArb = fc.tuple(fc.integer({ min: 2, max: 12 }), fc.array(opArb, { minLength: 1, maxLength: 60 }))

const apply = (s: CircularQueueState, op: Exclude<Op, { k: "clear" }>): CircularQueueResult =>
  op.k === "enqueue" ? enqueue(s, op.v) : op.k === "dequeue" ? dequeue(s) : peek(s)

/** logical contents front -> rear following wrap-around */
const read = (q: (number | undefined)[], front: number, n: number) => Array.from({ length: n }, (_, i) => q[(front + i) % q.length])

describe("circular queue engine (model-based against a plain JS array)", { timeout: 20_000 }, () => {
  it("matches the array model after every operation: contents, count, returned value, full/empty messages", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createCircularQueue(n)
        let m = new ArrayModel(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createCircularQueue(n); m = new ArrayModel(n); continue }
          const r = apply(s, op)
          const o = op.k === "enqueue" ? m.enqueue(op.v) : op.k === "dequeue" ? m.dequeue() : m.peek()
          s = r.state
          expect(s.count).toBe(m.items.length)
          expect(read(s.items, Math.max(s.front, 0), s.count)).toEqual(m.items)
          const last = r.steps[r.steps.length - 1]
          expect(last.isError).toBe(o.kind === "error")
          if (o.kind === "error") {
            expect(r.steps).toHaveLength(1)
            expect(last.description).toBe(o.message)
            expect(r.value).toBeUndefined()
          } else expect(r.value).toBe(o.value)
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("front/rear follow a textbook ring buffer (wrap-around, reset to -1 when empty) and captions state them", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createCircularQueue(n)
        let m = new ArrayModel(n)
        const ring = new RingPositions(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createCircularQueue(n); m = new ArrayModel(n); ring.reset(); continue }
          const oldHead = ring.head
          const oldTail = ring.tail
          const r = apply(s, op)
          const o = op.k === "enqueue" ? m.enqueue(op.v) : op.k === "dequeue" ? m.dequeue() : m.peek()
          const want: string[] = []
          if (o.kind === "error") want.push(o.message)
          else if (op.k === "enqueue") {
            ring.pushBack()
            want.push(oldTail === -1 ? "Queue is empty. Setting front and rear to 0." : `Moving rear circularly: (${oldTail} + 1) % ${n} = ${ring.tail}`)
            want.push(`Enqueued ${op.v} at position ${ring.tail}. Queue size: ${ring.length}/${n}`)
          } else if (op.k === "dequeue") {
            ring.popFront()
            want.push(
              ring.length === 0
                ? `Dequeued ${o.value}. Queue is now empty.`
                : `Dequeued ${o.value}. Moving front circularly: (${oldHead} + 1) % ${n} = ${ring.head}. Queue size: ${ring.length}/${n}`,
            )
          } else want.push(`Front element is ${o.value} at position ${ring.head}. Queue size: ${ring.length}/${n}`)
          s = r.state
          expect(r.steps.map((f) => f.description)).toEqual(want)
          expect([s.front, s.rear]).toEqual([ring.head, ring.tail])
          // every element sits in its ring slot and every other slot is empty
          const expected = new Array<number | undefined>(n).fill(undefined)
          m.items.forEach((v, i) => { expected[ring.slotOf(i)] = v })
          expect(s.items).toEqual(expected)
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("every frame is drawable: n slots, pointers in range, the rendered size never exceeds n or loses an element", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createCircularQueue(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createCircularQueue(n); continue }
          const before = s
          const r = apply(s, op)
          for (const f of r.steps) {
            const shownSize = f.front === -1 ? 0 : f.queue.filter((x) => x !== undefined).length // as the component renders it
            const ok =
              f.queue.length === n && f.front >= -1 && f.front < n && f.rear >= -1 && f.rear < n &&
              (f.front === -1) === (f.rear === -1) && shownSize <= n &&
              (shownSize === before.count || shownSize === r.state.count)
            expect(ok).toBe(true)
          }
          const last = r.steps[r.steps.length - 1]
          expect([last.queue, last.front, last.rear]).toEqual([r.state.items, r.state.front, r.state.rear])
          if (last.isError) expect(r.state).toBe(before)
          s = r.state
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("wraps the rear past the end: fill, dequeue k, enqueue k gives a full queue in FIFO order", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 12 }).chain((n) => fc.tuple(fc.constant(n), fc.integer({ min: 1, max: n }))), ([n, k]) => {
        let s = createCircularQueue(n)
        for (let i = 0; i < n; i++) s = enqueue(s, i).state
        expect(enqueue(s, 99).steps[0].description).toBe("Cannot enqueue 99. Queue is full!")
        for (let i = 0; i < k; i++) s = dequeue(s).state
        for (let i = 0; i < k; i++) s = enqueue(s, 100 + i).state
        expect(s.count).toBe(n)
        expect(s.front).toBe(k % n)
        expect(s.rear).toBe(k - 1)
        const order: number[] = []
        while (s.count) { const r = dequeue(s); order.push(r.value as number); s = r.state }
        expect(order).toEqual([...Array.from({ length: n - k }, (_, i) => i + k), ...Array.from({ length: k }, (_, i) => 100 + i)])
        expect(dequeue(s).steps[0].description).toBe("Cannot dequeue from empty queue")
      }),
      { numRuns: 500 },
    )
  })

  it("highlights the pseudocode line that performs each step (guard on error)", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createCircularQueue(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createCircularQueue(n); continue }
          const r = apply(s, op)
          const kinds: CircularFrameKind[] =
            r.steps[0].isError ? [`${op.k}-${op.k === "enqueue" ? "full" : "empty"}` as CircularFrameKind]
            : op.k === "enqueue" ? [s.count === 0 ? "enqueue-first" : "enqueue-move-rear", "enqueue-store"]
            : op.k === "dequeue" ? [r.state.count === 0 ? "dequeue-to-empty" : "dequeue-move-front"]
            : ["peek"]
          expect(r.steps).toHaveLength(kinds.length)
          r.steps.forEach((f, i) => {
            const [method, text] = EXPECTED_CIRCULAR_LINE[kinds[i]]
            expect(highlightsLine(CIRCULAR_QUEUE_CODE, f.activeCodeLine, method, text)).toBe(true)
          })
          s = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("playback starts at the new operation's first frame and ends on the state after it", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createCircularQueue(n)
        let history: CircularQueueStep[] = []
        for (const op of ops) {
          if (op.k === "clear") { s = createCircularQueue(n); history = []; continue }
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

  it("the size control accepts exactly the whole numbers 2..12, and every accepted size builds a queue", () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ min: -3, max: 20 }), fc.double({ min: -3, max: 20, noNaN: true })), (x) => {
        const ok = Number.isInteger(x) && x >= 2 && x <= 12
        expect(isValidCircularQueueSize(x)).toBe(ok)
        if (ok) expect(createCircularQueue(x).items).toHaveLength(x)
      }),
      { numRuns: 3000 },
    )
    expect(isValidCircularQueueSize(2.5)).toBe(false) // crashed the original with RangeError: Invalid array length
    expect(parseIntegerInput("3.7")).toEqual({ error: "Please enter a valid integer" })
  })
})
