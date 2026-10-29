import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const result = spawnSync(
  process.execPath,
  [require.resolve("@playwright/test/cli"), ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      PLAYWRIGHT_BROWSERS_PATH: fileURLToPath(
        new URL("../.cache/ms-playwright", import.meta.url),
      ),
    },
  },
);
if (result.error)
  console.error(`Playwright failed to start: ${result.error.code}`);
process.exitCode = result.status ?? 1;
