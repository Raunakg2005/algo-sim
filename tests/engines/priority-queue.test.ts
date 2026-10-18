import { describe, expect, it } from "vitest"
import fc from "fast-check"
import {
  PRIORITY_QUEUE_CODE,
  createPriorityQueue,
  dequeue,
  enqueue,
  nextPriorityLabel,
  parsePriorityQueueInput,
  peek,
  playbackAfterOperation,
  serviceOrder,
  type PriorityQueueElement,
  type PriorityQueueResult,
  type PriorityQueueState,
  type PriorityQueueStep,
} from "@/lib/engines/priority-queue"
import { EXPECTED_PQ_LINE, TextbookHeap, best, highlightsLine, isHeap, type Item } from "../reference/priority-queue"

type Op = { k: "enqueue"; v: number; p: number } | { k: "dequeue" } | { k: "peek" } | { k: "clear" }
// narrow priority range => many ties; values may repeat, be zero or negative
const opArb: fc.Arbitrary<Op> = fc.oneof(
  { weight: 6, arbitrary: fc.tuple(fc.integer({ min: -20, max: 20 }), fc.integer({ min: -3, max: 6 })).map(([v, p]): Op => ({ k: "enqueue", v, p })) },
  { weight: 3, arbitrary: fc.constant<Op>({ k: "dequeue" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "peek" }) },
  { weight: 1, arbitrary: fc.constant<Op>({ k: "clear" }) },
)
const caseArb = fc.tuple(fc.boolean(), fc.array(opArb, { minLength: 1, maxLength: 40 }))

const apply = (s: PriorityQueueState, op: Exclude<Op, { k: "clear" }>): PriorityQueueResult =>
  op.k === "enqueue" ? enqueue(s, op.v, op.p) : op.k === "dequeue" ? dequeue(s) : peek(s)
const ids = (xs: { id: number }[]) => xs.map((e) => e.id)
const idSet = (xs: { id: number }[]) => ids(xs).sort((a, b) => a - b)

