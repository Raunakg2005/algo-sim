// Step generator for the 0/1 Knapsack visualizer (bottom-up DP table + backtracking).
// Pure function: given the items and the capacity W, returns every frame the visualizer plays.
// Row i of the table is items[i-1]; captions name items by their id (what the item cards show).

export type KnapsackItem = {
  id: number
  weight: number
  value: number
}

export type KnapsackCell = {
  value: number
  includeItem: boolean
  highlighted?: boolean
  comparing?: boolean
  fromAbove?: boolean
  fromDiagonal?: boolean
}

export type KnapsackStep = {
  phase: "init" | "compute" | "backtrack" | "complete"
  description: string
  currentRow?: number
  currentCol?: number
  table: KnapsackCell[][]
  selectedItems: number[]
  totalValue: number
  totalWeight: number
  comparingCells?: { row: number; col: number }[]
}

// There are about 3nW frames. Rows of the table are never modified in place: an update replaces the
// row, and a frame copies only the rows it marks, so frames share every unchanged row (copy-on-write).
// The input is still bounded so the trace stays small enough for low-end lab machines.
export const MAX_KNAPSACK_ITEMS = 10
export const MAX_KNAPSACK_CAPACITY = 50

type Mark = [row: number, col: number, flags: Partial<KnapsackCell>]

// a frame's table: the current rows, with copies of just the rows that carry highlight flags
const view = (dp: KnapsackCell[][], marks: Mark[] = []): KnapsackCell[][] => {
  const t = dp.slice()
  const copied = new Set<number>()
  for (const [r, c, flags] of marks) {
    if (!copied.has(r)) {
      t[r] = t[r].slice()
      copied.add(r)
    }
    t[r][c] = { ...t[r][c], ...flags }
  }
  return t
}

// replace one cell of the working table without touching rows that frames already reference
const setCell = (dp: KnapsackCell[][], r: number, c: number, cell: KnapsackCell): void => {
  dp[r] = dp[r].slice()
  dp[r][c] = cell
}

/** Strict parser for the weight / value / capacity fields: a whole number >= 1 written in digits. */
export function parsePositiveInteger(text: string): number | null {
  const t = text.trim()
  if (!/^\d+$/.test(t)) return null
  const v = Number(t)
  return Number.isSafeInteger(v) && v > 0 ? v : null
}

/** Id for a newly added item: one more than the largest id in use (ids stay unique after removals). */
export const nextItemId = (items: KnapsackItem[]): number => items.reduce((m, it) => Math.max(m, it.id), 0) + 1

