import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  DEQUE_CODE,
  addFront,
  addRear,
  createDeque,
  parseDequeSize,
  parseIntegerInput,
  peekFront,
  peekRear,
  playbackAfterOperation,
  removeFront,
  removeRear,
  type DequeResult,
  type DequeState,
  type DequeStep,
} from "@/lib/engines/deque"
import { ArrayDeque, RingPositions, expectedDequeLines, highlightsLine, type DequeOp } from "../reference/deque"

type Op = { k: DequeOp; v?: number } | { k: "clear" }
const value = fc.integer({ min: -20, max: 20 })
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 3, arbitrary: value.map((v): Op => ({ k: "addFront", v })) },
  { weight: 3, arbitrary: value.map((v): Op => ({ k: "addRear", v })) },
  { weight: 2, arbitrary: fc.constant<Op>({ k: "removeFront" }) },
  { weight: 2, arbitrary: fc.constant<Op>({ k: "removeRear" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "peekFront" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "peekRear" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "clear" }) },
)
// UI accepts deque sizes 2..12
const caseArb = fc.tuple(fc.integer({ min: 2, max: 12 }), fc.array(opArb, { minLength: 1, maxLength: 60 }))

function apply(s: DequeState, op: { k: DequeOp; v?: number }): DequeResult {
  switch (op.k) {
    case "addFront": return addFront(s, op.v as number)
    case "addRear": return addRear(s, op.v as number)
    case "removeFront": return removeFront(s)
    case "removeRear": return removeRear(s)
    case "peekFront": return peekFront(s)
    case "peekRear": return peekRear(s)
  }
}
const read = (q: (number | undefined)[], front: number, n: number) => Array.from({ length: n }, (_, i) => q[(front + i) % q.length])

