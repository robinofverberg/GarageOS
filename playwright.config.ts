import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const npmRunStart =
  process.platform === "win32" ? "npm.cmd run start" : "npm run start";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: npmRunStart,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://garageos:garageos@localhost:5432/garageos_test?schema=public",
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "test-secret-for-playwright-auth-sessions-please-replace-in-ci",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
