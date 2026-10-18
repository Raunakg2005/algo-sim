// Step generator for the Selection Sort visualizer.
// Pure function: given an input array, returns every frame the visualizer plays.
// Logic moved unchanged from components/selection-sort-visualization.tsx (the legacy check found no defects).

export interface SelectionSortStep {
  array: number[]
  currentIndex: number
  minIndex: number
  comparingIndex: number | null
  sortedUpTo: number
  description: string
  isSwapping: boolean
}

export function generateSelectionSortSteps(input: number[]): SelectionSortStep[] {
  const steps: SelectionSortStep[] = []
  const arr = [...input]

  steps.push({
    array: [...arr],
    currentIndex: 0,
    minIndex: 0,
    comparingIndex: null,
    sortedUpTo: -1,
    description: "Starting Selection Sort. We'll find the minimum element and place it at the beginning.",
    isSwapping: false,
  })

  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i

    steps.push({
      array: [...arr],
      currentIndex: i,
      minIndex,
      comparingIndex: null,
      sortedUpTo: i - 1,
      description: `Looking for the minimum element in the unsorted portion starting at index ${i}.`,
      isSwapping: false,
    })

    for (let j = i + 1; j < arr.length; j++) {
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex,
        comparingIndex: j,
        sortedUpTo: i - 1,
        description: `Comparing ${arr[j]} with current minimum ${arr[minIndex]}.`,
        isSwapping: false,
      })

      if (arr[j] < arr[minIndex]) {
        minIndex = j
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex,
          comparingIndex: null,
          sortedUpTo: i - 1,
          description: `Found a new minimum: ${arr[minIndex]} at index ${minIndex}.`,
          isSwapping: false,
        })
      }
    }

    if (minIndex !== i) {
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex,
        comparingIndex: null,
        sortedUpTo: i - 1,
        description: `Swapping ${arr[i]} with the minimum value ${arr[minIndex]}.`,
        isSwapping: true,
      })
      ;[arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex: i,
        comparingIndex: null,
        sortedUpTo: i,
        description: `Placed ${arr[i]} at position ${i}. This element is now in its correct sorted position.`,
        isSwapping: false,
      })
    } else {
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex: i,
        comparingIndex: null,
        sortedUpTo: i,
        description: `${arr[i]} is already the minimum, so it stays at position ${i}.`,
        isSwapping: false,
      })
    }
  }

  steps.push({
    array: [...arr],
    currentIndex: arr.length - 1,
    minIndex: arr.length - 1,
    comparingIndex: null,
    sortedUpTo: arr.length - 1,
    description: "Array is now sorted using Selection Sort!",
    isSwapping: false,
  })
  return steps
}
