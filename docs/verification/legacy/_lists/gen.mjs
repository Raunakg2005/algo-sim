// Builds legacy/<module>/legacy.ts from the HEAD copy of the component (original.tsx):
// the interfaces, the code listing and every handler from `const addStep` up to `const clearList`
// are copied VERBATIM; React state is replaced by a snapshot (reads) + pending writes applied
// after the handler returns, which is exactly React's batching semantics for one click.
import fs from "node:fs"
import path from "node:path"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..")
const mods = {
  "singly-linked-list": { traverse: {} },
  "doubly-linked-list": { traverse: { traverseForward: "traverseForward", traverseBackward: "traverseBackward" } },
  "circular-linked-list": { traverse: { traverse: "traverseList" } },
  "circular-doubly-linked-list": { traverse: { traverseForward: "traverseForward", traverseBackward: "traverseBackward" } },
}

for (const [mod, cfg] of Object.entries(mods)) {
  const src = fs.readFileSync(path.join(root, mod, "original.tsx"), "utf8")
  const ifStart = src.indexOf("interface ")
  const codeStart = src.search(/const \w+Code = \[/)
  const codeName = src.slice(codeStart).match(/const (\w+Code)/)[1]
  const codeEnd = src.indexOf("\n]\n", codeStart) + 3
  const hStart = src.indexOf("  const addStep = (")
  const hEnd = src.indexOf("  const clearList = () => {")
  const handlers = src.slice(hStart, hEnd)
  const ops = {
    insertBeginning: "insertAtBeginning",
    insertEnd: "insertAtEnd",
    insertPosition: "insertAtPosition",
    deleteBeginning: "deleteFromBeginning",
    deleteEnd: "deleteFromEnd",
    search: "searchElement",
    ...cfg.traverse,
  }
  if (handlers.includes("const deleteAtPosition")) ops.deletePosition = "deleteAtPosition"
  const out = `// AUTO-GENERATED from git HEAD:components/${mod}-visualizer.tsx by gen.mjs - do not edit
${src.slice(ifStart, codeStart)}
export ${src.slice(codeStart, codeEnd)}
export const CODE: string[] = ${codeName}
export const OPS: string[] = ${JSON.stringify(Object.keys(ops))}

export class Hang extends Error {}
export type LegacyState = { nodes: any[]; head: number | null; tail: number | null; nextId: number; steps: any[]; inputValue: string; positionInput: string; inputError: string }
export const STEP_LIMIT = 500 // frames per click; a legitimate click on <= 21 nodes adds < 50

export function newLegacyState(): LegacyState {
  return { nodes: [], head: null, tail: null, nextId: 1, steps: [], inputValue: "", positionInput: "", inputError: "" }
}

// one button click: reads see the render-time snapshot, writes are applied after the handler returns
export function click(S: LegacyState, op: string): void {
  const nodes = S.nodes, head = S.head, tail = S.tail, nextId = S.nextId
  const inputValue = S.inputValue, positionInput = S.positionInput
  const pending: Record<string, any> = {}
  const start = S.steps.length
  const setNodes = (v: any) => { pending.nodes = v }
  const setHead = (v: any) => { pending.head = v }
  const setTail = (v: any) => { pending.tail = v }
  const setNextId = (v: any) => { pending.nextId = v }
  const setInputValue = (v: any) => { pending.inputValue = v }
  const setPositionInput = (v: any) => { pending.positionInput = v }
  const setInputError = (v: any) => { pending.inputError = v }
  const setSteps = (f: any) => { S.steps = f(S.steps); if (S.steps.length - start > STEP_LIMIT) throw new Hang("one click produced more than " + STEP_LIMIT + " frames (infinite loop)") }
  void tail; void setTail
${handlers}
  const table: Record<string, () => void> = { ${Object.entries(ops).map(([k, v]) => `${k}: ${v}`).join(", ")} }
  table[op]()
  Object.assign(S, pending)
}
`
  fs.writeFileSync(path.join(root, mod, "legacy.ts"), out)
  console.log(mod, "ops:", Object.keys(ops).join(","))
}
