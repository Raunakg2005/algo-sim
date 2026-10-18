import { legacy } from "./legacy.ts"
import { bruteForceKnapsack, suffixKnapsackTable } from "file:///tests/reference/knapsack-bnb.ts"
type KnapsackItem = { id: number; weight: number; value: number; ratio: number }
type KnapsackStep = any
// legacy branches on the rounded ratio, stable
const branchingOrder = (items: KnapsackItem[]) => [...items].sort((a, b) => b.ratio - a.ratio)
type Case = { items: KnapsackItem[]; capacity: number }
// items as the UI builds them: positive integers, ratio rounded to 2 decimals, ids 1..n
const mk = (wv: [number, number][]): KnapsackItem[] =>
  wv.map(([weight, value], i) => ({ id: i + 1, weight, value, ratio: Number.parseFloat((value / weight).toFixed(2)) }))
function checkRun({ items, capacity }: Case, steps: KnapsackStep[]): string[] {
  const errs: string[] = []
  const order = branchingOrder(items)
  const suffix = suffixKnapsackTable(order, capacity)
  const last = steps[steps.length - 1]
  const finalNodes = new Map(last.nodes.map((nd) => [nd.id, nd]))
  const subtreeBest = (id: number) => {
    const nd = finalNodes.get(id)!
    return nd.value + suffix[nd.level][capacity - nd.weight]
  }
  const byId = new Map(items.map((it) => [it.id, it]))

  // static checks on every node ever created
  for (const nd of last.nodes) {
    if (nd.weight > capacity) errs.push(`node ${nd.id} over capacity`)
    if (nd.bound < subtreeBest(nd.id)) errs.push(`node ${nd.id}: bound ${nd.bound} < subtree optimum ${subtreeBest(nd.id)}`)
    const w = nd.items.reduce((s, id) => s + byId.get(id)!.weight, 0)
    const v = nd.items.reduce((s, id) => s + byId.get(id)!.value, 0)
    if (w !== nd.weight || v !== nd.value) errs.push(`node ${nd.id}: weight/value do not match its items`)
    if (nd.parent !== null) {
      const p = finalNodes.get(nd.parent)!
      const decided = order[p.level].id
      const want = nd.include ? [...p.items, decided] : p.items
      if (nd.level !== p.level + 1 || want.join() !== nd.items.join()) errs.push(`node ${nd.id}: not a child of ${p.id}`)
    }
  }

  const prunedAt = new Map<number, number>()
  let prevBest = 0
  steps.forEach((s, k) => {
    const nodes = new Map(s.nodes.map((nd) => [nd.id, nd]))
    if (!nodes.has(s.currentNode)) errs.push(`frame ${k}: current node missing`)
    if (s.bestValue < prevBest) errs.push(`frame ${k}: best value decreased`)
    prevBest = s.bestValue
    if (s.bestNode !== null) {
      const b = nodes.get(s.bestNode)
      if (!b || b.value !== s.bestValue || b.level !== order.length) errs.push(`frame ${k}: best node is not a complete solution worth bestValue`)
      else if (b.pruned) errs.push(`frame ${k}: best node drawn as pruned`)
    } else if (s.bestValue !== 0) errs.push(`frame ${k}: best value without best node`)
    if (s.phase === "prune") {
      const id = Number(s.description.match(/Prune node (\d+)/)![1])
      if (id !== s.currentNode) errs.push(`frame ${k}: prune caption names another node`)
      if (!prunedAt.has(id)) prunedAt.set(id, k)
      // a pruned node really cannot beat the incumbent
      if (subtreeBest(id) > s.bestValue) errs.push(`frame ${k}: pruned node ${id} could reach ${subtreeBest(id)} > ${s.bestValue}`)
    }
    // pruned flags appear exactly from the frame that prunes the node
    for (const nd of s.nodes) {
      const at = prunedAt.get(nd.id)
      if (nd.pruned !== (at !== undefined && at <= k)) errs.push(`frame ${k}: node ${nd.id} pruned flag out of step`)
    }
    for (const id of s.activeNodes) {
      const nd = nodes.get(id)
      if (!nd || nd.pruned) errs.push(`frame ${k}: queued node ${id} missing or pruned`)
    }
    if (s.description.startsWith("Select node")) {
      const cur = nodes.get(s.currentNode)!
      for (const id of s.activeNodes) if (nodes.get(id)!.bound > cur.bound) errs.push(`frame ${k}: selected node is not the highest bound`)
    }
  })
  return errs.slice(0, 5)
}

let seed = 77; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }; const ri = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1))
const kinds: Record<string, number> = {}
let fails = 0, wrong = 0
const N = 5000
for (let k = 0; k < N; k++) {
  const n = ri(1, 8); const items = mk(Array.from({ length: n }, () => [ri(1, 30), ri(1, 40)] as [number, number])); const capacity = ri(1, 60)
  const steps = legacy(items, capacity).steps
  const errs = checkRun({ items, capacity }, steps)
  if (steps.at(-1).bestValue !== bruteForceKnapsack(items, capacity)) wrong++
  if (errs.length) fails++
  for (const e of errs) { const kind = e.replace(/\d+/g, "#"); kinds[kind] = (kinds[kind] ?? 0) + 1 }
}
console.log(`legacy under the engine's frame checker (typed small ints): ${fails}/${N} runs violate; wrong optimum ${wrong}`)
console.log(kinds)
