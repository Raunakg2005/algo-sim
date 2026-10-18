// Independent oracles for Strassen's matrix multiplication (written without looking at the engine).

export type Mat = number[][]

/** Ordinary row-by-column product. */
export function naiveProduct(A: Mat, B: Mat): Mat {
  const n = A.length
  const m = B[0].length
  const C: Mat = []
  for (let i = 0; i < n; i++) {
    C.push([])
    for (let j = 0; j < m; j++) {
      let s = 0
      for (let k = 0; k < B.length; k++) s += A[i][k] * B[k][j]
      C[i].push(s)
    }
  }
  return C
}

/** Quadrant (r, c) in {0,1}^2 of an even-sized matrix, zero-padded first if the size is odd. */
export function quadrant(M: Mat, r: number, c: number): Mat {
  const size = M.length % 2 === 0 ? M.length : M.length + 1
  const h = size / 2
  const at = (i: number, j: number) => (i < M.length && j < M.length ? M[i][j] : 0)
  const Q: Mat = []
  for (let i = 0; i < h; i++) {
    Q.push([])
    for (let j = 0; j < h; j++) Q[i].push(at(r * h + i, c * h + j))
  }
  return Q
}

const lin = (X: Mat, Y: Mat, s: number): Mat => X.map((row, i) => row.map((v, j) => v + s * Y[i][j]))
export const plus = (X: Mat, Y: Mat): Mat => lin(X, Y, 1)
export const minus = (X: Mat, Y: Mat): Mat => lin(X, Y, -1)

/** Strassen's seven products M1..M7 (Strassen 1969 / textbook numbering used by the visualizer). */
export function strassenProducts(A: Mat, B: Mat): Mat[] {
  const [a11, a12, a21, a22] = [quadrant(A, 0, 0), quadrant(A, 0, 1), quadrant(A, 1, 0), quadrant(A, 1, 1)]
  const [b11, b12, b21, b22] = [quadrant(B, 0, 0), quadrant(B, 0, 1), quadrant(B, 1, 0), quadrant(B, 1, 1)]
  return [
    naiveProduct(plus(a11, a22), plus(b11, b22)),
    naiveProduct(plus(a21, a22), b11),
    naiveProduct(a11, minus(b12, b22)),
    naiveProduct(a22, minus(b21, b11)),
    naiveProduct(plus(a11, a12), b22),
    naiveProduct(minus(a21, a11), plus(b11, b12)),
    naiveProduct(minus(a12, a22), plus(b21, b22)),
  ]
}
