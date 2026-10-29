import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/retrieval/*.integration.ts"],
    maxWorkers: 1,
    testTimeout: 180_000,
    hookTimeout: 60_000,
  },
});
