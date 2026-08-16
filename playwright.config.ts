import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite for the service-worker caching strategy.
 * See docs/caching-strategy.md — these tests guard the rules described there.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    serviceWorkers: "allow",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Allows running against a preinstalled Chromium (e.g. sandboxes/CI
        // images) instead of Playwright's own download.
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
});