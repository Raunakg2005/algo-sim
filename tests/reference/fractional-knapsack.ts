// Independent oracle for the greedy knapsack: exact rational arithmetic (BigInt) on decimal inputs given
// as integer mantissa + number of decimal places, so no floating point is involved at all.

export type Rat = { num: bigint; den: bigint }
export type DecItem = { id: string; w: bigint; wScale: number; v: bigint; vScale: number }

const Z = BigInt(0)
const absB = (x: bigint) => (x < Z ? -x : x)
function g(a: bigint, b: bigint): bigint {
  a = absB(a)
  b = absB(b)
  while (b !== Z) {
    const t = a % b
    a = b
    b = t
  }
  return a
}
export function rat(num: bigint, den: bigint): Rat {
  if (den < Z) {
    num = -num
    den = -den
  }
  const d = g(num, den)
  return d > BigInt(1) ? { num: num / d, den: den / d } : { num, den }
}
const ten = (k: number) => BigInt("1" + "0".repeat(k))
export const dec = (mant: bigint, scale: number): Rat => rat(mant, ten(scale))
export const ratAdd = (a: Rat, b: Rat) => rat(a.num * b.den + b.num * a.den, a.den * b.den)
export const ratSub = (a: Rat, b: Rat) => rat(a.num * b.den - b.num * a.den, a.den * b.den)
export const ratMul = (a: Rat, b: Rat) => rat(a.num * b.num, a.den * b.den)
export const ratDiv = (a: Rat, b: Rat) => rat(a.num * b.den, a.den * b.num)
export const ratLess = (a: Rat, b: Rat) => a.num * b.den < b.num * a.den
export const ratEq = (a: Rat, b: Rat) => a.num * b.den === b.num * a.den
export const ratStr = (a: Rat) => `${a.num}/${a.den}`

/**
 * Textbook greedy: consider items by decreasing value/weight (ties: input order); take each whole item
 * that fits; with fractions allowed, take the fitting part of the first item that does not fit and stop.
 */
export function greedyKnapsack(items: DecItem[], capacity: Rat, fractions: boolean) {
  const W = items.map((it) => dec(it.w, it.wScale))
  const V = items.map((it) => dec(it.v, it.vScale))
  const idx = items.map((_, i) => i)
  // insertion sort (stable), descending ratio
  for (let a = 1; a < idx.length; a++) {
    const x = idx[a]
    let b = a - 1
    while (b >= 0 && ratLess(ratDiv(V[idx[b]], W[idx[b]]), ratDiv(V[x], W[x]))) {
      idx[b + 1] = idx[b]
      b--
    }
    idx[b + 1] = x
  }
  let room = capacity
  let total = rat(Z, BigInt(1))
  const taken: { id: string; fraction: Rat }[] = []
  for (const i of idx) {
    if (room.num === Z) break
    if (!ratLess(room, W[i])) {
      taken.push({ id: items[i].id, fraction: rat(BigInt(1), BigInt(1)) })
      room = ratSub(room, W[i])
      total = ratAdd(total, V[i])
    } else if (fractions) {
      const f = ratDiv(room, W[i])
      taken.push({ id: items[i].id, fraction: f })
      total = ratAdd(total, ratMul(V[i], f))
      room = rat(Z, BigInt(1))
    }
  }
  return { order: idx.map((i) => items[i].id), taken, total, room }
}
