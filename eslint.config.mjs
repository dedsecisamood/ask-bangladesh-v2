import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/node_modules/**",
    ".cache/**",
    ".venv/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".artifacts/**",
    "**/.venv/**",
    "**/next-env.d.ts",
  ]),
  ...nextVitals,
  ...nextTypeScript,
  {
    settings: { next: { rootDir: "apps/web/" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  prettier,
]);
