// Operation model for the Circular (singly) Linked List visualizer (pure; see singly-linked-list.ts).
// Invariant of every resulting state: empty, or following `next` from head visits every node once and
// the tail's `next` is the head. Node ids are positive integers from `state.nextId` (starting at 1).
import { codeLineFinder, orderFrom, type OpResult } from "./singly-linked-list"

export type { OpResult } from "./singly-linked-list"

export { parseValueInput, parsePositionInput, parseDeletePositionInput, orderFrom } from "./singly-linked-list"

export interface CircularListNode {
  value: number
  next: number | null
  id: number
}

export interface CircularLinkedListStep {
  nodes: CircularListNode[]
  head: number | null
  tail: number | null
  operation: string
  element?: number
  position?: number
  description: string
  isError: boolean
  activeCodeLine: number
  highlightedNodes?: number[]
}

export interface CircularListState {
  nodes: CircularListNode[]
  head: number | null
  tail: number | null
  nextId: number
}

export const EMPTY_CIRCULAR_LIST: CircularListState = { nodes: [], head: null, tail: null, nextId: 1 }

export const circularLinkedListCode: readonly string[] = [
  "class CircularNode {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "  }",
  "}",
  "",
  "class CircularLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.tail = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new CircularNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "      newNode.next = newNode; // Points to itself",
  "    } else {",
  "      newNode.next = this.head;",
  "      this.tail.next = newNode;",
  "      this.head = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new CircularNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "      newNode.next = newNode; // Points to itself",
  "    } else {",
  "      newNode.next = this.head;",
  "      this.tail.next = newNode;",
  "      this.tail = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at position",
  "  insertAtPosition(data, position) {",
  "    if (position < 0 || position > this.size) {",
  "      throw new Error('Invalid position');",
  "    }",
  "    if (position === 0) {",
  "      this.insertAtBeginning(data);",
  "      return;",
  "    }",
  "    if (position === this.size) {",
  "      this.insertAtEnd(data);",
  "      return;",
  "    }",
  "    const newNode = new CircularNode(data);",
  "    let current = this.head;",
  "    for (let i = 0; i < position - 1; i++) {",
  "      current = current.next;",
  "    }",
  "    newNode.next = current.next;",
  "    current.next = newNode;",
  "    this.size++;",
  "  }",
  "",
  "  // Delete from beginning",
  "  deleteFromBeginning() {",
  "    if (!this.head) return null;",
  "    const deletedData = this.head.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      this.tail.next = this.head.next;",
  "      this.head = this.head.next;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.head) return null;",
  "    const deletedData = this.tail.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      let current = this.head;",
  "      while (current.next !== this.tail) {",
  "        current = current.next;",
  "      }",
  "      current.next = this.head;",
  "      this.tail = current;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete at position",
  "  deleteAtPosition(position) {",
  "    if (position < 0 || position >= this.size) {",
  "      throw new Error('Invalid position');",
  "    }",
  "    if (position === 0) return this.deleteFromBeginning();",
  "    if (position === this.size - 1) return this.deleteFromEnd();",
  "    let previous = this.head;",
  "    for (let i = 0; i < position - 1; i++) {",
  "      previous = previous.next;",
  "    }",
  "    const deletedData = previous.next.data;",
  "    previous.next = previous.next.next;",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Search for element",
  "  search(data) {",
  "    if (!this.head) return -1;",
  "    let current = this.head;",
  "    let position = 0;",
  "    do {",
  "      if (current.data === data) {",
  "        return position;",
  "      }",
  "      current = current.next;",
  "      position++;",
  "    } while (current !== this.head);",
  "    return -1;",
  "  }",
  "",
  "  // Display list",
  "  display() {",
  "    if (!this.head) return [];",
  "    const elements = [];",
  "    let current = this.head;",
  "    do {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    } while (current !== this.head);",
  "    return elements;",
  "  }",
  "}",
]

