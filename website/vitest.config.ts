import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": resolve(__dirname, "test/server-only.ts")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    // Full-suite jsdom worker load can push the protected admin helper-chain renders past Vitest's 5s default.
    testTimeout: 10_000,
    // Fork workers avoid the Node worker-thread collection stall seen in the full suite.
    pool: "forks"
  }
});