describe("deque engine (model-based against a plain JS array)", { timeout: 20_000 }, () => {
  it("matches the array model after every operation: contents, count, returned value, full/empty messages", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createDeque(n)
        let m = new ArrayDeque(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createDeque(n); m = new ArrayDeque(n); continue }
          const r = apply(s, op)
          const o = m.apply(op.k, op.v)
          s = r.state
          expect(s.count).toBe(m.items.length)
          expect(read(s.items, Math.max(s.front, 0), s.count)).toEqual(m.items)
          const last = r.steps[r.steps.length - 1]
          expect(last.isError).toBe(o.kind === "error")
          if (o.kind === "error") {
            expect(r.steps).toHaveLength(1)
            expect(last.description).toBe(o.message)
            expect(r.value).toBeUndefined()
          } else {
            expect(r.value).toBe(o.value)
            if (o.value !== undefined) expect(last.element).toBe(o.value)
          }
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("front/rear follow a textbook circular deque (both directions wrap, reset when empty) and captions state them", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createDeque(n)
        let m = new ArrayDeque(n)
        let ring = new RingPositions(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createDeque(n); m = new ArrayDeque(n); ring = new RingPositions(n); continue }
          const [h0, t0] = [ring.head, ring.tail]
          const r = apply(s, op)
          const o = m.apply(op.k, op.v)
          const want: string[] = []
          if (o.kind === "error") want.push(o.message)
          else if (op.k === "addFront" || op.k === "addRear") {
            const wasEmpty = ring.length === 0
            if (op.k === "addFront") ring.pushFront()
            else ring.pushBack()
            const end = op.k === "addFront" ? "front" : "rear"
            const pos = op.k === "addFront" ? ring.head : ring.tail
            want.push(
              wasEmpty ? "Deque is empty. Setting front and rear to 0."
              : op.k === "addFront" ? `Moving front circularly: (${h0} - 1 + ${n}) % ${n} = ${ring.head}`
              : `Moving rear circularly: (${t0} + 1) % ${n} = ${ring.tail}`,
            )
            want.push(`Added ${op.v} to ${end} at position ${pos}. Deque size: ${ring.length}/${n}`)
          } else if (op.k === "removeFront" || op.k === "removeRear") {
            if (op.k === "removeFront") ring.popFront()
            else ring.popBack()
            const end = op.k === "removeFront" ? "front" : "rear"
            want.push(
              ring.length === 0 ? `Removed ${o.value} from ${end}. Deque is now empty.`
              : op.k === "removeFront"
                ? `Removed ${o.value} from front. Moving front circularly: (${h0} + 1) % ${n} = ${ring.head}. Deque size: ${ring.length}/${n}`
                : `Removed ${o.value} from rear. Moving rear circularly: (${t0} - 1 + ${n}) % ${n} = ${ring.tail}. Deque size: ${ring.length}/${n}`,
            )
          } else if (op.k === "peekFront") want.push(`Front element is ${o.value} at position ${ring.head}. Deque size: ${ring.length}/${n}`)
          else want.push(`Rear element is ${o.value} at position ${ring.tail}. Deque size: ${ring.length}/${n}`)
          s = r.state
          expect(r.steps.map((f) => f.description)).toEqual(want)
          expect([s.front, s.rear]).toEqual([ring.head, ring.tail])
          const expected = new Array<number | undefined>(n).fill(undefined)
          m.items.forEach((v, i) => { expected[ring.slotOf(i)] = v })
          expect(s.items).toEqual(expected)
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("every frame is drawable: n slots, pointers in range, nothing lost, errors leave the state unchanged", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createDeque(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createDeque(n); continue }
          const before = s
          const r = apply(s, op)
          for (const f of r.steps) {
            const shown = f.front === -1 ? 0 : f.deque.filter((x) => x !== undefined).length
            const ok =
              f.deque.length === n && f.front >= -1 && f.front < n && f.rear >= -1 && f.rear < n &&
              (f.front === -1) === (f.rear === -1) && (shown === before.count || shown === r.state.count) && f.operation === op.k
            expect(ok).toBe(true)
          }
          const last = r.steps[r.steps.length - 1]
          expect([last.deque, last.front, last.rear]).toEqual([r.state.items, r.state.front, r.state.rear])
          if (last.isError) expect(r.state).toBe(before)
          s = r.state
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("highlights the pseudocode line that performs each step (guard on error)", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createDeque(n)
        for (const op of ops) {
          if (op.k === "clear") { s = createDeque(n); continue }
          const r = apply(s, op)
          const want = expectedDequeLines(op.k, r.steps[0].isError, s.count === 0, r.state.count === 0)
          expect(r.steps).toHaveLength(want.length)
          r.steps.forEach((f, i) => expect(highlightsLine(DEQUE_CODE, f.activeCodeLine, op.k, want[i])).toBe(true))
          s = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("playback starts at the new operation's first frame and ends on the state after it", () => {
    fc.assert(
      fc.property(caseArb, ([n, ops]) => {
        let s = createDeque(n)
        let history: DequeStep[] = []
        for (const op of ops) {
          if (op.k === "clear") { s = createDeque(n); history = []; continue }
          const r = apply(s, op)
          const p = playbackAfterOperation(history.length, r.steps.length)
          history = [...history, ...r.steps]
          expect(p.index).toBe(history.length - r.steps.length)
          expect(p.play).toBe(r.steps.length > 1)
          expect(history[history.length - 1].deque).toEqual(r.state.items)
          s = r.state
        }
      }),
      { numRuns: 500 },
    )
  })

  it("size box accepts exactly the integers 2..12; value box accepts exactly integers", () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ min: -3, max: 20 }).map(String), fc.double({ min: -3, max: 20, noNaN: true }).map(String), fc.string({ maxLength: 5 })), (t) => {
        const r = parseDequeSize(t)
        const ok = /^\s*[+-]?\d+\s*$/.test(t) && Number(t) >= 2 && Number(t) <= 12
        expect("value" in r).toBe(ok)
        if ("value" in r) expect(r.value).toBe(Number(t))
      }),
      { numRuns: 3000 },
    )
    expect(parseIntegerInput("12abc")).toEqual({ error: "Please enter a valid integer" })
    expect(parseIntegerInput("+7")).toEqual({ value: 7 })
  })
})
