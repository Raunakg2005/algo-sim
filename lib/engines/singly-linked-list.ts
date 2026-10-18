// Operation model for the Singly Linked List visualizer.
// Every operation is a pure function (state, input) => { state, steps, ok, inputError? }.
// `steps` are the frames the visualizer plays; the last frame of a successful mutation equals the new state.
// Node ids are positive integers handed out from `state.nextId` (starting at 1), so an id is never 0.
// The helpers at the top (input parsing, code-line lookup, cycle-safe walk) are shared by the other
// three linked-list engines.

// ---------------------------------------------------------------- shared helpers

export type ParseResult = { ok: true; value: number } | { ok: false; error: string }

/** Value box: any integer accepted by parseInt (the UI has no value range or capacity limit). */
export function parseValueInput(raw: string): ParseResult {
  const value = raw.trim()
  if (!value) return { ok: false, error: "Please enter a number" }
  const num = Number.parseInt(value, 10)
  if (Number.isNaN(num)) return { ok: false, error: "Please enter a valid number" }
  return { ok: true, value: num }
}

/** Position box of "Insert at Position". */
export function parsePositionInput(raw: string): ParseResult {
  const pos = raw.trim()
  if (!pos) return { ok: false, error: "Please enter a position" }
  const num = Number.parseInt(pos, 10)
  if (Number.isNaN(num) || num < 0) return { ok: false, error: "Please enter a valid position (≥ 0)" }
  return { ok: true, value: num }
}

/** Position box of "Delete at Position" (its own message, as in the original UI). */
export function parseDeletePositionInput(raw: string): ParseResult {
  const num = Number.parseInt(raw.trim(), 10)
  if (Number.isNaN(num) || num < 0) return { ok: false, error: "Please enter a valid position (0 or greater)" }
  return { ok: true, value: num }
}

/**
 * Returns a lookup `line(method, text)` = index of the first line whose trimmed text equals `text`
 * inside `method(...)` of the code listing. Throws at module load if the listing does not contain it,
 * so a highlighted line can never drift out of its method again.
 */
export function codeLineFinder(code: readonly string[]): (method: string, text: string) => number {
  return (method, text) => {
    const start = code.findIndex((l) => l.trim().startsWith(method + "("))
    if (start < 0) throw new Error(`code listing has no method ${method}()`)
    for (let i = start; i < code.length && (i === start || code[i] !== "  }"); i++) {
      if (code[i].trim() === text) return i
    }
    throw new Error(`method ${method}() has no line "${text}"`)
  }
}

/** Follows `next` from `head`; stops at null, at a missing id, or when a node repeats (circular lists). */
export function orderFrom<N extends { id: number; next: number | null }>(nodes: readonly N[], head: number | null): N[] {
  const byId = new Map<number, N>()
  for (const n of nodes) byId.set(n.id, n)
  const out: N[] = []
  const seen = new Set<number>()
  let cur: number | null = head
  while (cur !== null && !seen.has(cur)) {
    const node = byId.get(cur)
    if (!node) break
    seen.add(cur)
    out.push(node)
    cur = node.next
  }
  return out
}

/** Follows `prev` from `tail` (doubly lists); same stopping rules as orderFrom. */
export function orderBackFrom<N extends { id: number; prev: number | null }>(nodes: readonly N[], tail: number | null): N[] {
  const byId = new Map<number, N>()
  for (const n of nodes) byId.set(n.id, n)
  const out: N[] = []
  const seen = new Set<number>()
  let cur: number | null = tail
  while (cur !== null && !seen.has(cur)) {
    const node = byId.get(cur)
    if (!node) break
    seen.add(cur)
    out.push(node)
    cur = node.prev
  }
  return out
}

export type OpResult<S, T> = { state: S; steps: T[]; ok: boolean; inputError?: string }

// ---------------------------------------------------------------- singly linked list

export interface ListNode {
  value: number
  next: number | null
  id: number
}

