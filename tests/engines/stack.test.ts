import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  STACK_CODE,
  STACK_MAX_SIZE,
  createStack,
  parseIntegerInput,
  peek,
  playbackAfterOperation,
  pop,
  push,
  type StackResult,
  type StackState,
  type StackStep,
} from "@/lib/engines/stack"
import { ArrayStack, expectedStackLine, highlightsLine, referenceParseInteger } from "../reference/stack"

type Op = { k: "push"; v: number } | { k: "pop" } | { k: "peek" } | { k: "clear" }

// pushes are weighted up so the capacity limit is hit often; small values force duplicates, zeros, negatives
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 5, arbitrary: fc.integer({ min: -20, max: 20 }).map((v): Op => ({ k: "push", v })) },
  { weight: 3, arbitrary: fc.constant<Op>({ k: "pop" }) },
  { weight: 2, arbitrary: fc.constant<Op>({ k: "peek" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "clear" }) },
)
const opsArb = fc.array(opArb, { minLength: 1, maxLength: 40 })

describe("stack engine (model-based against a plain JS array)", { timeout: 20_000 }, () => {
  it("matches the array model after every operation, including overflow/underflow messages (UI capacity 10)", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        let state: StackState = createStack()
        let model = new ArrayStack(STACK_MAX_SIZE)
        for (const op of ops) {
          if (op.k === "clear") {
            state = createStack()
            model = new ArrayStack(STACK_MAX_SIZE)
            continue
          }
          const r: StackResult = op.k === "push" ? push(state, op.v) : op.k === "pop" ? pop(state) : peek(state)
          const m = op.k === "push" ? model.push(op.v) : op.k === "pop" ? model.pop() : model.peek()
          state = r.state
          expect(state.items).toEqual(model.items)
          expect(r.steps).toHaveLength(1)
          const f = r.steps[0]
          expect(f.isError).toBe(m.kind === "error")
          expect(f.description).toBe(m.description)
          expect(f.operation).toBe(op.k)
          if (m.kind === "ok" && op.k !== "push") expect(r.value).toBe(m.value)
          if (m.kind === "error") expect(r.value).toBeUndefined()
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("respects any capacity: never holds more than maxSize elements, and errors leave the state unchanged", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), opsArb, (cap, ops) => {
        let state = createStack(cap)
        for (const op of ops) {
          const before = state
          const r = op.k === "push" ? push(state, op.v) : op.k === "pop" ? pop(state) : op.k === "peek" ? peek(state) : null
          if (!r) continue
          for (const f of r.steps) expect(f.stack.length).toBeLessThanOrEqual(cap)
          if (r.steps[0].isError) expect(r.state).toBe(before)
          if (op.k === "push" && before.items.length === cap) expect(r.steps[0].isError).toBe(true)
          state = r.state
          expect(state.items.length).toBeLessThanOrEqual(cap)
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("every frame shows the state after the operation and carries the element it describes", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        let state = createStack()
        for (const op of ops) {
          if (op.k === "clear") { state = createStack(); continue }
          const before = state.items
          const r = op.k === "push" ? push(state, op.v) : op.k === "pop" ? pop(state) : peek(state)
          const f = r.steps[r.steps.length - 1]
          expect(f.stack).toEqual(r.state.items)
          expect(f.stack).not.toBe(r.state.items) // a copy, so later operations cannot rewrite history
          if (op.k === "push") expect(f.element).toBe(op.v)
          else if (!f.isError) expect(f.element).toBe(before[before.length - 1])
          else expect(f.element).toBeUndefined()
          state = r.state
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("highlights the pseudocode line that performs the step (guard on error)", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        let state = createStack()
        for (const op of ops) {
          if (op.k === "clear") { state = createStack(); continue }
          const r = op.k === "push" ? push(state, op.v) : op.k === "pop" ? pop(state) : peek(state)
          for (const f of r.steps) {
            expect(highlightsLine(STACK_CODE, f.activeCodeLine, op.k, expectedStackLine(op.k, f.isError))).toBe(true)
          }
          state = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("playback jumps to the new operation, so the shown frame is the state after it (history replay)", () => {
    fc.assert(
      fc.property(opsArb, (ops) => {
        let state = createStack()
        let history: StackStep[] = []
        for (const op of ops) {
          if (op.k === "clear") { state = createStack(); history = []; continue }
          const r = op.k === "push" ? push(state, op.v) : op.k === "pop" ? pop(state) : peek(state)
          const p = playbackAfterOperation(history.length, r.steps.length)
          history = [...history, ...r.steps]
          expect(p.index).toBe(history.length - r.steps.length)
          // playing from p.index runs to the end of history, whose last frame is the current state
          expect(history[history.length - 1].stack).toEqual(r.state.items)
          expect(p.play).toBe(r.steps.length > 1)
          state = r.state
        }
      }),
      { numRuns: 500 },
    )
  })

  it("parses exactly the integers the reference parser accepts", () => {
    const text = fc.oneof(
      fc.integer({ min: -1e9, max: 1e9 }).map(String),
      fc.double({ noNaN: true }).map(String),
      fc.string({ maxLength: 8 }),
      fc.constantFrom("3.7", "1e3", "12abc", "0x1A", "99999999999999999999", "-0", " 42 ", "", "  ", "+5", "--1"),
    )
    fc.assert(
      fc.property(text, (s) => {
        const got = parseIntegerInput(s)
        const want = referenceParseInteger(s)
        if (want === null) expect("error" in got).toBe(true)
        else expect(got).toEqual({ value: want })
      }),
      { numRuns: 5000 },
    )
    expect(parseIntegerInput("3.7")).toEqual({ error: "Please enter a valid integer" })
    expect(parseIntegerInput("")).toEqual({ error: "Please enter a number" })
  })

  it("rejects the 11th push with the UI's overflow message", () => {
    let s = createStack()
    for (let i = 1; i <= 10; i++) s = push(s, i).state
    const r = push(s, 11)
    expect(r.state.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(r.steps[0]).toMatchObject({ isError: true, description: "Cannot push 11. Stack is full (max size: 10)" })
  })
})
