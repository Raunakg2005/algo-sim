// Frame generator for the greedy (fractional) knapsack visualizer.
// Pure function: given the items, the capacity and the "allow fractional items" switch, returns the four
// frames the visualizer shows: Initial State, Sort Items, Select Items, Final Result.
// Every decision (ordering by value/weight, "does it fit", "is the knapsack full") is made in exact
// rational arithmetic on the decimals the user typed, so rounding can neither reorder items whose ratios
// agree to two decimals nor leave a phantom 1e-16 of capacity that pulls in a "0.0%" item.

export interface FractionalItem {
  id: string
  name: string
  weight: number
  value: number
  ratio: number
  selected: boolean
  fraction?: number
}

export type FractionalKnapsackFrame = {
  phase: 0 | 1 | 2 | 3
  explanation: string
  /** items in the left-hand list (input order in frame 0, sorted afterwards) */
  list: FractionalItem[]
  /** items in the knapsack, in the order they were added */
  knapsack: FractionalItem[]
  remainingCapacity: number
  totalValue: number
  /** exact values as "p/q" strings, for checking */
  exact: { totalValue: string; remainingCapacity: string; fractions: Record<string, string> }
}

export const FRACTIONAL_STEP_NAMES = ["Initial State", "Sort Items", "Select Items", "Final Result"] as const

export const WELCOME_EXPLANATION =
  "Welcome to the Greedy Knapsack Algorithm simulation. Add items or use the default ones, then start the simulation."

// ---- exact rationals (BigInt numerator / positive denominator) ----
type Q = { n: bigint; d: bigint }
const ZERO = BigInt(0)
const ONE = BigInt(1)
const TEN = BigInt(10)
const babs = (a: bigint) => (a < ZERO ? -a : a)
const gcd = (a: bigint, b: bigint): bigint => {
  a = babs(a)
  b = babs(b)
  while (b !== ZERO) [a, b] = [b, a % b]
  return a
}
const q = (n: bigint, d: bigint): Q => {
  if (d < ZERO) [n, d] = [-n, -d]
  const g = gcd(n, d)
  return g > ONE ? { n: n / g, d: d / g } : { n, d }
}
const qadd = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d)
const qsub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d)
const qmul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d)
const qdiv = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n)
const qcmp = (a: Q, b: Q) => {
  const l = a.n * b.d
  const r = b.n * a.d
  return l < r ? -1 : l > r ? 1 : 0
}
const qnum = (a: Q) => Number(a.n) / Number(a.d)
const qstr = (a: Q) => `${a.n}/${a.d}`
const pow10 = (k: number) => {
  let p = ONE
  for (let i = 0; i < k; i++) p *= TEN
  return p
}

/** The exact rational written by the shortest decimal form of x (what the user typed, e.g. 0.1 -> 1/10). */
export function decimalToRational(x: number): { n: bigint; d: bigint } {
  if (!Number.isFinite(x)) throw new Error(`not a finite number: ${x}`)
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(x))
  if (!m) throw new Error(`unexpected number format: ${x}`)
  const frac = m[3] ?? ""
  let n = BigInt(m[2] + frac)
  let d = pow10(frac.length)
  const e = m[4] ? Number(m[4]) : 0
  if (e > 0) n *= pow10(e)
  else d *= pow10(-e)
  if (m[1] === "-") n = -n
  return q(n, d)
}

/** Ratio shown on the item cards (two decimals, display only; never used for ordering). */
export const displayRatio = (value: number, weight: number): number => Number.parseFloat((value / weight).toFixed(2))

const pct = (f: Q) => (qnum(f) * 100).toFixed(1)

/** Non-negative rational rounded half-up to two decimals, decided exactly (50.415 -> 50.42). */
const round2 = (a: Q): number => {
  const hundredths = (a.n * BigInt(200) + a.d) / (BigInt(2) * a.d)
  return Number(hundredths) / 100
}

