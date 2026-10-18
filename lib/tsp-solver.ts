// The TSP step generator now lives in lib/engines/tsp.ts (pure, property-tested).
// This module re-exports it for existing importers (graph / DP-table / explanation components).
export { solveTSP, type TSPStep } from "./engines/tsp"
