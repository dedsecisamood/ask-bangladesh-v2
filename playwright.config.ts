import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  globalTimeout: 300_000,
  expect: { timeout: 5_000 },
  reporter: [["line"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run start --workspace @ask-bangladesh/web -- --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
