import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  // property-based tests run thousands of cases, so allow more than the 5 s default
  test: { include: ["tests/**/*.test.ts"], environment: "node", testTimeout: 60_000, pool: "forks", poolOptions: { forks: { singleFork: true } } },
})
