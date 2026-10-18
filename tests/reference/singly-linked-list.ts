// Independent oracle for the four linked-list modules: a plain JS array model of the list ADT,
// pointer-structure readers/checkers, and a code-listing method-range finder.
// Written from the textbook definitions, not from the engines.

export type ListOp =
  | { kind: "insertBeginning"; value: number }
  | { kind: "insertEnd"; value: number }
  | { kind: "insertPosition"; value: number; position: number }
  | { kind: "deleteBeginning" }
  | { kind: "deleteEnd" }
  | { kind: "deletePosition"; position: number }
  | { kind: "search"; value: number }
  | { kind: "traverse" }
  | { kind: "traverseForward" }
  | { kind: "traverseBackward" }

export type ModelResult = { list: number[]; ok: boolean; foundAt?: number }

/** What each operation must do to the sequence of values. `ok` = the operation succeeded (no error frame). */
export function modelApply(list: readonly number[], op: ListOp, opts: { emptyQueryIsError: boolean }): ModelResult {
  const a = [...list]
  switch (op.kind) {
    case "insertBeginning":
      return { list: [op.value, ...a], ok: true }
    case "insertEnd":
      return { list: [...a, op.value], ok: true }
    case "insertPosition":
      if (op.position < 0 || op.position > a.length) return { list: a, ok: false }
      return { list: [...a.slice(0, op.position), op.value, ...a.slice(op.position)], ok: true }
    case "deleteBeginning":
      return a.length === 0 ? { list: a, ok: false } : { list: a.slice(1), ok: true }
    case "deleteEnd":
      return a.length === 0 ? { list: a, ok: false } : { list: a.slice(0, -1), ok: true }
    case "deletePosition":
      if (op.position < 0 || op.position >= a.length) return { list: a, ok: false }
      return { list: [...a.slice(0, op.position), ...a.slice(op.position + 1)], ok: true }
    case "search": {
      let foundAt = -1
      for (let i = 0; i < a.length; i++) if (a[i] === op.value) { foundAt = i; break }
      return { list: a, ok: !(opts.emptyQueryIsError && a.length === 0), foundAt }
    }
    default:
      return { list: a, ok: a.length > 0 }
  }
}

/** The UI's parsing rule for the value / position boxes (parseInt base 10 of the trimmed text). */
export function uiInteger(raw: string): number | null {
  const t = raw.trim()
  if (t === "") return null
  const m = /^[+-]?\d+/.exec(t)
  return m ? Number(m[0]) : null
}

// ------------------------------------------------------------------ pointer structure

export type AnyNode = { id: number; value: number; next: number | null; prev?: number | null }

/**
 * Reads the list by following `dir` from `start`.
 * Linear lists must end in null; circular lists must come back to `start` after visiting every node once.
 * Returns the visited ids, or a string describing the defect.
 */
export function readChain(nodes: readonly AnyNode[], start: number | null, dir: "next" | "prev", circular: boolean): number[] | string {
  const byId = new Map<number, AnyNode>()
  for (const n of nodes) {
    if (byId.has(n.id)) return `duplicate id ${n.id}`
    byId.set(n.id, n)
  }
  const ids: number[] = []
  let cur = start
  while (cur !== null) {
    const node = byId.get(cur)
    if (node === undefined) return `${dir} points to missing node ${cur}`
    if (ids.includes(cur)) return circular && cur === start ? ids : `${dir} chain loops at node ${cur} without returning to its start`
    ids.push(cur)
    const nxt = node[dir]
    cur = nxt === undefined ? null : nxt
  }
  return circular && ids.length > 0 ? `${dir} chain ends in null in a circular list` : ids
}

/**
 * Full invariant check of a list state; returns the values in head-to-tail order or throws.
 * kinds: singly (head only), doubly (head/tail, prev), circular (tail.next = head), circular doubly.
 */
