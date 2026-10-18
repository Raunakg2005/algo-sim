// Step generator for the Heap Sort visualizer.
// Pure function: given an input array, returns every frame the visualizer plays
// (bottom-up max-heap construction, then repeated extract-max with sift-down).

export type HeapSortStep = {
  type: "initial" | "build-heap" | "heapify" | "extract-max" | "sorted"
  array: number[]
  heapSize: number
  comparing?: [number, number]
  swapping?: [number, number]
  currentNodeIndex?: number
  extractedIndex?: number
  sortedIndices?: number[]
  description: string
}

export function generateHeapSortSteps(input: number[]): HeapSortStep[] {
  const steps: HeapSortStep[] = []
  const arr = [...input]
  const n = arr.length

  steps.push({ type: "initial", array: [...arr], heapSize: n, description: "Initial unsorted array" })

  // sift-down of arr[i] within the heap arr[0 .. size-1]
  const heapify = (size: number, i: number, sortedIndices: number[]): void => {
    let largest = i
    const left = 2 * i + 1
    const right = 2 * i + 2

    if (left < size) {
      steps.push({
        type: "heapify",
        array: [...arr],
        heapSize: size,
        comparing: [largest, left],
        currentNodeIndex: i,
        sortedIndices: [...sortedIndices],
        description: `Compare node ${arr[largest]} with its left child ${arr[left]}`,
      })
      if (arr[left] > arr[largest]) largest = left
    }

    if (right < size) {
      steps.push({
        type: "heapify",
        array: [...arr],
        heapSize: size,
        comparing: [largest, right],
        currentNodeIndex: i,
        sortedIndices: [...sortedIndices],
        // fixed caption: when the left child won the first comparison, the right child is its sibling, not its child
        description:
          largest === i
            ? `Compare node ${arr[i]} with its right child ${arr[right]}`
            : `Left child ${arr[largest]} is larger than node ${arr[i]}; compare it with the right child ${arr[right]}`,
      })
      if (arr[right] > arr[largest]) largest = right
    }

    if (largest !== i) {
      steps.push({
        type: "heapify",
        array: [...arr],
        heapSize: size,
        swapping: [i, largest],
        currentNodeIndex: i,
        sortedIndices: [...sortedIndices],
        description: `Swap ${arr[i]} with ${arr[largest]} to maintain max-heap property`,
      })
      ;[arr[i], arr[largest]] = [arr[largest], arr[i]]
      steps.push({
        type: "heapify",
        array: [...arr],
        heapSize: size,
        currentNodeIndex: largest,
        sortedIndices: [...sortedIndices],
        description: `Continue heapify at node ${arr[largest]}`,
      })
      heapify(size, largest, sortedIndices)
    }
  }

  steps.push({ type: "build-heap", array: [...arr], heapSize: n, description: "Start building max heap" })

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    steps.push({
      type: "build-heap",
      array: [...arr],
      heapSize: n,
      currentNodeIndex: i,
      description: `Heapify starting from node at index ${i}`,
    })
    heapify(n, i, [])
  }

  steps.push({ type: "build-heap", array: [...arr], heapSize: n, description: "Max heap built successfully" })

  const sortedIndices: number[] = []
  for (let i = n - 1; i > 0; i--) {
    steps.push({
      type: "extract-max",
      array: [...arr],
      heapSize: i + 1,
      swapping: [0, i],
      sortedIndices: [...sortedIndices],
      description: `Extract max element ${arr[0]} and place it at the end`,
    })
    ;[arr[0], arr[i]] = [arr[i], arr[0]]
    sortedIndices.push(i)

    steps.push({
      type: "extract-max",
      array: [...arr],
      heapSize: i,
      extractedIndex: i,
      sortedIndices: [...sortedIndices],
      description: `Element ${arr[i]} is now in its sorted position`,
    })
    steps.push({
      type: "extract-max",
      array: [...arr],
      heapSize: i,
      currentNodeIndex: 0,
      sortedIndices: [...sortedIndices],
      description: "Re-heapify the reduced heap",
    })
    heapify(i, 0, sortedIndices)
  }

  if (n > 0) sortedIndices.push(0)

  steps.push({
    type: "sorted",
    array: [...arr],
    heapSize: 0,
    sortedIndices: [...sortedIndices],
    description: "Array is now fully sorted",
  })
  return steps
}
