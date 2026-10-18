// start city left over from a larger instance (choose E among 5 cities, then delete a city, press Solve)
import { solveTSP } from "./tsp-solver.ts"
const D = [[0, 1, 2, 3], [1, 0, 4, 5], [2, 4, 0, 6], [3, 5, 6, 0]]
console.log("calling solveTSP(4 cities, startCity = 4) ...")
solveTSP(D, 4)
console.log("returned")
