import { describe, expect, it } from "vitest"
import fc from "fast-check"
import * as E from "@/lib/engines/circular-linked-list"
import { KIND, checkOperation, uiInteger, type ListOp, type ResultLike } from "../reference/circular-linked-list"

// the operations the UI offers for this list
function apply(s: E.CircularListState, op: ListOp): E.OpResult<E.CircularListState, E.CircularLinkedListStep> {
  switch (op.kind) {
    case "insertBeginning": return E.insertAtBeginning(s, op.value)
    case "insertEnd": return E.insertAtEnd(s, op.value)
    case "insertPosition": return E.insertAtPosition(s, op.value, op.position)
    case "deleteBeginning": return E.deleteFromBeginning(s)
    case "deleteEnd": return E.deleteFromEnd(s)
    case "deletePosition": return E.deleteAtPosition(s, op.position)
    case "search": return E.search(s, op.value)
    case "traverse": return E.traverse(s)
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
  { weight: 2, arbitrary: value.map((v): ListOp => ({ kind: "search", value: v })) },
  { weight: 2, arbitrary: position.map((p): ListOp => ({ kind: "deletePosition", position: p })) },
  { weight: 1, arbitrary: fc.constant<ListOp>({ kind: "traverse" }) },
)

function runSequence(ops: ListOp[]): string[] {
  let s = E.EMPTY_CIRCULAR_LIST
  let model: number[] = []
  for (const op of ops) {
    const frozen = JSON.stringify(s)
    const r = apply(s, op)
    if (JSON.stringify(s) !== frozen) return [`${op.kind} mutated its input state`]
    const c = checkOperation(KIND, E.circularLinkedListCode, s, model, op, r as ResultLike)
    if (c.problems.length) return c.problems
    s = r.state
    model = c.model
  }
  return []
}

describe("circular linked list engine", () => {
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

  it("legacy counterexamples now behave", () => {
    // empty-list delete used to highlight "this.size++;" of insertAtPosition()
    const r = E.deleteFromBeginning(E.EMPTY_CIRCULAR_LIST)
    expect(E.circularLinkedListCode[r.steps[0].activeCodeLine].trim()).toBe("if (!this.head) return null;")
    // deleting the last of two nodes: caption lists the path to the new tail without an empty segment
    const s = E.insertAtEnd(E.insertAtEnd(E.EMPTY_CIRCULAR_LIST, 1).state, 2).state
    const d = E.deleteFromEnd(s)
    expect(d.steps[1].description).toBe("Finding new tail: 1")
    expect(d.state.nodes).toEqual([{ value: 1, next: 1, id: 1 }])
  })
})
