type SortStep = { arrays: number[][]; level: number[]; merging: boolean[]; merged: boolean[]; comparisons?: [number, number][] }
export function legacy(array: number[]): SortStep[] {
    const steps: SortStep[] = []

    steps.push({
      arrays: [array],
      level: [0],
      merging: [false],
      merged: [false],
    })

    const mergeSort = (arr: number[], level: number): number[] => {
      if (arr.length <= 1) {
        return arr
      }

      const mid = Math.floor(arr.length / 2)
      const left = arr.slice(0, mid)
      const right = arr.slice(mid)

      const currentArrays = [...steps[steps.length - 1].arrays]
      const currentLevels = [...steps[steps.length - 1].level]
      const currentMerging = [...steps[steps.length - 1].merging]
      const currentMerged = [...steps[steps.length - 1].merged]

      const parentIndex = currentArrays.findIndex(
        (a) =>
          JSON.stringify(a) === JSON.stringify(arr) &&
          currentLevels[currentArrays.indexOf(a)] === level &&
          !currentMerged[currentArrays.indexOf(a)],
      )

      if (parentIndex !== -1) {
        currentArrays.splice(parentIndex, 1, left, right)
        currentLevels.splice(parentIndex, 1, level + 1, level + 1)
        currentMerging.splice(parentIndex, 1, false, false)
        currentMerged.splice(parentIndex, 1, false, false)

        steps.push({
          arrays: currentArrays,
          level: currentLevels,
          merging: currentMerging,
          merged: currentMerged,
        })
      }

      const sortedLeft = mergeSort(left, level + 1)
      const sortedRight = mergeSort(right, level + 1)

      const result = merge(sortedLeft, sortedRight, level)

      return result
    }

    const merge = (left: number[], right: number[], level: number): number[] => {
      const result: number[] = []
      let leftIndex = 0
      let rightIndex = 0

      const lastStep = steps[steps.length - 1]
      const leftArrayIndex = lastStep.arrays.findIndex(
        (a) =>
          JSON.stringify(a) === JSON.stringify(left) &&
          lastStep.level[lastStep.arrays.indexOf(a)] === level + 1 &&
          !lastStep.merged[lastStep.arrays.indexOf(a)],
      )

      const rightArrayIndex = lastStep.arrays.findIndex(
        (a) =>
          JSON.stringify(a) === JSON.stringify(right) &&
          lastStep.level[lastStep.arrays.indexOf(a)] === level + 1 &&
          !lastStep.merged[lastStep.arrays.indexOf(a)],
      )

      if (leftArrayIndex !== -1 && rightArrayIndex !== -1) {
        const mergingArrays = [...lastStep.arrays]
        const mergingLevels = [...lastStep.level]
        const isMerging = [...lastStep.merging]
        const isMerged = [...lastStep.merged]

        isMerging[leftArrayIndex] = true
        isMerging[rightArrayIndex] = true

        steps.push({
          arrays: mergingArrays,
          level: mergingLevels,
          merging: isMerging,
          merged: isMerged,
        })
      }

      while (leftIndex < left.length && rightIndex < right.length) {
        const currentStep = steps[steps.length - 1]
        const currentArrays = [...currentStep.arrays]
        const currentLevels = [...currentStep.level]
        const currentMerging = [...currentStep.merging]
        const currentMerged = [...currentStep.merged]

        steps.push({
          arrays: currentArrays,
          level: currentLevels,
          merging: currentMerging,
          merged: currentMerged,
          comparisons: [
            [leftArrayIndex, leftIndex],
            [rightArrayIndex, rightIndex],
          ],
        })

        if (left[leftIndex] < right[rightIndex]) {
          result.push(left[leftIndex])
          leftIndex++
        } else {
          result.push(right[rightIndex])
          rightIndex++
        }
      }
      while (leftIndex < left.length) {
        result.push(left[leftIndex])
        leftIndex++
      }

      while (rightIndex < right.length) {
        result.push(right[rightIndex])
        rightIndex++
      }

      const finalStep = steps[steps.length - 1]
      const finalArrays = [...finalStep.arrays]
      const finalLevels = [...finalStep.level]
      const finalMerging = [...finalStep.merging]
      const finalMerged = [...finalStep.merged]

      const leftIdx = finalArrays.findIndex(
        (a) => JSON.stringify(a) === JSON.stringify(left) && finalLevels[finalArrays.indexOf(a)] === level + 1,
      )

      const rightIdx = finalArrays.findIndex(
        (a) => JSON.stringify(a) === JSON.stringify(right) && finalLevels[finalArrays.indexOf(a)] === level + 1,
      )

      if (leftIdx !== -1 && rightIdx !== -1) {
        const minIdx = Math.min(leftIdx, rightIdx)
        finalArrays.splice(minIdx, 1)
        finalLevels.splice(minIdx, 1)
        finalMerging.splice(minIdx, 1)
        finalMerged.splice(minIdx, 1)

        const maxIdx = Math.max(leftIdx, rightIdx) - 1 
        finalArrays.splice(maxIdx, 1)
        finalLevels.splice(maxIdx, 1)
        finalMerging.splice(maxIdx, 1)
        finalMerged.splice(maxIdx, 1)

        finalArrays.splice(minIdx, 0, result)
        finalLevels.splice(minIdx, 0, level)
        finalMerging.splice(minIdx, 0, false)
        finalMerged.splice(minIdx, 0, true)

        steps.push({
          arrays: finalArrays,
          level: finalLevels,
          merging: finalMerging,
          merged: finalMerged,
        })
      }

      return result
    }

    mergeSort(array, 0)
    return steps
}