export function generateFractionalKnapsackFrames(
  items: FractionalItem[],
  capacity: number,
  allowFractions: boolean,
): FractionalKnapsackFrame[] {
  if (!(Number.isFinite(capacity) && capacity > 0)) throw new Error("capacity must be a positive number")
  for (const it of items)
    if (!(Number.isFinite(it.weight) && it.weight > 0 && Number.isFinite(it.value) && it.value > 0))
      throw new Error(`item ${it.name}: weight and value must be positive numbers`)

  const base = items.map((it) => ({
    ...it,
    ratio: displayRatio(it.value, it.weight),
    selected: false,
    fraction: undefined as number | undefined,
  }))
  const W = items.map((it) => decimalToRational(it.weight))
  const V = items.map((it) => decimalToRational(it.value))
  const cap = decimalToRational(capacity)

  // descending exact value/weight; equal ratios keep the input order
  const order = items
    .map((_, i) => i)
    .sort((a, b) => qcmp(qdiv(V[b], W[b]), qdiv(V[a], W[a])) || a - b)

  const frames: FractionalKnapsackFrame[] = []
  const emptyExact = { totalValue: "0/1", remainingCapacity: qstr(cap), fractions: {} }

  frames.push({
    phase: 0,
    explanation: WELCOME_EXPLANATION,
    list: base.map((it) => ({ ...it })),
    knapsack: [],
    remainingCapacity: capacity,
    totalValue: 0,
    exact: emptyExact,
  })

  const sorted = order.map((i) => ({ ...base[i] }))
  frames.push({
    phase: 1,
    explanation: "Items are now sorted by value-to-weight ratio in descending order.",
    list: sorted.map((it) => ({ ...it })),
    knapsack: [],
    remainingCapacity: capacity,
    totalValue: 0,
    exact: emptyExact,
  })

  // greedy selection
  let remaining = cap
  let value: Q = { n: ZERO, d: ONE }
  const fractions: Record<string, string> = {}
  const chosen = new Map<number, number>() // position in `order` -> fraction (number)
  const log: string[] = []
  for (let k = 0; k < order.length; k++) {
    if (remaining.n === ZERO) break
    const i = order[k]
    const it = items[i]
    if (qcmp(remaining, W[i]) >= 0) {
      remaining = qsub(remaining, W[i])
      value = qadd(value, V[i])
      chosen.set(k, 1)
      fractions[it.id] = "1/1"
      log.push(`Added ${it.name} completely. Remaining capacity: ${qnum(remaining)}.`)
    } else if (allowFractions) {
      const f = qdiv(remaining, W[i])
      value = qadd(value, qmul(V[i], f))
      remaining = { n: ZERO, d: ONE }
      chosen.set(k, qnum(f))
      fractions[it.id] = qstr(f)
      log.push(`Added ${pct(f)}% of ${it.name}. Knapsack is now full.`)
    } else {
      log.push(`Cannot add ${it.name}. Not enough capacity left.`)
    }
  }
  if (log.length === 0) log.push("There are no items to add.")

  const selectedList = sorted.map((it, k) =>
    chosen.has(k) ? { ...it, selected: true, fraction: chosen.get(k) } : { ...it },
  )
  const knapsack = selectedList.filter((it) => it.selected)
  const remainingCapacity = qnum(remaining)
  const totalValue = round2(value)
  const exact = { totalValue: qstr(value), remainingCapacity: qstr(remaining), fractions }

  frames.push({
    phase: 2,
    explanation: log.join(" "),
    list: selectedList.map((it) => ({ ...it })),
    knapsack: knapsack.map((it) => ({ ...it })),
    remainingCapacity,
    totalValue,
    exact,
  })
  frames.push({
    phase: 3,
    explanation: `Final result: Total value: ${totalValue}. Remaining capacity: ${remainingCapacity}.`,
    list: selectedList.map((it) => ({ ...it })),
    knapsack: knapsack.map((it) => ({ ...it })),
    remainingCapacity,
    totalValue,
    exact,
  })
  return frames
}

/** Strict parser for the weight / value fields: a finite number > 0 (no trailing junk such as "12abc"). */
export function parsePositiveNumber(text: string): number | null {
  const t = text.trim()
  if (t === "") return null
  const v = Number(t)
  return Number.isFinite(v) && v > 0 ? v : null
}
