// Dijkstra + TSP component flows through _minireact.ts (original HEAD vs fixed working tree).
import { createRoot, extractComponent } from "./_minireact.ts"
const L = "docs/verification/legacy"
const P = ""
type AnyApi = Record<string, any>
const load = async (src: string, out: string, expose: string[], rw: Record<string, string>) => {
  extractComponent(src, out, expose, rw)
  return (await import(`file:///${out}?${Date.now()}`)).Comp as (h: unknown) => AnyApi
}
const res: Record<string, unknown> = {}
for (const [ver, src] of [["original", `${L}/dijkstra/original.tsx`], ["fixed", `${P}/components/dijkstra-simulation.tsx`]] as const) {
  const Comp = await load(src, `${L}/dijkstra/_ui_${ver}.ts`, ["loadExampleGraph", "startAlgorithm", "parseBulkInput", "setBulkInput", "setSourceNode", "setTargetNode", "steps", "inputError", "graph"],
    { "@/lib/engines/dijkstra": `file:///${P}/lib/engines/dijkstra.ts` })
  const root = createRoot(Comp)
  root.act((a) => a.loadExampleGraph())
  root.act((a) => a.startAlgorithm())
  const ex = root.api.steps.at(-1)
  const nullFrames = root.api.steps.filter((s: any) => Object.values(s.nodeStates).some((x: any) => x.distance === null)).length
  const r2 = createRoot(Comp)
  r2.act((a) => a.setBulkInput("A,B,C\nA,B,1\nA,C,2\nC,B,-5"))
  r2.act((a) => a.parseBulkInput())
  r2.act((a) => a.setSourceNode("node-A"))
  r2.act((a) => a.startAlgorithm())
  const neg = { error: r2.api.inputError, claimedB: r2.api.steps.at(-1)?.nodeStates["node-B"]?.distance }
  res[`dijkstra_${ver}`] = { exampleLast: ex.description, framesWithNullDistance: nullFrames + "/" + root.api.steps.length, negativeEdgeGraph: neg }
}
for (const [ver, src] of [["original", `${L}/tsp/original.tsx`], ["fixed", `${P}/components/tsp-simulation.tsx`]] as const) {
  const Comp = await load(src, `${L}/tsp/_ui_${ver}.ts`, ["generateRandomProblem", "solveProblem", "resetSimulation", "setStartCity", "handleCoordinatesChange", "cities", "distances", "startCity", "steps", "error"],
    { "@/lib/engines/tsp": `file:///${P}/lib/engines/tsp.ts`, "@/lib/tsp-solver": `file:///${L}/tsp/tsp-solver.ts`, "@/lib/tsp-utils": `file:///${P}/lib/tsp-utils.ts` })
  const root = createRoot(Comp)
  root.act((a) => a.generateRandomProblem(5))
  root.act((a) => { a.setStartCity(4); a.resetSimulation(a.cities, a.distances, 4) }) // click start-city button "E"
  const before = root.api.steps.at(-1).tour
  let thrown = ""
  try { root.act((a) => a.handleCoordinatesChange(a.cities.slice(0, 4))); root.act((a) => a.solveProblem()) } catch (e) { thrown = String(e) }
  const after = root.api.steps.at(-1)
  const tooMany = createRoot(Comp)
  const big = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `P${i}`, x: (i * 37) % 400, y: (i * 91) % 400 }))
  tooMany.act((a) => a.handleCoordinatesChange(big))
  let bigOutcome = ""
  if (ver === "original") bigOutcome = "not run: the original solves 12 cities with ~2^12 frame copies (10 cities already exhausts a 1 GB heap, see tsp/scale.ts)"
  else { tooMany.act((a) => a.solveProblem()); bigOutcome = `error="${tooMany.api.error}", frames=${tooMany.api.steps.length}` }
  res[`tsp_${ver}`] = { thrownOnSolveAfterDeletingStartCity: thrown, tourBefore: before, startCityAfter: root.api.startCity, lastFrameAfter: after?.message, twelveCities: bigOutcome }
}
console.log(JSON.stringify(res, null, 1))
