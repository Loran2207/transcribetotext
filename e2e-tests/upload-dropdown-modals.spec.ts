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
const TEMPLATE_FIXTURES = [
  {
    id: "template-general-meeting",
    user_id: null,
    name: "General meeting",
    description: "Versatile meeting summary",
    instructions: null,
    sections: [],
    type: "built_in",
    is_locked: false,
    is_default: false,
    auto_assign_keywords: [],
    usage_count: 0,
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
  },
];

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
  await page.route(`${SUPABASE_URL}/rest/v1/templates**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(TEMPLATE_FIXTURES),
    });
  });
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
  const desktopButton = page.getByRole("button", { name: "Upload" }).first();
  const uploadBtn = await desktopButton.isVisible()
    ? desktopButton
    : page.getByRole("button", { name: "New transcription" }).first();
  await expect(uploadBtn).toBeVisible({ timeout: 5000 });
  await uploadBtn.click();
  await expect(
    page.getByRole("menu").or(page.getByRole("dialog", { name: "New transcription" })),
  ).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(150);
}

async function clickMenuItem(page: Page, name: RegExp | string) {
  const item = page
    .getByRole("menuitem", { name })
    .or(page.getByRole("dialog", { name: "New transcription" }).getByRole("button", { name }))
    .first();
  await expect(item).toBeVisible({ timeout: 5000 });
  await item.dispatchEvent("click");
}

async function expectTemplateBeforeFolder(page: Page) {
  const dialog = page.getByRole("dialog").last();
  const templateButton = dialog.getByRole("button", { name: "Select template" });
  const templateLabel = templateButton.locator("..").getByText("Template", { exact: true });
  const folderLabel = dialog.getByText("Save to folder", { exact: true });
  const folderButton = folderLabel.locator("..").getByRole("combobox");

  await expect(templateLabel).toBeVisible();
  await expect(templateButton).toBeVisible();
  await expect(folderLabel).toBeVisible();

  const templateBox = await templateButton.boundingBox();
  const folderBox = await folderButton.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(folderBox).not.toBeNull();
  if ((page.viewportSize()?.width ?? 1280) < 640) {
    expect(templateBox!.y).toBeLessThan(folderBox!.y);
  } else {
    expect(templateBox!.x).toBeLessThan(folderBox!.x);
  }
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
    await expectTemplateBeforeFolder(page);

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
    await expectTemplateBeforeFolder(page);

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

    // The subtitle names the supported URL sources
    await expect(page.getByText(/YouTube, Instagram, Dropbox, Google Drive/i)).toBeVisible();
    await expectTemplateBeforeFolder(page);

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
    await expectTemplateBeforeFolder(page);

    await screenshot(page, "04-record-meeting-modal");

    // Close modal
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test('"Record meeting" lets a Pro user select and clear a template', async ({ page }) => {
    await page.evaluate(() => window.localStorage.setItem("ttt_plan", "pro"));
    await openUploadDropdown(page);
    await clickMenuItem(page, /Record meeting/i);

    const trigger = page.getByRole("button", { name: "Select template" });
    await trigger.click();
    await page.getByRole("button", { name: /General meeting/ }).click();
    await expect(page.getByPlaceholder("Search templates")).toBeHidden();
    const selectedTrigger = page.getByRole("button", { name: /General meeting/ }).first();
    await expect(selectedTrigger).toBeVisible();

    await selectedTrigger.click();
    await page.getByRole("button", { name: /No template/ }).click();
    await expect(page.getByRole("button", { name: "Select template" })).toBeVisible();
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

  for (const width of [390, 834, 1440]) {
    test(`all 4 modal layouts fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await loginAsDemo(page);
      await goToMyRecords(page);

      const items = [
        /Audio & video files/i,
        /Instant speech/i,
        /Transcribe from (link|URL)/i,
        /(Record meeting|Meeting Recorder)/i,
      ];

      for (const itemName of items) {
        await openUploadDropdown(page);
        await clickMenuItem(page, itemName);
        await expectTemplateBeforeFolder(page);

        const dialog = page.getByRole("dialog").last();
        const templateBox = await dialog.getByRole("button", { name: "Select template" }).boundingBox();
        const folderLabel = dialog.getByText("Save to folder", { exact: true });
        const folderBox = await folderLabel.locator("..").getByRole("combobox").boundingBox();
        expect(templateBox).not.toBeNull();
        expect(folderBox).not.toBeNull();
        expect(templateBox!.x).toBeGreaterThanOrEqual(0);
        expect(templateBox!.x + templateBox!.width).toBeLessThanOrEqual(width);
        expect(folderBox!.x).toBeGreaterThanOrEqual(0);

        if (width < 640) expect(templateBox!.y).toBeLessThan(folderBox!.y);
        else expect(templateBox!.x).toBeLessThan(folderBox!.x);

        await dialog.getByRole("button", { name: "Close" }).click();
        await expect(dialog).toBeHidden();
      }
    });
  }
});
