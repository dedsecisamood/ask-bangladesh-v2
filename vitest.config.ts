import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["apps/web/src/**/*.test.{ts,tsx}"],
    setupFiles: ["./apps/web/src/test-setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    maxWorkers: 2,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "apps/web/src/lib/env/schema.ts",
        "apps/web/src/lib/i18n/config.ts",
        "apps/web/src/lib/chat.ts",
        "apps/web/src/components/layout/header-navigation.tsx",
        "apps/web/src/components/layout/site-footer.tsx",
        "apps/web/src/components/layout/public-shell.tsx",
      ],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