const L = codeLineFinder(circularLinkedListCode)
const LINE = {
  insB: {
    empty: L("insertAtBeginning", "if (!this.head) {"),
    self: L("insertAtBeginning", "newNode.next = newNode; // Points to itself"),
    link: L("insertAtBeginning", "this.tail.next = newNode;"),
    head: L("insertAtBeginning", "this.head = newNode;"),
  },
  insE: {
    empty: L("insertAtEnd", "if (!this.head) {"),
    self: L("insertAtEnd", "newNode.next = newNode; // Points to itself"),
    link: L("insertAtEnd", "this.tail.next = newNode;"),
    tail: L("insertAtEnd", "this.tail = newNode;"),
  },
  insP: {
    invalid: L("insertAtPosition", "throw new Error('Invalid position');"),
    walk: L("insertAtPosition", "for (let i = 0; i < position - 1; i++) {"),
    link: L("insertAtPosition", "current.next = newNode;"),
  },
  delB: {
    empty: L("deleteFromBeginning", "if (!this.head) return null;"),
    read: L("deleteFromBeginning", "const deletedData = this.head.data;"),
    clear: L("deleteFromBeginning", "this.head = this.tail = null;"),
    unlink: L("deleteFromBeginning", "this.head = this.head.next;"),
  },
  delE: {
    empty: L("deleteFromEnd", "if (!this.head) return null;"),
    read: L("deleteFromEnd", "const deletedData = this.tail.data;"),
    clear: L("deleteFromEnd", "this.head = this.tail = null;"),
    walk: L("deleteFromEnd", "while (current.next !== this.tail) {"),
    unlink: L("deleteFromEnd", "this.tail = current;"),
  },
  delP: {
    invalid: L("deleteAtPosition", "throw new Error('Invalid position');"),
    walk: L("deleteAtPosition", "for (let i = 0; i < position - 1; i++) {"),
    unlink: L("deleteAtPosition", "previous.next = previous.next.next;"),
  },
  search: {
    empty: L("search", "if (!this.head) return -1;"),
    check: L("search", "if (current.data === data) {"),
    found: L("search", "return position;"),
    missing: L("search", "return -1;"),
  },
  trav: { empty: L("display", "if (!this.head) return [];"), visit: L("display", "elements.push(current.data);"), done: L("display", "return elements;") },
}

type Node = CircularListNode
type Step = CircularLinkedListStep
type State = CircularListState
type Result = OpResult<State, Step>

const frame = (
  nodes: Node[],
  head: number | null,
  tail: number | null,
  operation: string,
  element: number | undefined,
  position: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
  highlightedNodes: number[],
): Step => ({
  nodes: nodes.map((n) => ({ ...n })),
  head,
  tail,
  operation,
  element,
  position,
  description,
  isError,
  activeCodeLine,
  highlightedNodes: [...highlightedNodes],
})

const setNext = (nodes: Node[], id: number, next: number | null): Node[] => nodes.map((n) => (n.id === id ? { ...n, next } : n))

export function circularSize(state: State): number {
  return orderFrom(state.nodes, state.head).length
}

function insertEdge(state: State, value: number, atEnd: boolean): Result {
  const op = atEnd ? "insertEnd" : "insertBeginning"
  const lines = atEnd ? LINE.insE : LINE.insB
  const id = state.nextId
  const { head, tail } = state
  if (head === null || tail === null) {
    const nodes = [...state.nodes, { value, next: id, id }]
    const steps = [
      frame(nodes, null, null, op, value, undefined, "List is empty, creating first node", false, lines.empty, []),
      frame(nodes, id, id, op, value, undefined, `Inserted ${value} as first node. Node points to itself to form circular structure`, false, lines.self, [id]),
    ]
    return { state: { nodes, head: id, tail: id, nextId: id + 1 }, steps, ok: true }
  }
  const nodes = setNext([...state.nodes, { value, next: head, id }], tail, id)
  const newHead = atEnd ? head : id
  const newTail = atEnd ? id : tail
  const done = atEnd
    ? `Inserted ${value} at end. New tail points to head to maintain circular structure`
    : `Inserted ${value} at beginning. Tail now points to new head to maintain circular structure`
  const steps = [
    frame(nodes, head, tail, op, value, undefined, "Creating new node and updating circular links", false, lines.link, []),
    frame(nodes, newHead, newTail, op, value, undefined, done, false, atEnd ? LINE.insE.tail : LINE.insB.head, [id]),
  ]
  return { state: { nodes, head: newHead, tail: newTail, nextId: id + 1 }, steps, ok: true }
}

