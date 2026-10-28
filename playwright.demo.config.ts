import { defineConfig, devices } from "@playwright/test";

/** Parcours de la démo hors ligne compilée, servie sous /AutoScope/ comme sur GitHub Pages. */
const PORT = 4174;
const baseURL = `http://localhost:${PORT}/AutoScope/`;

export default defineConfig({
  testDir: "tests/e2e-demo",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run demo:build && npx vite preview --config demo/vite.config.ts --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DEMO_BASE: "/AutoScope/" },
  },
});
