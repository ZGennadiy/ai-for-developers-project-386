import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",

  // The backend is one shared in-memory instance for the whole run, and
  // booking a slot for any event type globally excludes that time slot for
  // all other event types (see backend/internal/booking/store.go). Running
  // tests serially keeps each test's "first available slot" query correct
  // relative to whatever earlier tests already booked.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "go run .",
      cwd: "../backend",
      url: `${BACKEND_URL}/api/owner`,
      env: { PORT: "3000", FRONTEND_ORIGIN: FRONTEND_URL },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: FRONTEND_URL,
      env: { VITE_API_BASE_URL: `${BACKEND_URL}/api` },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