export function checkList(
  s: { nodes: readonly AnyNode[]; head: number | null; tail?: number | null },
  kind: { doubly: boolean; circular: boolean; hasTail: boolean },
): number[] {
  const byId = new Map<number, AnyNode>(s.nodes.map((n) => [n.id, n]))
  if (s.head === null) {
    if (s.nodes.length !== 0) throw new Error("head is null but node array is not empty")
    if (kind.hasTail && s.tail !== null) throw new Error("head is null but tail is not")
    return []
  }
  const fwd = readChain(s.nodes, s.head, "next", kind.circular)
  if (typeof fwd === "string") throw new Error("forward: " + fwd)
  if (fwd.length !== s.nodes.length) throw new Error(`${s.nodes.length - fwd.length} unreachable node(s)`)
  for (const n of s.nodes) if (!Number.isInteger(n.id) || n.id <= 0) throw new Error(`invalid node id ${n.id}`)
  const last = fwd[fwd.length - 1]
  if (kind.hasTail && s.tail !== last) throw new Error(`tail ${s.tail} is not the last node ${last}`)
  if (kind.circular && byId.get(last)!.next !== s.head) throw new Error("tail.next is not head")
  if (!kind.circular && byId.get(last)!.next !== null) throw new Error("last.next is not null")
  if (kind.doubly) {
    const tail = kind.hasTail ? (s.tail ?? null) : last
    const bwd = readChain(s.nodes, tail, "prev", kind.circular)
    if (typeof bwd === "string") throw new Error("backward: " + bwd)
    if (bwd.join(",") !== [...fwd].reverse().join(",")) throw new Error("backward order is not the reverse of forward order")
    for (const n of s.nodes) if (n.next !== null && byId.get(n.next)!.prev !== n.id) throw new Error(`node ${n.next}.prev != ${n.id}`)
    const headPrev = byId.get(s.head)!.prev
    if (kind.circular ? headPrev !== last : headPrev !== null) throw new Error("head.prev wrong")
  }
  return fwd.map((id) => byId.get(id)!.value)
}

/** Every pointer in a frame refers to a node that exists in that frame. */
export function frameDefect(f: { nodes: readonly AnyNode[]; head: number | null; tail?: number | null; highlightedNodes?: number[] }): string | null {
  const ids = new Set(f.nodes.map((n) => n.id))
  if (f.head !== null && !ids.has(f.head)) return "head -> missing node"
  if (f.tail !== undefined && f.tail !== null && !ids.has(f.tail)) return "tail -> missing node"
  for (const n of f.nodes) {
    if (n.next !== null && !ids.has(n.next)) return `node ${n.id}.next -> missing node`
    if (n.prev !== undefined && n.prev !== null && !ids.has(n.prev)) return `node ${n.id}.prev -> missing node`
  }
  for (const h of f.highlightedNodes ?? []) if (!ids.has(h)) return `highlight of missing node ${h}`
  return null
}

// ------------------------------------------------------------------ code listing

export const METHOD_OF: Record<string, string> = {
  insertBeginning: "insertAtBeginning",
  insertEnd: "insertAtEnd",
  insertPosition: "insertAtPosition",
  deleteBeginning: "deleteFromBeginning",
  deleteEnd: "deleteFromEnd",
  deletePosition: "deleteAtPosition",
  search: "search",
  traverse: "display",
  traverseForward: "traverseForward",
  traverseBackward: "traverseBackward",
}

/** [first line, closing-brace line] of a method in a JS class listing (methods are indented by 2 spaces). */
export function methodRange(code: readonly string[], method: string): [number, number] | null {
  const start = code.findIndex((l) => l.startsWith(`  ${method}(`))
  if (start < 0) return null
  let end = start + 1
  while (end < code.length && code[end] !== "  }") end++
  return end < code.length ? [start, end] : null
}

// ------------------------------------------------------------------ one-operation checker

export type Kind = { doubly: boolean; circular: boolean; hasTail: boolean }
export type FrameLike = {
  nodes: AnyNode[]
  head: number | null
  tail?: number | null
  operation: string
  element?: number
  position?: number
  description: string
  isError: boolean
  activeCodeLine: number
  highlightedNodes?: number[]
}
export type StateLike = { nodes: AnyNode[]; head: number | null; tail?: number | null; nextId: number }
export type ResultLike = { state: StateLike; steps: FrameLike[]; ok: boolean; inputError?: string }

const ALLOWED_FRAME_OPS: Record<string, string[]> = {
  insertPosition: ["insertPosition", "insertBeginning", "insertEnd"],
  deletePosition: ["deletePosition", "deleteBeginning", "deleteEnd"],
}

const sameState = (a: StateLike, b: StateLike) =>
  JSON.stringify([a.nodes, a.head, a.tail ?? null, a.nextId]) === JSON.stringify([b.nodes, b.head, b.tail ?? null, b.nextId])

/**
 * Checks one engine operation against the array model. Returns a list of violated properties (empty = pass).
 * `before` must be a valid state holding `model`.
 */
