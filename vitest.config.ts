import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // `pnpm test` = offline unit tests only; security probes hit the live
    // Supabase project and run via `pnpm test:security`.
    include: ["tests/unit/**/*.test.ts"],
  },
});
