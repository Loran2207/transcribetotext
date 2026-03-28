import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: __dirname,
  outputDir: path.join(__dirname, "test-results"),
  timeout: 30000,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(__dirname, "html-report"), open: "never" }],
    ["junit", { outputFile: path.join(__dirname, "results.xml") }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