export function generateKnapsackSteps(items: KnapsackItem[], capacity: number): KnapsackStep[] {
  const n = items.length
  const w = capacity
  if (n === 0 || n > MAX_KNAPSACK_ITEMS) throw new Error(`between 1 and ${MAX_KNAPSACK_ITEMS} items are required`)
  if (!Number.isInteger(w) || w < 1 || w > MAX_KNAPSACK_CAPACITY) throw new Error(`capacity must be an integer in 1..${MAX_KNAPSACK_CAPACITY}`)
  if (!items.every((it) => Number.isInteger(it.weight) && it.weight > 0 && Number.isFinite(it.value) && it.value > 0)) {
    throw new Error("weights must be positive integers and values positive numbers")
  }

  const steps: KnapsackStep[] = []
  const dp: KnapsackCell[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: w + 1 }, () => ({ value: 0, includeItem: false })),
  )

  steps.push({
    phase: "init",
    description: "Initialize the DP table with zeros",
    table: view(dp),
    selectedItems: [],
    totalValue: 0,
    totalWeight: 0,
  })

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1]

    const rowInit = view(dp, [[i, 0, { highlighted: true }]])
    steps.push({
      phase: "compute",
      description: `Starting row ${i}: considering item ${item.id} (weight: ${item.weight}, value: ${item.value})`,
      currentRow: i,
      currentCol: 0,
      table: rowInit,
      selectedItems: [],
      totalValue: 0,
      totalWeight: 0,
    })

    for (let j = 0; j <= w; j++) {
      if (j === 0) {
        const frame = view(dp, [[i, j, { highlighted: true }]])
        steps.push({
          phase: "compute",
          description: `Cell [${i}][${j}]: First column is always 0`,
          currentRow: i,
          currentCol: j,
          table: frame,
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
        })
      } else if (item.weight > j) {
        const frame = view(dp, [
          [i, j, { highlighted: true, comparing: true, fromAbove: true }],
          [i - 1, j, { comparing: true }],
        ])
        steps.push({
          phase: "compute",
          description: `Cell [${i}][${j}]: Item ${item.id} doesn't fit (weight ${item.weight} > capacity ${j})`,
          currentRow: i,
          currentCol: j,
          table: frame,
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
          comparingCells: [
            { row: i, col: j },
            { row: i - 1, col: j },
          ],
        })

        setCell(dp, i, j, { value: dp[i - 1][j].value, includeItem: false })

        const updated = view(dp, [[i, j, { highlighted: true }]])
        steps.push({
          phase: "compute",
          description: `Cell [${i}][${j}]: Take value ${dp[i][j].value} from above`,
          currentRow: i,
          currentCol: j,
          table: updated,
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
        })
      } else {
        const valueWithout = dp[i - 1][j].value
        const valueWith = dp[i - 1][j - item.weight].value + item.value

        const marks: Mark[] = [
          [i, j, { highlighted: true, comparing: true, fromAbove: valueWithout >= valueWith, fromDiagonal: valueWith > valueWithout }],
          [i - 1, j, { comparing: true }],
          [i - 1, j - item.weight, { comparing: true }],
        ]
        const frame = view(dp, marks)
        const comparingCells = [
          { row: i, col: j },
          { row: i - 1, col: j },
          { row: i - 1, col: j - item.weight },
        ]

        steps.push({
          phase: "compute",
          description: `Cell [${i}][${j}]: Compare including vs excluding item ${item.id}`,
          currentRow: i,
          currentCol: j,
          table: frame,
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
          comparingCells,
        })
        steps.push({
          phase: "compute",
          description: `Without item ${item.id}: ${valueWithout}, With item ${item.id}: ${valueWith} (${dp[i - 1][j - item.weight].value} + ${item.value})`,
          currentRow: i,
          currentCol: j,
          table: view(dp, marks),
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
          comparingCells: comparingCells.map((c) => ({ ...c })),
        })

        if (valueWith > valueWithout) setCell(dp, i, j, { value: valueWith, includeItem: true })
        else setCell(dp, i, j, { value: valueWithout, includeItem: false })

        const updated = view(dp, [[i, j, { highlighted: true }]])
        steps.push({
          phase: "compute",
          description: `Cell [${i}][${j}]: Choose ${dp[i][j].includeItem ? "to include" : "not to include"} item ${item.id}, value = ${dp[i][j].value}`,
          currentRow: i,
          currentCol: j,
          table: updated,
          selectedItems: [],
          totalValue: 0,
          totalWeight: 0,
        })
      }
    }
  }

  const best = dp[n][w].value
  steps.push({
    phase: "complete",
    description: `DP table complete. Maximum value: ${best}`,
    table: view(dp),
    selectedItems: [],
    totalValue: best,
    totalWeight: 0,
  })

  const selectedItems: number[] = []
  let i = n
  let j = w
  let totalWeight = 0

  while (i > 0 && j > 0) {
    if (dp[i][j].includeItem) {
      const item = items[i - 1]
      selectedItems.push(item.id)
      totalWeight += item.weight
      j -= item.weight

      const frame = view(dp, [[i, j + item.weight, { highlighted: true }]])
      steps.push({
        phase: "backtrack",
        description: `Backtracking: Include item ${item.id} (weight: ${item.weight}, value: ${item.value})`,
        table: frame,
        selectedItems: [...selectedItems],
        totalValue: best,
        totalWeight,
      })
    }
    i--

    if (i > 0) {
      const frame = view(dp, [[i, j, { highlighted: true }]])
      steps.push({
        phase: "backtrack",
        description: `Backtracking: Move to item ${items[i - 1].id}`,
        table: frame,
        selectedItems: [...selectedItems],
        totalValue: best,
        totalWeight,
      })
    }
  }

  steps.push({
    phase: "complete",
    description: `Optimal solution: ${selectedItems.length} items selected with total value ${best} and weight ${totalWeight}`,
    table: view(dp),
    selectedItems: [...selectedItems],
    totalValue: best,
    totalWeight,
  })

  return steps
}