export interface LinkedListStep {
  nodes: ListNode[]
  head: number | null
  operation: string
  element?: number
  position?: number
  description: string
  isError: boolean
  activeCodeLine: number
  highlightedNodes?: number[]
}

export interface SinglyListState {
  nodes: ListNode[]
  head: number | null
  nextId: number
}

export const EMPTY_SINGLY_LIST: SinglyListState = { nodes: [], head: null, nextId: 1 }

export const singlyLinkedListCode: readonly string[] = [
  "class Node {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "  }",
  "}",
  "",
  "class SinglyLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new Node(data);",
  "    newNode.next = this.head;",
  "    this.head = newNode;",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new Node(data);",
  "    if (!this.head) {",
  "      this.head = newNode;",
  "    } else {",
  "      let current = this.head;",
  "      while (current.next) {",
  "        current = current.next;",
  "      }",
  "      current.next = newNode;",
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
  "    const newNode = new Node(data);",
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
  "    this.head = this.head.next;",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.head) return null;",
  "    if (!this.head.next) {",
  "      const deletedData = this.head.data;",
  "      this.head = null;",
  "      this.size--;",
  "      return deletedData;",
  "    }",
  "    let current = this.head;",
  "    while (current.next.next) {",
  "      current = current.next;",
  "    }",
  "    const deletedData = current.next.data;",
  "    current.next = null;",
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
  "  // Display list",
  "  display() {",
  "    const elements = [];",
  "    let current = this.head;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    }",
  "    return elements;",
  "  }",
  "}",
]

const L = codeLineFinder(singlyLinkedListCode)
const LINE = {
  insB: { create: L("insertAtBeginning", "const newNode = new Node(data);"), head: L("insertAtBeginning", "this.head = newNode;") },
  insE: {
    empty: L("insertAtEnd", "if (!this.head) {"),
    head: L("insertAtEnd", "this.head = newNode;"),
    walk: L("insertAtEnd", "while (current.next) {"),
    link: L("insertAtEnd", "current.next = newNode;"),
  },
  insP: {
    invalid: L("insertAtPosition", "throw new Error('Invalid position');"),
    walk: L("insertAtPosition", "for (let i = 0; i < position - 1; i++) {"),
    link: L("insertAtPosition", "current.next = newNode;"),
  },
  delB: {
    empty: L("deleteFromBeginning", "if (!this.head) return null;"),
    read: L("deleteFromBeginning", "const deletedData = this.head.data;"),
    unlink: L("deleteFromBeginning", "this.head = this.head.next;"),
  },
  delE: {
    empty: L("deleteFromEnd", "if (!this.head) return null;"),
    only: L("deleteFromEnd", "if (!this.head.next) {"),
    clear: L("deleteFromEnd", "this.head = null;"),
    walk: L("deleteFromEnd", "while (current.next.next) {"),
    unlink: L("deleteFromEnd", "current.next = null;"),
  },
  delP: {
    invalid: L("deleteAtPosition", "throw new Error('Invalid position');"),
    walk: L("deleteAtPosition", "for (let i = 0; i < position - 1; i++) {"),
    unlink: L("deleteAtPosition", "previous.next = previous.next.next;"),
  },
  search: {
    check: L("search", "if (current.data === data) {"),
    found: L("search", "return position;"),
    missing: L("search", "return -1;"),
  },
}

type Step = LinkedListStep
const frame = (
  nodes: ListNode[],
  head: number | null,
  operation: string,
  element: number | undefined,
  position: number | undefined,
  description: string,
  isError: boolean,
  activeCodeLine: number,
  highlightedNodes: number[],
): Step => ({ nodes: nodes.map((n) => ({ ...n })), head, operation, element, position, description, isError, activeCodeLine, highlightedNodes: [...highlightedNodes] })

const find = (nodes: ListNode[], id: number | null): ListNode | undefined => (id === null ? undefined : nodes.find((n) => n.id === id))

