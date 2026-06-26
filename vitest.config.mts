import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// `.mts` so Vite loads this config as ESM. We resolve the `@/*` alias manually
// (mirroring tsconfig paths) instead of vite-tsconfig-paths, which is ESM-only
// and trips Vite's config loader. JSON imports are handled by Vite natively.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
});
