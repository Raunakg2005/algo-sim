// Independent oracles for matrix-chain multiplication: explicit enumeration of every parenthesisation.

export type Tree = number | [Tree, Tree]

/** All full binary trees over leaves i..j (Catalan(j-i) of them). */
export function allTrees(i: number, j: number): Tree[] {
  if (i === j) return [i]
  const out: Tree[] = []
  for (let k = i; k < j; k++) for (const a of allTrees(i, k)) for (const b of allTrees(k + 1, j)) out.push([a, b])
  return out
}

/** Scalar multiplications needed to evaluate a tree; matrix t is p[t] x p[t+1]. Exact (BigInt). */
export function treeCost(t: Tree, p: number[]): { cost: bigint; rows: bigint; cols: bigint } {
  if (typeof t === "number") return { cost: BigInt(0), rows: BigInt(p[t]), cols: BigInt(p[t + 1]) }
  const a = treeCost(t[0], p)
  const b = treeCost(t[1], p)
  return { cost: a.cost + b.cost + a.rows * a.cols * b.cols, rows: a.rows, cols: b.cols }
}

/** Minimum over every parenthesisation of M(i+1)..M(j+1). */
export function bruteForceMin(p: number[], i: number, j: number): bigint {
  let best = BigInt(-1)
  for (const t of allTrees(i, j)) {
    const c = treeCost(t, p).cost
    if (best < BigInt(0) || c < best) best = c
  }
  return best
}

/** Parses "((M1 × M2) × M3)" into a tree; throws on malformed text. */
export function parseParens(s: string): Tree {
  let pos = 0
  const expect = (lit: string) => {
    if (s.slice(pos, pos + lit.length) !== lit) throw new Error(`expected "${lit}" at ${pos} in ${s}`)
    pos += lit.length
  }
  const node = (): Tree => {
    if (s[pos] === "(") {
      pos++
      const a = node()
      expect(" × ")
      const b = node()
      expect(")")
      return [a, b]
    }
    const m = /^M(\d+)/.exec(s.slice(pos))
    if (!m) throw new Error(`expected a matrix name at ${pos} in ${s}`)
    pos += m[0].length
    return Number(m[1]) - 1
  }
  const t = node()
  if (pos !== s.length) throw new Error(`trailing text in ${s}`)
  return t
}

export const leaves = (t: Tree): number[] => (typeof t === "number" ? [t] : [...leaves(t[0]), ...leaves(t[1])])
