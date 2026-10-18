type SortingStep = any
  const generateQuickSortSteps = (arr: number[]) => {
    const steps: SortingStep[] = []
    const arrCopy = [...arr]

    steps.push({
      type: "initial",
      array: [...arrCopy],
      description: "Initial unsorted array",
    })

    const quickSort = (arr: number[], start: number, end: number, subArrays: { start: number; end: number }[]) => {
      if (start >= end) {
        return
      }

      const pivotIndex = end
      const pivotValue = arr[pivotIndex]

      steps.push({
        type: "pivot-selected",
        array: [...arr],
        pivotIndex,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Select pivot: ${pivotValue} (last element of the current subarray)`,
      })

      let i = start - 1

      for (let j = start; j < end; j++) {
        steps.push({
          type: "partitioning",
          array: [...arr],
          pivotIndex,
          leftPointer: i,
          rightPointer: j,
          subArrays: [...subArrays],
          activeSubArray: { start, end },
          description: `Compare element ${arr[j]} with pivot ${pivotValue}`,
        })

        if (arr[j] <= pivotValue) {
          i++

          if (i !== j) {
            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              swapping: [i, j],
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `Swap ${arr[i]} and ${arr[j]} (smaller element moves left)`,
            })

            ;[arr[i], arr[j]] = [arr[j], arr[i]]

            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `After swap: ${arr[i]} and ${arr[j]} have been swapped`,
            })
          } else {
            steps.push({
              type: "partitioning",
              array: [...arr],
              pivotIndex,
              leftPointer: i,
              rightPointer: j,
              subArrays: [...subArrays],
              activeSubArray: { start, end },
              description: `Element ${arr[j]} is already in the correct position`,
            })
          }
        }
      }

      i++
      steps.push({
        type: "partitioning",
        array: [...arr],
        pivotIndex,
        leftPointer: i,
        rightPointer: end,
        swapping: [i, end],
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Move pivot ${arr[end]} to its final position by swapping with element at position ${i}`,
      })
      ;[arr[i], arr[end]] = [arr[end], arr[i]]

      steps.push({
        type: "partitioning",
        array: [...arr],
        pivotIndex: i,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Pivot ${arr[i]} is now in its final sorted position`,
      })

      const newPivotIndex = i
      steps.push({
        type: "partition-complete",
        array: [...arr],
        pivotIndex: newPivotIndex,
        subArrays: [...subArrays],
        activeSubArray: { start, end },
        description: `Partition complete: elements to the left of ${arr[newPivotIndex]} are smaller, elements to the right are larger`,
      })

      const leftSubArray = { start, end: newPivotIndex - 1 }
      const rightSubArray = { start: newPivotIndex + 1, end }

      const newSubArrays = [...subArrays]
      if (leftSubArray.start <= leftSubArray.end) {
        newSubArrays.push(leftSubArray)
        steps.push({
          type: "recursive-call",
          array: [...arr],
          subArrays: [...newSubArrays],
          activeSubArray: leftSubArray,
          description: `Recursive call on left subarray [${leftSubArray.start}...${leftSubArray.end}]`,
        })
      }

      quickSort(arr, start, newPivotIndex - 1, newSubArrays)

      if (rightSubArray.start <= rightSubArray.end) {
        const rightSubArrays = [...newSubArrays]
        if (leftSubArray.start <= leftSubArray.end) {
          rightSubArrays.pop()
        }
        rightSubArrays.push(rightSubArray)
        steps.push({
          type: "recursive-call",
          array: [...arr],
          subArrays: [...rightSubArrays],
          activeSubArray: rightSubArray,
          description: `Recursive call on right subarray [${rightSubArray.start}...${rightSubArray.end}]`,
        })

        quickSort(arr, newPivotIndex + 1, end, rightSubArrays)
      }
    }

    quickSort(arrCopy, 0, arrCopy.length - 1, [])

    steps.push({
      type: "sorted",
      array: [...arrCopy],
      description: "Array is now fully sorted",
    })

    return steps
  }
export { generateQuickSortSteps }
