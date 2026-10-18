import { describe, expect, it } from "vitest"
import fc from "fast-check"
import * as E from "@/lib/engines/singly-linked-list"
import { KIND, checkOperation, uiInteger, type ListOp, type ResultLike } from "../reference/singly-linked-list"

// the operations the UI offers for this list
function apply(s: E.SinglyListState, op: ListOp): E.OpResult<E.SinglyListState, E.LinkedListStep> {
  switch (op.kind) {
    case "insertBeginning": return E.insertAtBeginning(s, op.value)
    case "insertEnd": return E.insertAtEnd(s, op.value)
    case "insertPosition": return E.insertAtPosition(s, op.value, op.position)
    case "deleteBeginning": return E.deleteFromBeginning(s)
    case "deleteEnd": return E.deleteFromEnd(s)
    case "deletePosition": return E.deleteAtPosition(s, op.position)
    case "search": return E.search(s, op.value)
    default: throw new Error("operation not offered: " + op.kind)
  }
}

// small value range => many duplicates; positions straddle the valid range
const value = fc.integer({ min: -20, max: 20 })
const position = fc.nat({ max: 12 })
const opArb: fc.Arbitrary<ListOp> = fc.oneof(
  { weight: 3, arbitrary: value.map((v): ListOp => ({ kind: "insertBeginning", value: v })) },
  { weight: 3, arbitrary: value.map((v): ListOp => ({ kind: "insertEnd", value: v })) },
  { weight: 3, arbitrary: fc.tuple(value, position).map(([v, p]): ListOp => ({ kind: "insertPosition", value: v, position: p })) },
  { weight: 1, arbitrary: fc.constant<ListOp>({ kind: "deleteBeginning" }) },
  { weight: 1, arbitrary: fc.constant<ListOp>({ kind: "deleteEnd" }) },
  { weight: 2, arbitrary: position.map((p): ListOp => ({ kind: "deletePosition", position: p })) },
  { weight: 2, arbitrary: value.map((v): ListOp => ({ kind: "search", value: v })) },
)

function runSequence(ops: ListOp[]): string[] {
  let s = E.EMPTY_SINGLY_LIST
  let model: number[] = []
  for (const op of ops) {
    const frozen = JSON.stringify(s)
    const r = apply(s, op)
    if (JSON.stringify(s) !== frozen) return [`${op.kind} mutated its input state`]
    const c = checkOperation(KIND, E.singlyLinkedListCode, s, model, op, r as ResultLike)
    if (c.problems.length) return c.problems
    s = r.state
    model = c.model
  }
  return []
}

describe("singly linked list engine", () => {
  it("model-based: after every random operation the list equals the array model and all invariants hold", () => {
    fc.assert(fc.property(fc.array(opArb, { maxLength: 40 }), (ops) => {
      expect(runSequence(ops)).toEqual([])
    }), { numRuns: 10000 })
  })

  it("value / position boxes accept exactly what parseInt accepts, with the UI's messages", () => {
    const raw = fc.oneof(fc.string({ maxLength: 6 }), fc.integer({ min: -1000, max: 1000 }).map(String), fc.constantFrom("", " ", "abc", "-0", "+7", "3.9", " 12 ", "1e3"))
    fc.assert(fc.property(raw, (t) => {
      const want = uiInteger(t)
      const v = E.parseValueInput(t)
      expect(v.ok ? v.value : null).toEqual(want)
      if (!v.ok) expect(v.error).toBe(t.trim() === "" ? "Please enter a number" : "Please enter a valid number")
      const p = E.parsePositionInput(t)
      expect(p.ok ? p.value : null).toEqual(want !== null && want >= 0 ? want : null)
      if (!p.ok) expect(p.error).toBe(t.trim() === "" ? "Please enter a position" : "Please enter a valid position (≥ 0)")
      const d = E.parseDeletePositionInput(t)
      expect(d.ok ? d.value : null).toEqual(want !== null && want >= 0 ? want : null)
      if (!d.ok) expect(d.error).toBe("Please enter a valid position (0 or greater)")
    }), { numRuns: 3000 })
  })

  it("orderFrom / orderBackFrom terminate and never repeat a node, even on corrupt pointer data", () => {
    const nodes = fc.array(fc.record({ value: value, next: fc.option(fc.integer({ min: 1, max: 8 })), prev: fc.option(fc.integer({ min: 1, max: 8 })) }), { maxLength: 8 })
      .map((a) => a.map((n, i) => ({ ...n, id: i + 1 })))
    fc.assert(fc.property(nodes, fc.option(fc.integer({ min: 1, max: 9 })), (ns, start) => {
      for (const order of [E.orderFrom(ns, start), E.orderBackFrom(ns, start)]) {
        expect(order.length).toBeLessThanOrEqual(ns.length)
        expect(new Set(order.map((n) => n.id)).size).toBe(order.length)
      }
    }), { numRuns: 2000 })
  })

  it("legacy counterexamples now behave", () => {
    // highlighted line used to be a blank line / another method
    const r = E.insertAtPosition(E.EMPTY_SINGLY_LIST, 1, 1)
    expect(E.singlyLinkedListCode[r.steps[0].activeCodeLine].trim()).toBe("throw new Error('Invalid position');")
    // delete at position has its own method in the listing now
    let s = E.insertAtEnd(E.insertAtEnd(E.EMPTY_SINGLY_LIST, 5).state, 6).state
    const d = E.deleteAtPosition(s, 1)
    expect(E.singlyLinkedListCode[d.steps[1].activeCodeLine].trim()).toBe("previous.next = previous.next.next;")
    s = d.state
    const f = E.search(s, 5)
    expect(E.singlyLinkedListCode[f.steps[f.steps.length - 1].activeCodeLine].trim()).toBe("return position;")
  })
})