describe("priority queue engine (model-based against a plain array and a textbook heap)", { timeout: 20_000 }, () => {
  it("serves the max (Max Heap) or min (Min Heap) priority first, as the page states, and keeps exactly the model's elements", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        let model: Item[] = []
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); model = []; continue }
          const r = apply(s, op)
          const last = r.steps[r.steps.length - 1]
          if (op.k === "enqueue") {
            model.push({ value: op.v, priority: op.p, id: s.nextId })
            expect(last.isError).toBe(false)
          } else if (model.length === 0) {
            expect(last.isError).toBe(true)
            expect(last.description).toBe(op.k === "dequeue" ? "Cannot dequeue from empty priority queue" : "Cannot peek empty priority queue")
            expect(r.value).toBeUndefined()
          } else {
            expect(r.value?.priority).toBe(best(model, isMax))
            if (op.k === "dequeue") model = model.filter((e) => e.id !== r.value?.id)
          }
          s = r.state
          expect(idSet(s.heap)).toEqual(idSet(model))
          expect(isHeap(s.heap, isMax)).toBe(true)
        }
      }),
      { numRuns: 3000 },
    )
  })

  it("heap array and number of swap frames equal a textbook binary heap after every operation", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        let ref = new TextbookHeap(isMax)
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); ref = new TextbookHeap(isMax); continue }
          const r = apply(s, op)
          const swapFrames = r.steps.filter((f) => f.operation === "heapifyUp" || f.operation === "heapifyDown").length
          if (op.k === "enqueue") expect(swapFrames).toBe(ref.insert({ value: op.v, priority: op.p, id: s.nextId }))
          else if (op.k === "dequeue") {
            const x = ref.extract()
            expect(r.value?.id).toBe(x?.top.id)
            expect(swapFrames).toBe(x?.swaps ?? 0)
          }
          s = r.state
          expect(ids(s.heap)).toEqual(ids(ref.a))
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("every frame is consistent: no element lost, each swap frame swaps exactly the two positions it names, final frame is a heap", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); continue }
          const r = apply(s, op)
          const after = idSet(r.state.heap)
          let prev: PriorityQueueElement[] | null = null
          for (const f of r.steps) {
            expect(idSet(f.queue)).toEqual(f.isError ? idSet(s.heap) : after)
            const m = /Swapped elements at positions (\d+) and (\d+)/.exec(f.description)
            if (m && prev) {
              const [i, j] = [Number(m[1]), Number(m[2])]
              if (f.operation === "heapifyUp") expect(j).toBe(Math.floor((i - 1) / 2))
              else expect([2 * i + 1, 2 * i + 2]).toContain(j)
              const expected = [...prev]
              ;[expected[i], expected[j]] = [expected[j], expected[i]]
              expect(ids(f.queue)).toEqual(ids(expected))
            }
            prev = f.queue
          }
          const last = r.steps[r.steps.length - 1]
          expect(ids(last.queue)).toEqual(ids(r.state.heap))
          expect(isHeap(last.queue, isMax)).toBe(true)
          s = r.state
        }
      }),
      { numRuns: 2000 },
    )
  })

  it("captions name the right end of the order: never 'highest' in Min Heap mode, never 'lowest' in Max Heap mode", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); continue }
          const r = apply(s, op)
          for (const f of r.steps) expect(new RegExp(isMax ? "lowest" : "highest", "i").test(f.description)).toBe(false)
          if (op.k === "peek" && r.value) expect(r.steps[0].description.startsWith(isMax ? "Highest" : "Lowest")).toBe(true)
          s = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("the drawn queue order (front to end) is exactly the order dequeue removes elements, ties included", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); continue }
          s = apply(s, op).state
          const shown = serviceOrder(s.heap, isMax)
          // drain a copy with the engine's own dequeue, and with the textbook heap
          const drained: number[] = []
          let t = s
          while (t.heap.length) { const r = dequeue(t); drained.push(r.value!.id); t = r.state }
          const ref = new TextbookHeap(isMax)
          ref.a = [...s.heap]
          const refOrder: number[] = []
          for (let x = ref.extract(); x; x = ref.extract()) refOrder.push(x.top.id)
          expect(ids(shown)).toEqual(drained)
          expect(ids(shown)).toEqual(refOrder)
          for (let i = 1; i < shown.length; i++) expect(isMax ? shown[i - 1].priority >= shown[i].priority : shown[i - 1].priority <= shown[i].priority).toBe(true)
          if (shown.length) expect(shown[0].id).toBe(s.heap[0].id) // "Next to dequeue"
          expect(nextPriorityLabel(s.heap)).toBe(s.heap.length ? String(s.heap[0].priority) : "N/A")
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("highlights the pseudocode line that performs each step", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); continue }
          const r = apply(s, op)
          r.steps.forEach((f: PriorityQueueStep, i) => {
            const n = r.steps.length
            const kind =
              f.operation === "heapifyUp" || f.operation === "heapifyDown" ? f.operation
              : op.k === "enqueue" ? (i === 0 ? "enqueue-append" : "enqueue-done")
              : op.k === "dequeue" ? (f.isError ? "dequeue-empty" : s.heap.length === 1 ? "dequeue-last" : i === 0 ? "dequeue-move-last" : i === n - 1 ? "dequeue-done" : "?")
              : "peek"
            const [method, text] = EXPECTED_PQ_LINE[kind]
            expect(highlightsLine(PRIORITY_QUEUE_CODE, f.activeCodeLine, method, text)).toBe(true)
          })
          s = r.state
        }
      }),
      { numRuns: 1000 },
    )
  })

  it("playback starts at the new operation's first frame and ends on the state after it", () => {
    fc.assert(
      fc.property(caseArb, ([isMax, ops]) => {
        let s = createPriorityQueue(isMax)
        let history: PriorityQueueStep[] = []
        for (const op of ops) {
          if (op.k === "clear") { s = createPriorityQueue(isMax); history = []; continue }
          const r = apply(s, op)
          const p = playbackAfterOperation(history.length, r.steps.length)
          history = [...history, ...r.steps]
          expect(p.index).toBe(history.length - r.steps.length)
          expect(p.play).toBe(r.steps.length > 1)
          expect(ids(history[history.length - 1].queue)).toEqual(ids(r.state.heap))
          s = r.state
        }
      }),
      { numRuns: 500 },
    )
  })

  it("input validation accepts exactly pairs of integers", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e6, max: 1e6 }), fc.integer({ min: -1e6, max: 1e6 }), (v, p) => {
        expect(parsePriorityQueueInput(` ${v}`, `${p} `)).toEqual({ value: v, priority: p })
      }),
      { numRuns: 1000 },
    )
    expect(parsePriorityQueueInput("5", "")).toEqual({ error: "Please enter both value and priority" })
    expect(parsePriorityQueueInput("5", "2.5")).toEqual({ error: "Please enter valid integers" })
    expect(parsePriorityQueueInput("1e3", "1")).toEqual({ error: "Please enter valid integers" })
  })

  it("documents tie behaviour: a binary heap does not serve equal priorities in arrival order", () => {
    let s = createPriorityQueue(false)
    for (const [v, p] of [[12, 1], [-4, -2], [17, 1]] as const) s = enqueue(s, v, p).state
    const first = dequeue(s)
    const second = dequeue(first.state)
    expect([first.value?.value, second.value?.value]).toEqual([-4, 17]) // 17 (arrived 3rd) before 12 (arrived 1st)
    expect(serviceOrder(s.heap, false).map((e) => e.value)).toEqual([-4, 17, 12]) // and the page now draws it that way
    expect(nextPriorityLabel(enqueue(createPriorityQueue(true), 7, 0).state.heap)).toBe("0") // was "N/A"
  })
})
