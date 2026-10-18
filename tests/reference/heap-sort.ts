// Independent oracle: textbook (CLRS) heapsort, written without the engine.

export type HeapSortTrace = {
  sorted: number[]
  comparisons: number // key comparisons in MAX-HEAPIFY (one per existing child)
  exchanges: number // exchanges inside MAX-HEAPIFY plus the n-1 root extractions
  builtHeap: number[] // array right after BUILD-MAX-HEAP
}

export function heapSortTrace(input: number[]): HeapSortTrace {
  const A = input.slice()
  let comparisons = 0
  let exchanges = 0
  const swap = (x: number, y: number) => { const t = A[x]; A[x] = A[y]; A[y] = t; exchanges++ }

  function maxHeapify(size: number, i: number): void {
    // iterative form, so it is not a copy of the engine's recursive code
    for (;;) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let largest = i
      if (l < size) { comparisons++; if (A[l] > A[largest]) largest = l }
      if (r < size) { comparisons++; if (A[r] > A[largest]) largest = r }
      if (largest === i) return
      swap(i, largest)
      i = largest
    }
  }

  const n = A.length
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) maxHeapify(n, i)
  const builtHeap = A.slice()
  for (let end = n - 1; end >= 1; end--) {
    swap(0, end)
    maxHeapify(end, 0)
  }
  return { sorted: A, comparisons, exchanges, builtHeap }
}

export function isMaxHeap(a: number[], size: number): boolean {
  for (let k = 1; k < size; k++) if (a[(k - 1) >> 1] < a[k]) return false
  return true
}
