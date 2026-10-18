// Legacy harness: verbatim copy of the original startAlgorithm (DP + backtracking) and item-list handlers.
type Item = { id: number; weight: number; value: number; selected?: boolean }
type Cell = { value: number; includeItem: boolean; highlighted?: boolean; comparing?: boolean; fromAbove?: boolean; fromDiagonal?: boolean }
type AlgorithmStep = { phase: "init" | "compute" | "backtrack" | "complete"; description: string; currentRow?: number; currentCol?: number; table: Cell[][]; selectedItems: number[]; totalValue: number; totalWeight: number; comparingCells?: { row: number; col: number }[] }
export function legacySteps(items: Item[], capacity: number): AlgorithmStep[] | string {
  let out: AlgorithmStep[] = []; let err = ""
  const setInputError = (e: string) => { err = e }; const setAlgorithmStarted = (_: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { out = s }; const setCurrentStep = (_: number) => {}
    if (items.length === 0) {
      setInputError("Please add at least one item")
      return err
    }

    if (capacity <= 0) {
      setInputError("Capacity must be a positive number")
      return err
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const n = items.length
    const w = capacity
    const dp: Cell[][] = Array(n + 1)
      .fill(null)
      .map(() =>
        Array(w + 1)
          .fill(null)
          .map(() => ({ value: 0, includeItem: false })),
      )

    algorithmSteps.push({
      phase: "init",
      description: "Initialize the DP table with zeros",
      table: JSON.parse(JSON.stringify(dp)),
      selectedItems: [],
      totalValue: 0,
      totalWeight: 0,
    })

    for (let i = 1; i <= n; i++) {
      const item = items[i - 1]

      const rowInitStep = JSON.parse(JSON.stringify(dp))
      rowInitStep[i][0].highlighted = true

      algorithmSteps.push({
        phase: "compute",
        description: `Starting row ${i}: considering item ${i} (weight: ${item.weight}, value: ${item.value})`,
        currentRow: i,
        currentCol: 0,
        table: rowInitStep,
        selectedItems: [],
        totalValue: 0,
        totalWeight: 0,
      })

      for (let j = 0; j <= w; j++) {
        const currentStep = JSON.parse(JSON.stringify(dp))
        currentStep[i][j].highlighted = true

        if (j === 0) {
          algorithmSteps.push({
            phase: "compute",
            description: `Cell [${i}][${j}]: First column is always 0`,
            currentRow: i,
            currentCol: j,
            table: currentStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
          })
        } else if (item.weight > j) {
          currentStep[i][j].comparing = true
          currentStep[i - 1][j].comparing = true
          currentStep[i][j].fromAbove = true

          algorithmSteps.push({
            phase: "compute",
            description: `Cell [${i}][${j}]: Item ${i} doesn't fit (weight ${item.weight} > capacity ${j})`,
            currentRow: i,
            currentCol: j,
            table: currentStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
            comparingCells: [
              { row: i, col: j },
              { row: i - 1, col: j },
            ],
          })

          dp[i][j].value = dp[i - 1][j].value
          dp[i][j].includeItem = false

          const updatedStep = JSON.parse(JSON.stringify(dp))
          updatedStep[i][j].highlighted = true

          algorithmSteps.push({
            phase: "compute",
            description: `Cell [${i}][${j}]: Take value ${dp[i][j].value} from above`,
            currentRow: i,
            currentCol: j,
            table: updatedStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
          })
        } else {
          const valueWithout = dp[i - 1][j].value
          const valueWith = dp[i - 1][j - item.weight].value + item.value

          currentStep[i][j].comparing = true
          currentStep[i - 1][j].comparing = true
          currentStep[i - 1][j - item.weight].comparing = true
          currentStep[i][j].fromAbove = valueWithout >= valueWith
          currentStep[i][j].fromDiagonal = valueWith > valueWithout

          algorithmSteps.push({
            phase: "compute",
            description: `Cell [${i}][${j}]: Compare including vs excluding item ${i}`,
            currentRow: i,
            currentCol: j,
            table: currentStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
            comparingCells: [
              { row: i, col: j },
              { row: i - 1, col: j },
              { row: i - 1, col: j - item.weight },
            ],
          })

          algorithmSteps.push({
            phase: "compute",
            description: `Without item ${i}: ${valueWithout}, With item ${i}: ${valueWith} (${dp[i - 1][j - item.weight].value} + ${item.value})`,
            currentRow: i,
            currentCol: j,
            table: currentStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
            comparingCells: [
              { row: i, col: j },
              { row: i - 1, col: j },
              { row: i - 1, col: j - item.weight },
            ],
          })

          if (valueWith > valueWithout) {
            dp[i][j].value = valueWith
            dp[i][j].includeItem = true
          } else {
            dp[i][j].value = valueWithout
            dp[i][j].includeItem = false
          }

          const updatedStep = JSON.parse(JSON.stringify(dp))
          updatedStep[i][j].highlighted = true

          algorithmSteps.push({
            phase: "compute",
            description: `Cell [${i}][${j}]: Choose ${
              dp[i][j].includeItem ? "to include" : "not to include"
            } item ${i}, value = ${dp[i][j].value}`,
            currentRow: i,
            currentCol: j,
            table: updatedStep,
            selectedItems: [],
            totalValue: 0,
            totalWeight: 0,
          })
        }
      }
    }

    algorithmSteps.push({
      phase: "complete",
      description: `DP table complete. Maximum value: ${dp[n][w].value}`,
      table: JSON.parse(JSON.stringify(dp)),
      selectedItems: [],
      totalValue: dp[n][w].value,
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

        const backtrackStep = JSON.parse(JSON.stringify(dp))
        backtrackStep[i][j + item.weight].highlighted = true

        algorithmSteps.push({
          phase: "backtrack",
          description: `Backtracking: Include item ${i} (weight: ${item.weight}, value: ${item.value})`,
          table: backtrackStep,
          selectedItems: [...selectedItems],
          totalValue: dp[n][w].value,
          totalWeight,
        })
      }
      i--

      if (i > 0) {
        const backtrackStep = JSON.parse(JSON.stringify(dp))
        backtrackStep[i][j].highlighted = true

        algorithmSteps.push({
          phase: "backtrack",
          description: `Backtracking: Move to item ${i}`,
          table: backtrackStep,
          selectedItems: [...selectedItems],
          totalValue: dp[n][w].value,
          totalWeight,
        })
      }
    }

    algorithmSteps.push({
      phase: "complete",
      description: `Optimal solution: ${selectedItems.length} items selected with total value ${
        dp[n][w].value
      } and weight ${totalWeight}`,
      table: JSON.parse(JSON.stringify(dp)),
      selectedItems: [...selectedItems],
      totalValue: dp[n][w].value,
      totalWeight,
    })

    setSteps(algorithmSteps)
    setCurrentStep(0)
  return out
}
export function legacyAdd(items: Item[], newItemWeight: string, newItemValue: string): Item[] | string {
  let err = ""; let res = items; const setInputError = (e: string) => { err = e }; const setItems = (x: Item[]) => { res = x }; const setNewItemWeight = (_: string) => {}; const setNewItemValue = (_: string) => {}
    if (!newItemWeight.trim() || !newItemValue.trim()) {
      setInputError("Please enter both weight and value")
      return err
    }

    const weight = Number.parseInt(newItemWeight)
    const value = Number.parseInt(newItemValue)

    if (isNaN(weight) || weight <= 0) {
      setInputError("Weight must be a positive number")
      return err
    }

    if (isNaN(value) || value <= 0) {
      setInputError("Value must be a positive number")
      return err
    }

    setInputError("")
    setItems([...items, { id: items.length + 1, weight, value }])
    setNewItemWeight("")
    setNewItemValue("")
  return err || res
}
export const legacyRemove = (items: Item[], id: number): Item[] => items.filter((item) => item.id !== id)
