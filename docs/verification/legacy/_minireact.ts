// A minimal React-hooks runtime (useState / useEffect / useRef with batched updates) used to execute the
// non-JSX part of a component (everything before its JSX `return (`) in node, so that button handlers can
// be driven exactly as the browser would: handlers close over the render they came from, setState calls are
// batched and applied after the handler, effects run after each render when their deps change, and
// setTimeout callbacks run after the click has been rendered (still with their stale closure).
import { readFileSync, writeFileSync } from "node:fs"

type Hooks = { useState: unknown; useEffect: unknown; useRef: unknown }

/** Writes `<out>`: the component's type block + body as `export function Comp(hooks)`, returning `expose`. */
export function extractComponent(src: string, out: string, expose: string[], importRewrites: Record<string, string>) {
  const text = readFileSync(src, "utf8").replace(/\r\n/g, "\n")
  const fnStart = text.indexOf("export default function")
  const bodyStart = text.indexOf("{\n", fnStart) + 2
  const jsxReturn = text.lastIndexOf("\n  return (\n")
  const lastImport = text.lastIndexOf("\nimport ", fnStart)
  const afterImports = text.indexOf("\n\n", text.indexOf(" from ", lastImport))
  const imports = text.slice(0, afterImports).split("\n").join("\n")
  const keptImports: string[] = []
  // keep only imports whose module is rewritten (engines); drop React / UI imports
  const importRe = /import\s+([\s\S]*?)\s+from\s+"([^"]+)"/g
  for (const m of imports.matchAll(importRe)) if (importRewrites[m[2]]) keptImports.push(`import ${m[1]} from "${importRewrites[m[2]]}"`)
  const types = text.slice(afterImports, fnStart)
  const body = text.slice(bodyStart, jsxReturn)
  writeFileSync(
    out,
    `// GENERATED from ${src}\n${keptImports.join("\n")}\n${types}\nexport function Comp({ useState, useEffect, useRef }: any) {\n${body}\n  return { ${expose.join(", ")} }\n}\n`,
  )
}

export function createRoot<T>(Comp: (h: Hooks) => T) {
  const hooks: { v?: unknown; deps?: unknown[]; current?: unknown }[] = []
  let idx = 0
  let queue: (() => void)[] = []
  let effects: (() => void)[] = []
  let api!: T
  const useState = (init: unknown) => {
    const i = idx++
    if (!hooks[i]) hooks[i] = { v: typeof init === "function" ? (init as () => unknown)() : init }
    const h = hooks[i]
    return [h.v, (u: unknown) => queue.push(() => { h.v = typeof u === "function" ? (u as (p: unknown) => unknown)(h.v) : u })]
  }
  const useRef = (init: unknown) => {
    const i = idx++
    if (!hooks[i]) hooks[i] = { current: init }
    return hooks[i]
  }
  const useEffect = (fn: () => void, deps?: unknown[]) => {
    const i = idx++
    const prev = hooks[i]
    const changed = !prev || !deps || deps.some((d, k) => !Object.is(d, prev.deps![k]))
    hooks[i] = { deps }
    if (changed) effects.push(fn)
  }
  const timers: (() => void)[] = []
  const g = globalThis as unknown as Record<string, unknown>
  g.window = { addEventListener() {}, removeEventListener() {} }
  g.setTimeout = (fn: () => void) => { timers.push(fn); return 0 }
  g.clearTimeout = () => {}
  const render = () => {
    idx = 0
    effects = []
    api = Comp({ useState, useEffect, useRef })
    for (const f of effects) f()
  }
  const settle = () => {
    for (let guard = 0; queue.length; guard++) {
      if (guard > 200) throw new Error("render loop")
      const q = queue
      queue = []
      q.forEach((f) => f())
      render()
    }
  }
  render()
  settle()
  timers.length = 0 // ignore mount-time timers (none expected)
  return {
    get api() { return api },
    act(fn: (a: T) => void) {
      fn(api)
      settle()
      while (timers.length) { timers.shift()!(); settle() }
      timers.length = 0
    },
  }
}