/** Number of nodes reachable from head (the list size). */
export function singlySize(state: SinglyListState): number {
  return orderFrom(state.nodes, state.head).length
}

export function insertAtBeginning(state: SinglyListState, value: number): OpResult<SinglyListState, Step> {
  const id = state.nextId
  const nodes = [...state.nodes, { value, next: state.head, id }]
  const steps = [
    frame(nodes, state.head, "insertBeginning", value, undefined, "Creating new node", false, LINE.insB.create, []),
    frame(nodes, id, "insertBeginning", value, undefined, `Inserted ${value} at beginning. New head points to node ${id}`, false, LINE.insB.head, [id]),
  ]
  return { state: { nodes, head: id, nextId: id + 1 }, steps, ok: true }
}

export function insertAtEnd(state: SinglyListState, value: number): OpResult<SinglyListState, Step> {
  const id = state.nextId
  const newNode: ListNode = { value, next: null, id }
  if (state.head === null) {
    const nodes = [...state.nodes, newNode]
    const steps = [
      frame(nodes, null, "insertEnd", value, undefined, "List is empty, inserting as first node", false, LINE.insE.empty, []),
      frame(nodes, id, "insertEnd", value, undefined, `Inserted ${value} as first node. Head points to node ${id}`, false, LINE.insE.head, [id]),
    ]
    return { state: { nodes, head: id, nextId: id + 1 }, steps, ok: true }
  }
  const path = orderFrom(state.nodes, state.head).map((n) => n.id)
  const last = path[path.length - 1]
  const nodes = [...state.nodes, newNode].map((n) => (n.id === last ? { ...n, next: id } : n))
  const steps = [
    frame(state.nodes, state.head, "insertEnd", value, undefined, `Traversing to find last node: ${path.join(" → ")}`, false, LINE.insE.walk, path),
    frame(nodes, state.head, "insertEnd", value, undefined, `Inserted ${value} at end. Last node now points to node ${id}`, false, LINE.insE.link, [id]),
  ]
  return { state: { nodes, head: state.head, nextId: id + 1 }, steps, ok: true }
}

export function insertAtPosition(state: SinglyListState, value: number, position: number): OpResult<SinglyListState, Step> {
  const order = orderFrom(state.nodes, state.head)
  const size = order.length
  if (position < 0 || position > size) {
    const steps = [frame(state.nodes, state.head, "insertPosition", value, position, `Invalid position ${position}. List size is ${size}`, true, LINE.insP.invalid, [])]
    return { state, steps, ok: false }
  }
  if (position === 0) return insertAtBeginning(state, value)
  const id = state.nextId
  const path = order.slice(0, position).map((n) => n.id) // nodes 0 .. position-1
  const before = order[position - 1]
  const nodes = [...state.nodes, { value, next: before.next, id }].map((n) => (n.id === before.id ? { ...n, next: id } : n))
  const steps = [
    frame(state.nodes, state.head, "insertPosition", value, position, `Traversing to position ${position - 1}: ${path.join(" → ")}`, false, LINE.insP.walk, path),
    frame(nodes, state.head, "insertPosition", value, position, `Inserted ${value} at position ${position}`, false, LINE.insP.link, [id]),
  ]
  return { state: { nodes, head: state.head, nextId: id + 1 }, steps, ok: true }
}

export function deleteFromBeginning(state: SinglyListState): OpResult<SinglyListState, Step> {
  const headNode = find(state.nodes, state.head)
  if (state.head === null || !headNode) {
    return { state, steps: [frame(state.nodes, state.head, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, LINE.delB.empty, [])], ok: false }
  }
  const v = headNode.value
  const newHead = headNode.next
  const nodes = state.nodes.filter((n) => n.id !== headNode.id)
  const steps = [
    frame(state.nodes, state.head, "deleteBeginning", v, undefined, `Deleting head node with value ${v}`, false, LINE.delB.read, [headNode.id]),
    frame(nodes, newHead, "deleteBeginning", v, undefined, `Deleted ${v} from beginning. New head: ${newHead !== null ? `node ${newHead}` : "null"}`, false, LINE.delB.unlink, []),
  ]
  return { state: { nodes, head: newHead, nextId: state.nextId }, steps, ok: true }
}

