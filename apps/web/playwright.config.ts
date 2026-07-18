import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E. Zero-key: the app runs in collapsed mode (GraphQL mounted in
 * Next) and the happy path uses the in-app simulated location driver, so no real
 * geolocation, provider keys, or external services are needed.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/foodmap",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
