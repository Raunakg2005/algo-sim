type SortingStep = any
export const INSERTION_SORT_CODE: string[] = new Array(14).fill("")
export function generateInsertionSortSteps(input: number[]): any[] { let captured: any[] = []; const setSortingSteps = (s: any[]) => { captured = s }
  const generateSortingSteps = (inputArray: number[]) => {
    const steps: SortingStep[] = []
    const arr = [...inputArray]

    steps.push({
      array: [...arr],
      currentIndex: 1,
      comparingIndex: null,
      sortedUpTo: 0,
      description: "Starting with the first element as sorted.",
      isSwapping: false,
      activeCodeLine: 2, 
    })

    for (let i = 1; i < arr.length; i++) {
      const key = arr[i]

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: null,
        sortedUpTo: i - 1,
        description: `Taking element ${key} to insert into the sorted portion.`,
        isSwapping: false,
        activeCodeLine: 4,
      })

      let j = i - 1

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: j,
        sortedUpTo: i - 1,
        description: `Setting j = ${j} (position before current element).`,
        isSwapping: false,
        activeCodeLine: 6, 
      })

      if (arr[j] <= key) {
        steps.push({
          array: [...arr],
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
        steps.push({
          array: [...arr],
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Comparing ${key} with ${arr[j]}. ${arr[j]} is greater, so we need to shift it right.`,
          isSwapping: false,
          activeCodeLine: 8, 
        })

        arr[j + 1] = arr[j]

        steps.push({
          array: [...arr],
          currentIndex: i,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Shifted ${arr[j]} one position to the right.`,
          isSwapping: true,
          activeCodeLine: 9, 
        })

        j--

        if (j >= 0) {
          steps.push({
            array: [...arr],
            currentIndex: i,
            comparingIndex: j,
            sortedUpTo: i - 1,
            description: `Decremented j to ${j}.`,
            isSwapping: false,
            activeCodeLine: 10, 
          })
        }
      }

      arr[j + 1] = key

      steps.push({
        array: [...arr],
        currentIndex: i,
        comparingIndex: null,
        sortedUpTo: i,
        description: `Inserted ${key} at position ${j + 1}.`,
        isSwapping: false,
        activeCodeLine: 12, 
      })
    }

    steps.push({
      array: [...arr],
      currentIndex: arr.length,
      comparingIndex: null,
      sortedUpTo: arr.length - 1,
      description: "Array is now sorted using Insertion Sort!",
      isSwapping: false,
      activeCodeLine: 13, 
    })

    setSortingSteps(steps)
  }
generateSortingSteps(input); return captured }
