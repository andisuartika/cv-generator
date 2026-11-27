import path from "node:path";
import { defineConfig } from "vitest/config";

// Slow tests with a real server and Chromium. Run `npm run build` first.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/pdf/**/*.pdf-test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
