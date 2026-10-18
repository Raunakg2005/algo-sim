// Operation model for the Doubly Linked List visualizer (pure; see singly-linked-list.ts for conventions).
// Node ids are positive integers from `state.nextId` (starting at 1).
import { codeLineFinder, orderFrom, type OpResult } from "./singly-linked-list"

export type { OpResult } from "./singly-linked-list"

export { parseValueInput, parsePositionInput, orderFrom, orderBackFrom } from "./singly-linked-list"

export interface DoublyListNode {
  value: number
  next: number | null
  prev: number | null
  id: number
}

export interface DoublyLinkedListStep {
  nodes: DoublyListNode[]
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

export interface DoublyListState {
  nodes: DoublyListNode[]
  head: number | null
  tail: number | null
  nextId: number
}

export const EMPTY_DOUBLY_LIST: DoublyListState = { nodes: [], head: null, tail: null, nextId: 1 }

export const doublyLinkedListCode: readonly string[] = [
  "class DoublyNode {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "    this.prev = null;",
  "  }",
  "}",
  "",
  "class DoublyLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.tail = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new DoublyNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "    } else {",
  "      newNode.next = this.head;",
  "      this.head.prev = newNode;",
  "      this.head = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new DoublyNode(data);",
  "    if (!this.tail) {",
  "      this.head = this.tail = newNode;",
  "    } else {",
  "      this.tail.next = newNode;",
  "      newNode.prev = this.tail;",
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
  "    const newNode = new DoublyNode(data);",
  "    let current = this.head;",
  "    for (let i = 0; i < position; i++) {",
  "      current = current.next;",
  "    }",
  "    newNode.next = current;",
  "    newNode.prev = current.prev;",
  "    current.prev.next = newNode;",
  "    current.prev = newNode;",
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
  "      this.head = this.head.next;",
  "      this.head.prev = null;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.tail) return null;",
  "    const deletedData = this.tail.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      this.tail = this.tail.prev;",
  "      this.tail.next = null;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Search for element",
  "  search(data) {",
  "    let current = this.head;",
  "    let position = 0;",
  "    while (current) {",
  "      if (current.data === data) {",
  "        return position;",
  "      }",
  "      current = current.next;",
  "      position++;",
  "    }",
  "    return -1;",
  "  }",
  "",
  "  // Traverse forward",
  "  traverseForward() {",
  "    const elements = [];",
  "    let current = this.head;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    }",
  "    return elements;",
  "  }",
  "",
  "  // Traverse backward",
  "  traverseBackward() {",
  "    const elements = [];",
  "    let current = this.tail;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.prev;",
  "    }",
  "    return elements;",
  "  }",
  "}",
]

const L = codeLineFinder(doublyLinkedListCode)
const LINE = {
  insB: {
    empty: L("insertAtBeginning", "if (!this.head) {"),
    first: L("insertAtBeginning", "this.head = this.tail = newNode;"),
    link: L("insertAtBeginning", "this.head.prev = newNode;"),
    head: L("insertAtBeginning", "this.head = newNode;"),
  },
  insE: {
    empty: L("insertAtEnd", "if (!this.tail) {"),
    first: L("insertAtEnd", "this.head = this.tail = newNode;"),
    link: L("insertAtEnd", "this.tail.next = newNode;"),
    tail: L("insertAtEnd", "this.tail = newNode;"),
  },
  insP: {
    invalid: L("insertAtPosition", "throw new Error('Invalid position');"),
    walk: L("insertAtPosition", "for (let i = 0; i < position; i++) {"),
    link: L("insertAtPosition", "current.prev = newNode;"),
  },
  delB: {
    empty: L("deleteFromBeginning", "if (!this.head) return null;"),
    read: L("deleteFromBeginning", "const deletedData = this.head.data;"),
    clear: L("deleteFromBeginning", "this.head = this.tail = null;"),
    unlink: L("deleteFromBeginning", "this.head.prev = null;"),
  },
  delE: {
    empty: L("deleteFromEnd", "if (!this.tail) return null;"),
    read: L("deleteFromEnd", "const deletedData = this.tail.data;"),
    clear: L("deleteFromEnd", "this.head = this.tail = null;"),
    unlink: L("deleteFromEnd", "this.tail.next = null;"),
  },
  search: {
    check: L("search", "if (current.data === data) {"),
    found: L("search", "return position;"),
    missing: L("search", "return -1;"),
  },
  fwd: { empty: L("traverseForward", "while (current) {"), visit: L("traverseForward", "elements.push(current.data);"), done: L("traverseForward", "return elements;") },
  bwd: { empty: L("traverseBackward", "while (current) {"), visit: L("traverseBackward", "elements.push(current.data);"), done: L("traverseBackward", "return elements;") },
}

type Node = DoublyListNode
type Step = DoublyLinkedListStep
type State = DoublyListState
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

/** Applies pointer updates one after another (two updates may hit the same node). */
function patch(nodes: Node[], updates: [number, Partial<Node>][]): Node[] {
  let out = nodes
  for (const [id, change] of updates) out = out.map((n) => (n.id === id ? { ...n, ...change } : n))
  return out
}

export function doublySize(state: State): number {
  return orderFrom(state.nodes, state.head).length
}

export function insertAtBeginning(state: State, value: number): Result {
  const id = state.nextId
  const { head, tail } = state
  if (head === null) {
    const nodes = [...state.nodes, { value, next: null, prev: null, id }]
    const steps = [
      frame(nodes, null, null, "insertBeginning", value, undefined, "List is empty, creating first node", false, LINE.insB.empty, []),
      frame(nodes, id, id, "insertBeginning", value, undefined, `Inserted ${value} as first node. Both head and tail point to node ${id}`, false, LINE.insB.first, [id]),
    ]
    return { state: { nodes, head: id, tail: id, nextId: id + 1 }, steps, ok: true }
  }
  const nodes = patch([...state.nodes, { value, next: head, prev: null, id }], [[head, { prev: id }]])
  const steps = [
    frame(nodes, head, tail, "insertBeginning", value, undefined, "Creating new node and linking to current head", false, LINE.insB.link, []),
    frame(nodes, id, tail, "insertBeginning", value, undefined, `Inserted ${value} at beginning. New head points to node ${id}`, false, LINE.insB.head, [id]),
  ]
  return { state: { nodes, head: id, tail, nextId: id + 1 }, steps, ok: true }
}

export function insertAtEnd(state: State, value: number): Result {
  const id = state.nextId
  const { head, tail } = state
  if (tail === null) {
    const nodes = [...state.nodes, { value, next: null, prev: null, id }]
    const steps = [
      frame(nodes, null, null, "insertEnd", value, undefined, "List is empty, creating first node", false, LINE.insE.empty, []),
      frame(nodes, id, id, "insertEnd", value, undefined, `Inserted ${value} as first node. Both head and tail point to node ${id}`, false, LINE.insE.first, [id]),
    ]
    return { state: { nodes, head: id, tail: id, nextId: id + 1 }, steps, ok: true }
  }
  const nodes = patch([...state.nodes, { value, next: null, prev: tail, id }], [[tail, { next: id }]])
  const steps = [
    frame(nodes, head, tail, "insertEnd", value, undefined, "Creating new node and linking to current tail", false, LINE.insE.link, []),
    frame(nodes, head, id, "insertEnd", value, undefined, `Inserted ${value} at end. New tail points to node ${id}`, false, LINE.insE.tail, [id]),
  ]
  return { state: { nodes, head, tail: id, nextId: id + 1 }, steps, ok: true }
}

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
  const current = order[position]
  const before = order[position - 1]
  const path = order.slice(0, position).map((n) => n.id)
  const nodes = patch([...state.nodes, { value, next: current.id, prev: before.id, id }], [
    [current.id, { prev: id }],
    [before.id, { next: id }],
  ])
  const steps = [
    frame(state.nodes, state.head, state.tail, "insertPosition", value, position, `Traversing to position ${position}: ${path.join(" → ")}`, false, LINE.insP.walk, path),
    frame(nodes, state.head, state.tail, "insertPosition", value, position, `Inserted ${value} at position ${position}`, false, LINE.insP.link, [id]),
  ]
  return { state: { nodes, head: state.head, tail: state.tail, nextId: id + 1 }, steps, ok: true }
}