export function deleteFromEnd(state: SinglyListState): OpResult<SinglyListState, Step> {
  const order = orderFrom(state.nodes, state.head)
  if (state.head === null || order.length === 0) {
    return { state, steps: [frame(state.nodes, state.head, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, LINE.delE.empty, [])], ok: false }
  }
  if (order.length === 1) {
    const only = order[0]
    const steps = [
      frame(state.nodes, state.head, "deleteEnd", only.value, undefined, `Deleting only node with value ${only.value}`, false, LINE.delE.only, [only.id]),
      frame([], null, "deleteEnd", only.value, undefined, `Deleted ${only.value} from end. List is now empty`, false, LINE.delE.clear, []),
    ]
    return { state: { nodes: [], head: null, nextId: state.nextId }, steps, ok: true }
  }
  const last = order[order.length - 1]
  const previous = order[order.length - 2]
  const path = order.slice(0, -1).map((n) => n.id)
  const nodes = state.nodes.filter((n) => n.id !== last.id).map((n) => (n.id === previous.id ? { ...n, next: null } : n))
  const steps = [
    frame(state.nodes, state.head, "deleteEnd", last.value, undefined, `Traversing to find last node: ${path.join(" → ")} → ${last.id}`, false, LINE.delE.walk, [...path, last.id]),
    frame(nodes, state.head, "deleteEnd", last.value, undefined, `Deleted ${last.value} from end`, false, LINE.delE.unlink, []),
  ]
  return { state: { nodes, head: state.head, nextId: state.nextId }, steps, ok: true }
}

export function deleteAtPosition(state: SinglyListState, position: number): OpResult<SinglyListState, Step> {
  const order = orderFrom(state.nodes, state.head)
  const size = order.length
  if (position < 0 || position >= size) {
    const steps = [frame(state.nodes, state.head, "deletePosition", undefined, position, `Invalid position ${position}. List size is ${size}`, true, LINE.delP.invalid, [])]
    return { state, steps, ok: false, inputError: `Position must be less than list size (${size})` }
  }
  if (position === 0) return deleteFromBeginning(state)
  const target = order[position]
  const previous = order[position - 1]
  const path = order.slice(0, position).map((n) => n.id)
  const nodes = state.nodes.filter((n) => n.id !== target.id).map((n) => (n.id === previous.id ? { ...n, next: target.next } : n))
  const steps = [
    frame(state.nodes, state.head, "deletePosition", target.value, position, `Traversing to position ${position}: ${path.join(" → ")} → ${target.id}`, false, LINE.delP.walk, [...path, target.id]),
    frame(nodes, state.head, "deletePosition", target.value, position, `Deleted ${target.value} from position ${position}`, false, LINE.delP.unlink, []),
  ]
  return { state: { nodes, head: state.head, nextId: state.nextId }, steps, ok: true }
}

export function search(state: SinglyListState, value: number): OpResult<SinglyListState, Step> {
  const steps: Step[] = []
  const path: number[] = []
  const order = orderFrom(state.nodes, state.head)
  for (let position = 0; position < order.length; position++) {
    const node = order[position]
    path.push(node.id)
    steps.push(frame(state.nodes, state.head, "search", value, position, `Searching for ${value}. Checking node ${node.id} with value ${node.value}`, false, LINE.search.check, path))
    if (node.value === value) {
      steps.push(frame(state.nodes, state.head, "search", value, position, `Found ${value} at position ${position}`, false, LINE.search.found, [node.id]))
      return { state, steps, ok: true }
    }
  }
  steps.push(frame(state.nodes, state.head, "search", value, undefined, `Element ${value} not found in the list`, false, LINE.search.missing, path))
  return { state, steps, ok: true }
}
