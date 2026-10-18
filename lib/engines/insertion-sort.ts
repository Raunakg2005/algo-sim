// Step generator for the Insertion Sort visualizer.
// Pure function: given an input array, returns every frame the visualizer plays.
// activeCodeLine is an index into INSERTION_SORT_CODE; the sequence of highlighted lines is a valid
// execution path of that pseudocode, and every evaluation of `arr[j] > current` gets its own frame.

export const INSERTION_SORT_CODE: string[] = [
  "function insertionSort(arr):",
  "  // Start from the second element (index 1)",
  "  for i = 1 to arr.length - 1:",
  "    // Element to be inserted into sorted portion",
  "    current = arr[i]",
  "    // Start comparing with previous elements",
  "    j = i - 1",
  "    // Move elements greater than current to one position ahead",
  "    while j >= 0 and arr[j] > current:",
  "      arr[j + 1] = arr[j]",
  "      j = j - 1",
  "    // Place current element at its correct position",
  "    arr[j + 1] = current",
  "  return arr",
]

export interface InsertionSortStep {
  array: number[]
  currentIndex: number
  comparingIndex: number | null
  sortedUpTo: number
  description: string
  isSwapping: boolean
  activeCodeLine: number
}

export function generateInsertionSortSteps(input: number[]): InsertionSortStep[] {
  const steps: InsertionSortStep[] = []
  const arr = [...input]
  const push = (s: Omit<InsertionSortStep, "array">): void => {
    steps.push({ array: [...arr], ...s })
  }

  push({
    currentIndex: 1,
    comparingIndex: null,
    sortedUpTo: 0,
    description: "Starting with the first element as sorted.",
    isSwapping: false,
    activeCodeLine: 2,
  })

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]
    push({
      currentIndex: i,
      comparingIndex: null,
      sortedUpTo: i - 1,
      description: `Taking element ${key} to insert into the sorted portion.`,
      isSwapping: false,
      activeCodeLine: 4,
    })

    let j = i - 1
    push({
      currentIndex: i,
      comparingIndex: j,
      sortedUpTo: i - 1,
      description: `Setting j = ${j} (position before current element).`,
      isSwapping: false,
      activeCodeLine: 6,
    })

    if (arr[j] <= key) {
      push({
        currentIndex: i,
        comparingIndex: j,
        sortedUpTo: i,
        description: `Comparing ${key} with ${arr[j]}. ${key} is already in the correct position.`,
        isSwapping: false,
        activeCodeLine: 8,
      })
      continue
    }

    while (j >= 0 && arr[j] > key) {
      push({
        currentIndex: i,
        comparingIndex: j,
        sortedUpTo: i - 1,
        description: `Comparing ${key} with ${arr[j]}. ${arr[j]} is greater, so we need to shift it right.`,
        isSwapping: false,
        activeCodeLine: 8,
      })

      arr[j + 1] = arr[j]
      push({
        currentIndex: i,
        comparingIndex: j,
        sortedUpTo: i - 1,
        description: `Shifted ${arr[j]} one position to the right.`,
        isSwapping: true,
        activeCodeLine: 9,
      })

      j--
      if (j >= 0) {
        push({
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Decremented j to ${j}.`,
          isSwapping: false,
          activeCodeLine: 10,
        })
        // fixed: the original never showed the comparison that ends the loop (arr[j] <= current)
        if (arr[j] <= key) {
          push({
            currentIndex: i,
            comparingIndex: j,
            sortedUpTo: i - 1,
            description: `Comparing ${key} with ${arr[j]}. ${arr[j]} is not greater, so the shifting stops.`,
            isSwapping: false,
            activeCodeLine: 8,
          })
        }
      } else {
        // fixed: the original skipped line 10 here and jumped from line 9 to line 12
        push({
          currentIndex: i,
          comparingIndex: null,
          sortedUpTo: i - 1,
          description: `Decremented j to -1: reached the start of the array, so the shifting stops.`,
          isSwapping: false,
          activeCodeLine: 10,
        })
      }
    }

    arr[j + 1] = key
    push({
      currentIndex: i,
      comparingIndex: null,
      sortedUpTo: i,
      description: `Inserted ${key} at position ${j + 1}.`,
      isSwapping: false,
      activeCodeLine: 12,
    })
  }

  push({
    currentIndex: arr.length,
    comparingIndex: null,
    sortedUpTo: arr.length - 1,
    description: "Array is now sorted using Insertion Sort!",
    isSwapping: false,
    activeCodeLine: 13,
  })
  return steps
}
