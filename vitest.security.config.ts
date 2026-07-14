import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Network-bound RLS probes against the live Supabase project.
// Run with `pnpm test:security`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/security/**/*.test.ts"],
    testTimeout: 15_000,
  },
});
