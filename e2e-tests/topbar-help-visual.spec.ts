/**
 * Visual-only screenshot capture for the TopBar support email link.
 * Crops the top-right area of the topbar so we can eyeball:
 *  - inline email reads cleanly to the right of the badge
 *  - balance vs the "Start my trial now" pill and profile area
 *  - hover background highlight (ghost variant)
 *  - keyboard focus ring
 */

import { test, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SUPPORT_EMAIL = "support@transcribetotext.ai";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "topbar-help");

async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.locator("#email").pressSequentially("admin@test.com", { delay: 10 });
  await page.locator("#password").pressSequentially("admin123", { delay: 10 });
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

test("topbar right-side visual capture", async ({ page }) => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsDemo(page);

  // Find the topbar containing the support email link (not the brand bar)
  const link = page.locator(`a[href="mailto:${SUPPORT_EMAIL}"]`);
  const topbar = page.locator("div.h-\\[56px\\]").filter({ has: link }).first();
  const box = await topbar.boundingBox();
  if (!box) throw new Error("topbar not found");

  // Default state — cropped to right half of topbar
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "10-default-rightcrop.png"),
    clip: {
      x: box.x + box.width * 0.35,
      y: box.y,
      width: box.width * 0.65,
      height: box.height + 4,
    },
  });

  // Full topbar
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "11-full-topbar.png"),
    clip: { x: box.x, y: box.y, width: box.width, height: box.height + 4 },
  });

  // Hover state
  await link.hover();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "12-hover-rightcrop.png"),
    clip: {
      x: box.x + box.width * 0.35,
      y: box.y,
      width: box.width * 0.65,
      height: box.height + 4,
    },
  });

  // Focus state via keyboard
  await page.mouse.move(0, 0);
  await link.evaluate((el) => (el as HTMLElement).blur());
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const ok = await link.evaluate((el) => el === document.activeElement);
    if (ok) break;
  }
  await page.waitForTimeout(150);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "13-focus-rightcrop.png"),
    clip: {
      x: box.x + box.width * 0.35,
      y: box.y,
      width: box.width * 0.65,
      height: box.height + 8,
    },
  });
});
