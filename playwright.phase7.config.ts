import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/phase7",
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3117",
    browserName: "chromium",
    viewport: { width: 375, height: 812 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start --workspace @ask-bangladesh/web -- --port 3117",
    url: "http://127.0.0.1:3117",
    reuseExistingServer: false,
    env: { CHAT_MODE: "api" },
    timeout: 60000,
  },
});