export function deleteFromBeginning(state: State): Result {
  const { head, tail } = state
  const headNode = head === null ? undefined : state.nodes.find((n) => n.id === head)
  if (head === null || !headNode) {
    return { state, steps: [frame(state.nodes, head, tail, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, LINE.delB.empty, [])], ok: false }
  }
  const v = headNode.value
  const steps = [frame(state.nodes, head, tail, "deleteBeginning", v, undefined, `Deleting head node with value ${v}`, false, LINE.delB.read, [head])]
  if (head === tail || headNode.next === null) {
    steps.push(frame([], null, null, "deleteBeginning", v, undefined, `Deleted ${v} from beginning. List is now empty`, false, LINE.delB.clear, []))
    return { state: { nodes: [], head: null, tail: null, nextId: state.nextId }, steps, ok: true }
  }
  const newHead = headNode.next
  const nodes = patch(state.nodes.filter((n) => n.id !== head), [[newHead, { prev: null }]])
  steps.push(frame(nodes, newHead, tail, "deleteBeginning", v, undefined, `Deleted ${v} from beginning. New head: node ${newHead}`, false, LINE.delB.unlink, []))
  return { state: { nodes, head: newHead, tail, nextId: state.nextId }, steps, ok: true }
}

export function deleteFromEnd(state: State): Result {
  const { head, tail } = state
  const tailNode = tail === null ? undefined : state.nodes.find((n) => n.id === tail)
  if (tail === null || !tailNode) {
    return { state, steps: [frame(state.nodes, head, tail, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, LINE.delE.empty, [])], ok: false }
  }
  const v = tailNode.value
  const steps = [frame(state.nodes, head, tail, "deleteEnd", v, undefined, `Deleting tail node with value ${v}`, false, LINE.delE.read, [tail])]
  if (head === tail || tailNode.prev === null) {
    steps.push(frame([], null, null, "deleteEnd", v, undefined, `Deleted ${v} from end. List is now empty`, false, LINE.delE.clear, []))
    return { state: { nodes: [], head: null, tail: null, nextId: state.nextId }, steps, ok: true }
  }
  const newTail = tailNode.prev
  const nodes = patch(state.nodes.filter((n) => n.id !== tail), [[newTail, { next: null }]])
  steps.push(frame(nodes, head, newTail, "deleteEnd", v, undefined, `Deleted ${v} from end. New tail: node ${newTail}`, false, LINE.delE.unlink, []))
  return { state: { nodes, head, tail: newTail, nextId: state.nextId }, steps, ok: true }
}

