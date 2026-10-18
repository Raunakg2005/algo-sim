// Legacy check for the four linked-list visualizers.
// usage: node --experimental-strip-types --no-warnings driver.ts <module>
// Drives the ORIGINAL handlers (legacy.ts, generated verbatim from git HEAD) with random and exhaustive
// click sequences and compares against a plain-array model after every click.
import path from "node:path"
import { pathToFileURL } from "node:url"

const mod = process.argv[2]
const flags = {
  doubly: mod.includes("doubly"),
  circular: mod.startsWith("circular"),
}
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"))
const L: any = await import(pathToFileURL(path.join(here, "..", mod, "legacy.ts")).href)
const OPS: string[] = L.OPS
const CODE: string[] = L.CODE

type Op = { kind: string; value: string; position: string }

// ---- independent method ranges in the code listing -------------------------------------------
const METHOD: Record<string, string> = {
  insertBeginning: "insertAtBeginning", insertEnd: "insertAtEnd", insertPosition: "insertAtPosition",
  deleteBeginning: "deleteFromBeginning", deleteEnd: "deleteFromEnd", deletePosition: "deleteAtPosition",
  search: "search", traverse: "display", traverseForward: "traverseForward", traverseBackward: "traverseBackward",
}
function methodRange(op: string): [number, number] | null {
  const start = CODE.findIndex((l) => l.trim().startsWith(METHOD[op] + "("))
  if (start < 0) return null
  let end = start + 1
  while (end < CODE.length && CODE[end] !== "  }") end++
  return [start, end]
}

// ---- plain array model ------------------------------------------------------------------------
const parseNum = (s: string): number | null => {
  const t = s.trim()
  if (!t) return null
  const n = Number.parseInt(t, 10)
  return Number.isNaN(n) ? null : n
}

// ---- structure checks ------------------------------------------------------------------------
function walk(nodes: any[], start: number | null, dir: "next" | "prev", limit: number): { vals: number[]; ids: number[]; broken: string | null } {
  const byId = new Map<number, any>(nodes.map((n) => [n.id, n]))
  const vals: number[] = [], ids: number[] = []
  let cur = start
  while (cur !== null && cur !== undefined) {
    const n = byId.get(cur)
    if (!n) return { vals, ids, broken: `dangling ${dir} -> ${cur}` }
    if (ids.includes(cur)) {
      if (flags.circular && cur === start) return { vals, ids, broken: null }
      return { vals, ids, broken: `${dir}-cycle not through start at node ${cur}` }
    }
    ids.push(cur); vals.push(n.value)
    if (ids.length > limit) return { vals, ids, broken: "too long" }
    cur = n[dir]
  }
  if (flags.circular && ids.length > 0) return { vals, ids, broken: `${dir} chain ends in null (not circular)` }
  return { vals, ids, broken: null }
}

function checkState(S: any, model: number[]): string | null {
  const { nodes, head } = S
  const tail = flags.doubly || flags.circular ? S.tail : undefined
  if (model.length === 0) {
    if (head !== null || nodes.length !== 0 || (tail !== undefined && tail !== null)) return "non-empty state for empty list"
    return null
  }
  const f = walk(nodes, head, "next", nodes.length + 1)
  if (f.broken) return "forward: " + f.broken
  if (JSON.stringify(f.vals) !== JSON.stringify(model)) return `forward ${JSON.stringify(f.vals)} != model ${JSON.stringify(model)}`
  if (f.ids.length !== nodes.length) return "unreachable nodes in node array"
  if (tail !== undefined && f.ids[f.ids.length - 1] !== tail) return "tail is not the last node"
  if (flags.doubly) {
    const b = walk(nodes, tail, "prev", nodes.length + 1)
    if (b.broken) return "backward: " + b.broken
    if (JSON.stringify(b.vals) !== JSON.stringify([...model].reverse())) return `backward ${JSON.stringify(b.vals)} != reversed model`
    const byId = new Map<number, any>(nodes.map((n: any) => [n.id, n]))
    for (const n of nodes) if (n.next !== null && byId.get(n.next)?.prev !== n.id) return `next/prev mismatch at node ${n.id}`
    if (!flags.circular && byId.get(head)?.prev !== null) return "head.prev is not null"
  }
  if (flags.circular) {
    const byId = new Map<number, any>(nodes.map((n: any) => [n.id, n]))
    if (byId.get(tail)?.next !== head) return "tail.next != head"
    if (flags.doubly && byId.get(head)?.prev !== tail) return "head.prev != tail"
  } else if (nodes.find((n: any) => n.id === (tail ?? f.ids[f.ids.length - 1]))?.next !== null) return "last.next is not null"
  return null
}