export function checkOperation(
  kind: Kind,
  code: readonly string[],
  before: StateLike,
  model: readonly number[],
  op: ListOp,
  r: ResultLike,
): { problems: string[]; model: number[] } {
  const problems: string[] = []
  const want = modelApply(model, op, { emptyQueryIsError: kind.circular })
  const say = (m: string) => problems.push(`${op.kind}: ${m}`)

  // 1. resulting list equals the model and satisfies every pointer invariant
  try {
    const got = checkList(r.state, kind)
    if (got.join(",") !== want.list.join(",")) say(`list ${JSON.stringify(got)} != model ${JSON.stringify(want.list)}`)
  } catch (e) {
    say(`invalid structure: ${(e as Error).message}`)
  }
  if (r.ok !== want.ok) say(`ok=${r.ok}, model says ${want.ok}`)
  if (r.steps.length === 0) say("no frames")

  // 2. ids: fresh positive ids, nextId bookkeeping
  const inserted = want.ok && op.kind.startsWith("insert")
  if (r.state.nextId !== before.nextId + (inserted ? 1 : 0)) say(`nextId ${r.state.nextId} after ${before.nextId}`)
  if (inserted && !r.state.nodes.some((n) => n.id === before.nextId)) say("new node did not get id nextId")

  // 3. failure = one error frame, state untouched
  if (!want.ok) {
    if (!sameState(before, r.state)) say("failed operation changed the state")
    if (r.steps.length !== 1 || !r.steps[0].isError) say("failed operation must show exactly one error frame")
    if (op.kind === "deletePosition" && r.inputError !== `Position must be less than list size (${model.length})`) say(`inputError ${JSON.stringify(r.inputError)}`)
  } else if (r.steps.some((s) => s.isError)) say("error frame in a successful operation")

  // 4. every frame is self-consistent and highlights a line of the method that implements it
  for (const s of r.steps) {
    const d = frameDefect(s)
    if (d) say(`frame "${s.description}": ${d}`)
    const allowed = ALLOWED_FRAME_OPS[op.kind] ?? [op.kind]
    if (!allowed.includes(s.operation)) say(`frame operation ${s.operation}`)
    const range = methodRange(code, METHOD_OF[s.operation])
    if (!range) say(`listing has no ${METHOD_OF[s.operation]}()`)
    else if (s.activeCodeLine < range[0] || s.activeCodeLine > range[1]) say(`frame "${s.description}" highlights line ${s.activeCodeLine} outside ${METHOD_OF[s.operation]}()`)
  }

  // 5. the last frame of a successful mutation shows exactly the new state
  const mutating = !["search", "traverse", "traverseForward", "traverseBackward"].includes(op.kind)
  const last = r.steps[r.steps.length - 1]
  if (want.ok && mutating && last) {
    if (last.head !== r.state.head || (kind.hasTail && last.tail !== r.state.tail)) say("last frame head/tail differ from new state")
    if (JSON.stringify([...last.nodes].sort((a, b) => a.id - b.id)) !== JSON.stringify([...r.state.nodes].sort((a, b) => a.id - b.id))) say("last frame nodes differ from new state")
  }

  // 6. captions / payload
  if (want.ok && op.kind.startsWith("delete")) {
    const removedIndex = op.kind === "deleteBeginning" ? 0 : op.kind === "deleteEnd" ? model.length - 1 : (op as { position: number }).position
    for (const s of r.steps) if (s.element !== model[removedIndex]) say(`frame element ${s.element} != deleted value ${model[removedIndex]}`)
  }
  if (want.ok && op.kind.startsWith("insert")) {
    for (const s of r.steps) if (s.element !== (op as { value: number }).value) say("frame element != inserted value")
    if (!last.highlightedNodes?.includes(before.nextId)) say("last frame does not highlight the new node")
  }
  if (op.kind === "search" && want.ok) {
    const checks = r.steps.filter((s) => s.description.startsWith("Searching for"))
    if (want.foundAt !== undefined && want.foundAt >= 0) {
      if (last.description !== `Found ${op.value} at position ${want.foundAt}` || last.position !== want.foundAt) say(`last frame "${last.description}" (expected position ${want.foundAt})`)
      if (checks.length !== want.foundAt + 1) say(`${checks.length} comparison frames, expected ${want.foundAt + 1}`)
    } else {
      if (last.description !== `Element ${op.value} not found in the list`) say(`last frame "${last.description}"`)
      if (checks.length !== model.length) say(`${checks.length} comparison frames, expected ${model.length}`)
    }
  }
  if (op.kind.startsWith("traverse") && want.ok) {
    const back = op.kind === "traverseBackward"
    const values = back ? [...model].reverse() : model
    if (r.steps.length !== model.length + 1) say(`${r.steps.length} frames, expected ${model.length + 1}`)
    if (!last.description.includes(values.join(back ? " ← " : " → "))) say(`final caption "${last.description}"`)
    if (last.highlightedNodes?.length !== model.length) say("final frame does not highlight every node")
  }
  return { problems, model: want.list }
}
export const KIND: Kind = { doubly: false, circular: false, hasTail: false }