export const insertAtBeginning = (state: State, value: number): Result => insertEdge(state, value, false)
export const insertAtEnd = (state: State, value: number): Result => insertEdge(state, value, true)

export function insertAtPosition(state: State, value: number, position: number): Result {
  const order = orderFrom(state.nodes, state.head)
  const size = order.length
  if (position < 0 || position > size) {
    const steps = [frame(state.nodes, state.head, state.tail, "insertPosition", value, position, `Invalid position ${position}. List size is ${size}`, true, LINE.insP.invalid, [])]
    return { state, steps, ok: false }
  }
  if (position === 0) return insertAtBeginning(state, value)
  if (position === size) return insertAtEnd(state, value)
  const id = state.nextId
  const before = order[position - 1]
  const path = order.slice(0, position).map((n) => n.id) // nodes 0 .. position-1
  const nodes = setNext([...state.nodes, { value, next: before.next, id }], before.id, id)
  const steps = [
    frame(state.nodes, state.head, state.tail, "insertPosition", value, position, `Traversing to position ${position - 1}: ${path.join(" → ")}`, false, LINE.insP.walk, path),
    frame(nodes, state.head, state.tail, "insertPosition", value, position, `Inserted ${value} at position ${position}`, false, LINE.insP.link, [id]),
  ]
  return { state: { nodes, head: state.head, tail: state.tail, nextId: id + 1 }, steps, ok: true }
}

export function deleteFromBeginning(state: State): Result {
  const { head, tail } = state
  const order = orderFrom(state.nodes, head)
  if (head === null || tail === null || order.length === 0) {
    return { state, steps: [frame(state.nodes, head, tail, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, LINE.delB.empty, [])], ok: false }
  }
  const v = order[0].value
  const steps = [frame(state.nodes, head, tail, "deleteBeginning", v, undefined, `Deleting head node with value ${v}`, false, LINE.delB.read, [head])]
  if (order.length === 1) {
    steps.push(frame([], null, null, "deleteBeginning", v, undefined, `Deleted ${v} from beginning. List is now empty`, false, LINE.delB.clear, []))
    return { state: { nodes: [], head: null, tail: null, nextId: state.nextId }, steps, ok: true }
  }
  const newHead = order[1].id
  const nodes = setNext(state.nodes.filter((n) => n.id !== head), tail, newHead)
  steps.push(frame(nodes, newHead, tail, "deleteBeginning", v, undefined, `Deleted ${v} from beginning. Tail now points to new head to maintain circular structure`, false, LINE.delB.unlink, []))
  return { state: { nodes, head: newHead, tail, nextId: state.nextId }, steps, ok: true }
}

export function deleteFromEnd(state: State): Result {
  const { head, tail } = state
  const order = orderFrom(state.nodes, head)
  if (head === null || tail === null || order.length === 0) {
    return { state, steps: [frame(state.nodes, head, tail, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, LINE.delE.empty, [])], ok: false }
  }
  const v = order[order.length - 1].value
  const steps = [frame(state.nodes, head, tail, "deleteEnd", v, undefined, `Deleting tail node with value ${v}`, false, LINE.delE.read, [tail])]
  if (order.length === 1) {
    steps.push(frame([], null, null, "deleteEnd", v, undefined, `Deleted ${v} from end. List is now empty`, false, LINE.delE.clear, []))
    return { state: { nodes: [], head: null, tail: null, nextId: state.nextId }, steps, ok: true }
  }
  const path = order.slice(0, -1).map((n) => n.id) // head .. new tail
  const newTail = path[path.length - 1]
  steps.push(frame(state.nodes, head, tail, "deleteEnd", v, undefined, `Finding new tail: ${path.join(" → ")}`, false, LINE.delE.walk, path))
  const nodes = setNext(state.nodes.filter((n) => n.id !== tail), newTail, head)
  steps.push(frame(nodes, head, newTail, "deleteEnd", v, undefined, `Deleted ${v} from end. New tail points to head to maintain circular structure`, false, LINE.delE.unlink, []))
  return { state: { nodes, head, tail: newTail, nextId: state.nextId }, steps, ok: true }
}