function checkFrame(st: any): string | null {
  const ids = new Set<number>(st.nodes.map((n: any) => n.id))
  if (st.head !== null && !ids.has(st.head)) return "head points to missing node"
  if (st.tail !== undefined && st.tail !== null && !ids.has(st.tail)) return "tail points to missing node"
  for (const n of st.nodes) {
    if (n.next !== null && !ids.has(n.next)) return `node ${n.id}.next -> missing ${n.next}`
    if (flags.doubly && n.prev !== null && n.prev !== undefined && !ids.has(n.prev)) return `node ${n.id}.prev -> missing ${n.prev}`
  }
  for (const h of st.highlightedNodes ?? []) if (!ids.has(h)) return `highlight of missing node ${h}`
  return null
}

// ---- one click + all checks ------------------------------------------------------------------
type Fail = { cat: string; detail: string }
function click(S: any, model: number[], op: Op): { model: number[]; fails: Fail[] } {
  const fails: Fail[] = []
  S.inputValue = op.value
  S.positionInput = op.position
  S.inputError = ""
  const before = S.steps.length
  try {
    L.click(S, op.kind)
  } catch (e: any) {
    fails.push({ cat: e instanceof L.Hang ? "hang" : "crash", detail: String(e.message) })
    return { model, fails }
  }
  const newSteps = S.steps.slice(before)
  const v = parseNum(op.value)
  const p = parseNum(op.position)
  let m = [...model]
  switch (op.kind) {
    case "insertBeginning": if (v !== null) m.unshift(v); break
    case "insertEnd": if (v !== null) m.push(v); break
    case "insertPosition":
      if (v === null && p !== null && p >= 0 && S.inputError === "") fails.push({ cat: "validation", detail: `invalid value ${JSON.stringify(op.value)} silently ignored (no error message)` })
      if (v !== null && p !== null && p >= 0 && p <= m.length) m.splice(p, 0, v)
      break
    case "deleteBeginning": m.shift(); break
    case "deleteEnd": m.pop(); break
    case "deletePosition": if (p !== null && p >= 0 && p < m.length) m.splice(p, 1); break
    case "search": {
      if (v === null) break
      const last = newSteps[newSteps.length - 1]?.description ?? ""
      const idx = m.indexOf(v)
      const ok = idx >= 0 ? last === `Found ${v} at position ${idx}` : /not found|empty/.test(last)
      if (!ok) fails.push({ cat: "result", detail: `search ${v} in ${JSON.stringify(m)}: "${last}"` })
      break
    }
    default: {
      const exp = op.kind === "traverseBackward" ? [...m].reverse() : m
      const visits = newSteps.length - 1
      if (m.length > 0 && visits !== m.length) fails.push({ cat: "result", detail: `${op.kind} of ${JSON.stringify(m)} showed ${visits} visit frames` })
      const last = newSteps[newSteps.length - 1]?.description ?? ""
      if (m.length > 0 && !last.includes(exp.join(op.kind === "traverseBackward" ? " ← " : " → "))) fails.push({ cat: "result", detail: `${op.kind} caption "${last}"` })
    }
  }
  const sErr = checkState(S, m)
  if (sErr) fails.push({ cat: "structure", detail: sErr })
  for (const st of newSteps) {
    const fErr = checkFrame(st)
    if (fErr) { fails.push({ cat: "frame", detail: `${st.operation}: ${fErr}` }); break }
  }
  for (const st of newSteps) {
    const r = methodRange(st.operation)
    if (!r || st.activeCodeLine < r[0] || st.activeCodeLine > r[1]) {
      fails.push({ cat: "codeLine", detail: `${st.operation} frame "${st.description}" highlights line ${st.activeCodeLine} ${JSON.stringify(CODE[st.activeCodeLine])}` + (r ? ` outside ${METHOD[st.operation]}() [${r[0]}..${r[1]}]` : ` (no ${METHOD[st.operation]}() in listing)`) })
      break
    }
  }
  return { model: m, fails }
}

