// Independent oracle: textbook (CLRS) quicksort with the Lomuto partition, written without the engine.
// Records what the algorithm does so the engine's frames can be compared with it.

export type LomutoTrace = {
  sorted: number[]
  comparisons: number // evaluations of A[j] <= x
  exchanges: number // exchanges that move data (i != j inside the loop, i+1 != r for the pivot)
  partitions: { p: number; r: number; q: number }[] // calls PARTITION(A, p, r) returning q, in call order
}

export function lomutoQuickSort(input: number[]): LomutoTrace {
  const A = input.slice()
  const t: LomutoTrace = { sorted: A, comparisons: 0, exchanges: 0, partitions: [] }

  function partition(p: number, r: number): number {
    const x = A[r]
    let i = p - 1
    for (let j = p; j <= r - 1; j++) {
      t.comparisons++
      if (A[j] <= x) {
        i = i + 1
        if (i !== j) {
          const tmp = A[i]; A[i] = A[j]; A[j] = tmp
          t.exchanges++
        }
      }
    }
    if (i + 1 !== r) {
      const tmp = A[i + 1]; A[i + 1] = A[r]; A[r] = tmp
      t.exchanges++
    }
    return i + 1
  }

  function quicksort(p: number, r: number): void {
    if (p < r) {
      const q = partition(p, r)
      t.partitions.push({ p, r, q })
      quicksort(p, q - 1)
      quicksort(q + 1, r)
    }
  }

  quicksort(0, A.length - 1)
  return t
}
