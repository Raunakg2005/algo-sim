// Independent oracle for insertion sort, written without the engine.

// number of inversions (pairs i < j with a[i] > a[j]) = number of shifts insertion sort performs
export function inversions(a: number[]): number {
  let c = 0
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++
  return c
}

// evaluations of `arr[j] > current` (the j >= 0 test short-circuits, so it is not counted when j = -1)
export function insertionComparisons(input: number[]): number {
  const a = input.slice()
  let c = 0
  for (let i = 1; i < a.length; i++) {
    const cur = a[i]
    let j = i - 1
    for (;;) {
      if (j < 0) break
      c++
      if (!(a[j] > cur)) break
      a[j + 1] = a[j]
      j--
    }
    a[j + 1] = cur
  }
  return c
}

// final position of input[i] when it is inserted: number of elements of input[0..i-1] that are <= input[i]
export function insertionTarget(input: number[], i: number): number {
  let k = 0
  for (let t = 0; t < i; t++) if (input[t] <= input[i]) k++
  return k
}