export function deleteAtPosition(state: State, position: number): Result {
  const order = orderFrom(state.nodes, state.head)
  const size = order.length
  if (position < 0 || position >= size) {
    const steps = [frame(state.nodes, state.head, state.tail, "deletePosition", undefined, position, `Invalid position ${position}. List size is ${size}`, true, LINE.delP.invalid, [])]
    return { state, steps, ok: false, inputError: `Position must be less than list size (${size})` }
  }
  if (position === 0) return deleteFromBeginning(state)
  if (position === size - 1) return deleteFromEnd(state)
  const target = order[position]
  const previous = order[position - 1]
  const path = order.slice(0, position).map((n) => n.id)
  const nodes = setNext(state.nodes.filter((n) => n.id !== target.id), previous.id, target.next)
  const steps = [
    frame(state.nodes, state.head, state.tail, "deletePosition", target.value, position, `Traversing to position ${position}: ${path.join(" → ")} → ${target.id}`, false, LINE.delP.walk, [...path, target.id]),
    frame(nodes, state.head, state.tail, "deletePosition", target.value, position, `Deleted ${target.value} from position ${position}. Maintaining circular structure`, false, LINE.delP.unlink, []),
  ]
  return { state: { nodes, head: state.head, tail: state.tail, nextId: state.nextId }, steps, ok: true }
}

export function search(state: State, value: number): Result {
  const order = orderFrom(state.nodes, state.head)
  if (order.length === 0) {
    return { state, steps: [frame(state.nodes, state.head, state.tail, "search", value, undefined, "Cannot search in empty list", true, LINE.search.empty, [])], ok: false }
  }
  const steps: Step[] = []
  const path: number[] = []
  for (let position = 0; position < order.length; position++) {
    const node = order[position]
    path.push(node.id)
    steps.push(frame(state.nodes, state.head, state.tail, "search", value, position, `Searching for ${value}. Checking node ${node.id} with value ${node.value}`, false, LINE.search.check, path))
    if (node.value === value) {
      steps.push(frame(state.nodes, state.head, state.tail, "search", value, position, `Found ${value} at position ${position}`, false, LINE.search.found, [node.id]))
      return { state, steps, ok: true }
    }
  }
  steps.push(frame(state.nodes, state.head, state.tail, "search", value, undefined, `Element ${value} not found in the list`, false, LINE.search.missing, path))
  return { state, steps, ok: true }
}

export function traverse(state: State): Result {
  const order = orderFrom(state.nodes, state.head)
  if (order.length === 0) {
    return { state, steps: [frame(state.nodes, state.head, state.tail, "traverse", undefined, undefined, "Cannot traverse empty list", true, LINE.trav.empty, [])], ok: false }
  }
  const steps: Step[] = []
  const path: number[] = []
  const values: number[] = []
  for (const node of order) {
    path.push(node.id)
    values.push(node.value)
    steps.push(frame(state.nodes, state.head, state.tail, "traverse", undefined, undefined, `Circular traversal: ${values.join(" → ")} → (back to head)`, false, LINE.trav.visit, path))
  }
  steps.push(frame(state.nodes, state.head, state.tail, "traverse", undefined, undefined, `Complete circular traversal: ${values.join(" → ")} → ${values[0]} (circular)`, false, LINE.trav.done, path))
  return { state, steps, ok: true }
}
