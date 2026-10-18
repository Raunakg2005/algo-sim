import { defineConfig } from "vitest/config"
import path from "node:path"

// `npx vitest run --config vitest.bench.config.ts` regenerates bench/results.json
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { include: ["bench/**/*.bench-run.ts"], environment: "node", testTimeout: 600_000, pool: "forks", poolOptions: { forks: { singleFork: true } } },
})