export function search(state: State, value: number): Result {
  const steps: Step[] = []
  const path: number[] = []
  const order = orderFrom(state.nodes, state.head)
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

function traverse(state: State, backward: boolean): Result {
  const op = backward ? "traverseBackward" : "traverseForward"
  const lines = backward ? LINE.bwd : LINE.fwd
  const start = backward ? state.tail : state.head
  if (start === null) {
    return { state, steps: [frame(state.nodes, state.head, state.tail, op, undefined, undefined, "Cannot traverse empty list", true, lines.empty, [])], ok: false }
  }
  const byId = new Map<number, Node>()
  for (const n of state.nodes) byId.set(n.id, n)
  const sep = backward ? " ← " : " → "
  const steps: Step[] = []
  const path: number[] = []
  const values: number[] = []
  let cur: number | null = start
  while (cur !== null && !path.includes(cur)) {
    const node = byId.get(cur)
    if (!node) break
    path.push(cur)
    values.push(node.value)
    steps.push(frame(state.nodes, state.head, state.tail, op, undefined, undefined, `${backward ? "Backward" : "Forward"} traversal: ${values.join(sep)}`, false, lines.visit, path))
    cur = backward ? node.prev : node.next
  }
  steps.push(frame(state.nodes, state.head, state.tail, op, undefined, undefined, `${backward ? "Backward" : "Forward"} traversal complete: ${values.join(sep)}`, false, lines.done, path))
  return { state, steps, ok: true }
}

export const traverseForward = (state: State): Result => traverse(state, false)
export const traverseBackward = (state: State): Result => traverse(state, true)