function runSeq(seq: Op[]): { fails: Fail[]; at: number } {
  const S = L.newLegacyState()
  let model: number[] = []
  const all: Fail[] = []
  let at = -1
  for (let i = 0; i < seq.length; i++) {
    const r = click(S, model, seq[i])
    model = r.model
    for (const f of r.fails) if (!all.some((g) => g.cat === f.cat)) { all.push(f); if (at < 0) at = i }
    if (r.fails.some((f) => f.cat === "hang" || f.cat === "crash")) break
  }
  return { fails: all, at }
}

// ---- random sequences (no default example / random generator in the UI: the list starts empty) ----
let seed = 12345
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const N = 20000
const catSeq: Record<string, number> = {}
const catOp: Record<string, Record<string, number>> = {}
const opCount: Record<string, number> = {}
let failingSeqs = 0
for (let k = 0; k < N; k++) {
  const S = L.newLegacyState()
  let model: number[] = []
  const len = ri(1, 20)
  const seen = new Set<string>()
  for (let i = 0; i < len; i++) {
    const kind = OPS[ri(0, OPS.length - 1)]
    const bad = rnd() < 0.05
    const op: Op = {
      kind,
      value: bad ? ["", "abc", " "][ri(0, 2)] : String(ri(-20, 20)),
      position: rnd() < 0.05 ? ["", "x", "-1"][ri(0, 2)] : String(ri(0, model.length + 1)),
    }
    opCount[kind] = (opCount[kind] ?? 0) + 1
    const r = click(S, model, op)
    model = r.model
    for (const f of r.fails) {
      seen.add(f.cat)
      catOp[f.cat] ??= {}
      catOp[f.cat][kind] = (catOp[f.cat][kind] ?? 0) + 1
    }
    if (r.fails.some((f) => f.cat === "hang" || f.cat === "crash")) break
  }
  if (seen.size) failingSeqs++
  for (const c of seen) catSeq[c] = (catSeq[c] ?? 0) + 1
}
console.log(`== ${mod}: ${N} random click sequences (length 1..20, values -20..20, positions 0..size+1, 5% malformed input)`)
console.log(`sequences with >=1 defect: ${failingSeqs} (${((100 * failingSeqs) / N).toFixed(1)}%)`)
for (const [c, n] of Object.entries(catSeq)) console.log(`  ${c}: ${n} sequences (${((100 * n) / N).toFixed(1)}%); failing clicks by op: ${JSON.stringify(catOp[c])}`)
console.log(`  clicks per op: ${JSON.stringify(opCount)}`)

// ---- exhaustive short sequences for minimal counterexamples ------------------------------------
const alphabet: Op[] = []
for (const kind of OPS) {
  if (kind === "insertBeginning" || kind === "insertEnd" || kind === "search") for (const v of ["1", "2"]) alphabet.push({ kind, value: v, position: "" })
  else if (kind === "insertPosition") { for (const v of ["1", "2"]) for (const p of ["0", "1", "2"]) alphabet.push({ kind, value: v, position: p }); alphabet.push({ kind, value: "", position: "0" }) }
  else if (kind === "deletePosition") for (const p of ["0", "1", "2"]) alphabet.push({ kind, value: "", position: p })
  else alphabet.push({ kind, value: "", position: "" })
}
const minimal: Record<string, { seq: Op[]; detail: string }> = {}
const exCount: Record<string, number> = {}
let total = 0
// breadth-first by length, so the first hit per category is a shortest counterexample
const walkLen = (seq: Op[], len: number) => {
  if (seq.length === len) {
    total++
    const r = runSeq(seq)
    for (const f of r.fails) {
      exCount[f.cat] = (exCount[f.cat] ?? 0) + 1
      if (!minimal[f.cat]) minimal[f.cat] = { seq: [...seq], detail: f.detail }
    }
    return
  }
  for (const op of alphabet) { seq.push(op); walkLen(seq, len); seq.pop() }
}
for (let len = 1; len <= 3; len++) walkLen([], len)
const fmt = (o: Op) => o.kind + (o.value !== "" || o.kind.startsWith("insert") || o.kind === "search" ? `(${JSON.stringify(o.value)}` : "(") + (o.kind.endsWith("Position") ? `${o.kind.startsWith("insert") ? ", " : ""}pos ${o.position}` : "") + ")"
console.log(`exhaustive: all ${total} click sequences of length 1..3 over ${alphabet.length} clicks (values 1,2; positions 0..2; one empty-value insertPosition)`)
for (const [c, { seq, detail }] of Object.entries(minimal)) console.log(`  ${c}: ${exCount[c]} failing sequences; minimal: ${seq.map(fmt).join(" ; ")}  =>  ${detail}`)
