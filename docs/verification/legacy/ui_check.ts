// Drives the "Random Graph" / "Load Example" / "Random Example" buttons of the ORIGINAL (HEAD) and the FIXED
// components through _minireact.ts, and checks that the graph that gets built is the one that is shown.
import { createRoot, extractComponent } from "./_minireact.ts"

const L = "docs/verification/legacy"
const P = ""
const rw = (m: string) => ({ [`@/lib/engines/${m}`]: `file:///${P}/lib/engines/${m}.ts` })
const rnd = (n: number) => Math.floor(Math.random() * n)
const lab = (i: number) => String.fromCharCode(65 + i)

type AnyApi = Record<string, any>
async function load(src: string, out: string, expose: string[], mod: string) {
  extractComponent(src, out, expose, rw(mod))
  return (await import(`file:///${out}?${Date.now()}`)).Comp as (h: unknown) => AnyApi
}

function shownMatchesGraph(api: AnyApi): boolean {
  const n = api.numNodes
  const shown = new Set<string>()
  api.inputMatrix.forEach((row: string[], i: number) => row.forEach((v, j) => { if (i !== j && v !== "∞" && v !== "") shown.add(`node-${lab(i)}>node-${lab(j)}:${+v}`) }))
  const ge = new Set(api.graph.edges.map((e: any) => `${e.source}>${e.target}:${e.weight}`))
  return api.graph.nodes.length === n && shown.size === ge.size && [...shown].every((e) => ge.has(e))
}

async function matrixModule(name: string, file: string, mod: string, hasSource: boolean) {
  const expose = ["generateRandomGraph", "generateGraph", "startAlgorithm", "numNodes", "inputMatrix", "graph", "steps", "inputError"].concat(hasSource ? ["sourceNode"] : [])
  const res: Record<string, Record<string, number>> = {}
  for (const [ver, src] of [["original", `${L}/${name}/original.tsx`], ["fixed", `${P}/components/${file}`]] as const) {
    const Comp = await load(src, `${L}/${name}/_ui_${ver}.ts`, expose, mod)
    const r = { clicks: 0, graphDiffersFromShownMatrix: 0, shownMatrixWiped: 0, sourceOutsideGraph: 0, startedOk: 0 }
    for (let t = 0; t < 1000; t++) {
      const root = createRoot(Comp)
      for (let k = 0, m = 1 + rnd(4); k < m; k++) {
        root.act((a) => a.generateRandomGraph())
        const a = root.api
        r.clicks++
        if (!shownMatchesGraph(a)) r.graphDiffersFromShownMatrix++
        if (a.inputMatrix.every((row: string[], i: number) => row.every((v, j) => (i === j ? v === "0" : v === "∞")))) r.shownMatrixWiped++
        if (hasSource && !a.graph.nodes.some((x: any) => x.label === a.sourceNode)) r.sourceOutsideGraph++
      }
      root.act((a) => a.startAlgorithm())
      if (root.api.steps.length > 1) r.startedOk++
    }
    res[ver] = r
  }
  return res
}

async function multistage() {
  const expose = ["loadExample", "generateRandomExample", "generateGraph", "startAlgorithm", "graph", "numStages", "nodesPerStage", "steps", "setNumStages"]
  const structure = (g: any) => Array.from({ length: g.stages }, (_, s) => g.nodes.filter((n: any) => n.stage === s).length)
  const res: Record<string, Record<string, number>> = {}
  for (const [ver, src] of [["original", `${L}/multistage/original.tsx`], ["fixed", `${P}/components/multistage-graph-optimization.tsx`]] as const) {
    const Comp = await load(src, `${L}/multistage/_ui_${ver}.ts`, expose, "multistage")
    const r = { loadClicks: 0, loadWrongGraph: 0, loadOptimumNot13: 0, randomClicks: 0, randomWrongStructure: 0 }
    for (let t = 0; t < 1000; t++) {
      const root = createRoot(Comp)
      if (rnd(2)) root.act((a) => a.generateGraph())
      if (t % 2 === 0) {
        root.act((a) => a.loadExample())
        r.loadClicks++
        const g = root.api.graph
        if (JSON.stringify(structure(g)) !== "[1,3,2,1]" || g.edges.length !== 11) r.loadWrongGraph++
        root.act((a) => a.startAlgorithm())
        if (!String(root.api.steps.at(-1)?.description).endsWith("= 13")) r.loadOptimumNot13++
      } else {
        root.act((a) => a.generateRandomExample())
        r.randomClicks++
        const a = root.api
        if (JSON.stringify(structure(a.graph)) !== JSON.stringify(a.nodesPerStage.slice(0, a.numStages))) r.randomWrongStructure++
      }
    }
    res[ver] = r
  }
  return res
}

const out = {
  bellmanFord: await matrixModule("bellman-ford", "bellman-ford-simulation.tsx", "bellman-ford", true),
  floydWarshall: await matrixModule("floyd-warshall", "floyd-warshall.tsx", "floyd-warshall", false),
  multistage: await multistage(),
}
console.log(JSON.stringify(out, null, 1))
