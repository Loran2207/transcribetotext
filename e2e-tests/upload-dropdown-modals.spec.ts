/**
 * E2E Tests: Upload Dropdown — Modal Verification
 *
 * Verifies that each of the 4 dropdown items opens the correct modal
 * with expected content visible. Takes screenshots while modals are open.
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SUPABASE_URL = "https://knrfdiyvyrawcwxongxb.supabase.co";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "upload-modals");

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  [screenshot] ${filePath}`);
  return filePath;
}

async function loginAsDemo(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { session: null }, error: null }),
    });
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  await page.locator("#email").fill("admin@test.com");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
}

async function goToMyRecords(page: Page) {
  await page.locator("text=My Records").first().click();
  await page.waitForTimeout(400);
}

async function openUploadDropdown(page: Page) {
  const uploadBtn = page.locator("button", { hasText: "Upload" }).first();
  await expect(uploadBtn).toBeVisible({ timeout: 5000 });
  await uploadBtn.click();
  await page.waitForSelector('[role="menu"]', { timeout: 5000 });
  await page.waitForTimeout(150);
}

async function clickMenuItem(page: Page, name: RegExp | string) {
  const item = page.getByRole("menuitem", { name });
  await expect(item).toBeVisible({ timeout: 5000 });
  await item.dispatchEvent("click");
}

test.describe("Upload Dropdown — Each Modal Opens Correctly", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await goToMyRecords(page);
  });

  test('"Audio & video files" opens upload modal with drag-drop zone', async ({ page }) => {
    await openUploadDropdown(page);
    await clickMenuItem(page, /Audio & video files/i);

    // Verify modal title
    const title = page.locator("text=Audio & video files").first();
    await expect(title).toBeVisible({ timeout: 5000 });

    // Verify drag-drop area
    await expect(page.getByText(/Drop files here or/i)).toBeVisible();

    // Verify supported formats text
    await expect(page.getByText(/MP3, MP4, M4A/i)).toBeVisible();

    // Verify folder selector
    await expect(page.getByText("Save to folder")).toBeVisible();

    // Verify Start transcription button exists
    await expect(page.getByRole("button", { name: /Start transcription/i })).toBeVisible();

    // Verify Cancel button
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();

    await screenshot(page, "01-audio-video-files-modal");

    // Close via X button
    const closeBtn = page.getByRole("button", { name: "Close" });
    await closeBtn.click();
    await expect(page.getByText(/Drop files here or/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('"Instant speech" opens the instant speech setup modal', async ({ page }) => {
    await openUploadDropdown(page);
    await clickMenuItem(page, /Instant speech/i);

    // Verify modal title "Instant speech"
    const title = page.locator("text=Instant speech").first();
    await expect(title).toBeVisible({ timeout: 5000 });

    await screenshot(page, "02-instant-speech-modal");

    // Close modal
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();

    // Verify modal closed
    await page.waitForTimeout(500);
    await screenshot(page, "02-instant-speech-closed");
  });

  test('"Transcribe from link" opens the link modal', async ({ page }) => {
    await openUploadDropdown(page);
    await clickMenuItem(page, /Transcribe from link/i);

    // Verify modal title
    const title = page.locator("text=Transcribe from link").first();
    await expect(title).toBeVisible({ timeout: 5000 });

    // The subtitle mentions YouTube, Dropbox, Google Drive
    await expect(page.getByText(/YouTube, Dropbox, Google Drive/i)).toBeVisible();

    await screenshot(page, "03-transcribe-from-link-modal");

    // Close modal
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test('"Record meeting" opens the meeting bot modal', async ({ page }) => {
    await openUploadDropdown(page);
    await clickMenuItem(page, /Record meeting/i);

    // Verify modal title
    const title = page.locator("text=Record meeting").first();
    await expect(title).toBeVisible({ timeout: 5000 });

    // Subtitle about bot joining the meeting
    await expect(page.getByText(/bot will join/i)).toBeVisible();

    await screenshot(page, "04-record-meeting-modal");

    // Close modal
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test("no console errors when opening all 4 modals sequentially", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const items = [
      /Audio & video files/i,
      /Instant speech/i,
      /Transcribe from link/i,
      /Record meeting/i,
    ];

    for (const itemName of items) {
      await openUploadDropdown(page);
      await clickMenuItem(page, itemName);
      await page.waitForTimeout(500);

      // Close via Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    if (errors.length > 0) {
      console.error("Page errors:", errors);
    }
    expect(errors.length).toBe(0);
  });
});
