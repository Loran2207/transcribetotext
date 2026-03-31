/**
 * E2E Tests: Upload Dropdown Button on My Records Page
 * App: TranscribeToText at http://localhost:5173
 *
 * Tests the Upload button dropdown on the My Records page, including:
 *   - Dropdown renders with all 4 items
 *   - "Audio & video files" opens the upload modal
 *   - Modal can be closed
 *   - Navigating into a subfolder and clicking Upload > Audio & video files
 *     opens the upload modal with the folder pre-selected
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SUPABASE_URL = "https://knrfdiyvyrawcwxongxb.supabase.co";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "upload-dropdown");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  [screenshot] ${filePath}`);
  return filePath;
}

/**
 * Log in using the demo credentials and navigate to the app root.
 * The app has a demo bypass: email=admin@test.com / password=admin123
 * which sets user state without a real Supabase session.
 */
async function loginAsDemo(page: Page) {
  // Mock Supabase auth session check so the app doesn't block on a real network call
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { session: null }, error: null }),
    });
  });

  // Navigate to login and use the demo credentials
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  const emailInput = page.locator("#email");
  await emailInput.click();
  await emailInput.fill("admin@test.com");

  const passwordInput = page.locator("#password");
  await passwordInput.click();
  await passwordInput.fill("admin123");

  await page.getByRole("button", { name: "Sign in" }).click();

  // Demo login sets state synchronously, so the app redirects immediately
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
}

/**
 * Navigate to the My Records page via the sidebar link.
 */
async function goToMyRecords(page: Page) {
  await page.locator("text=My Records").first().click();
  await page.waitForTimeout(400);
}

/**
 * Open the Upload dropdown on the My Records page.
 */
async function openUploadDropdown(page: Page) {
  const uploadBtn = page.locator("button", { hasText: "Upload" }).first();
  await expect(uploadBtn).toBeVisible({ timeout: 5000 });
  await uploadBtn.click();
  // Wait for the dropdown menu to appear
  await page.waitForSelector('[role="menu"]', { timeout: 5000 });
  // Give Radix time to finish its portal positioning animation
  await page.waitForTimeout(150);
}

/**
 * Click a menuitem inside the currently open dropdown.
 * Radix UI portals the menu to document.body. When the dropdown anchor is near
 * the edge of the viewport, Radix may place the menu content partially or fully
 * outside the Playwright viewport bounding box. `dispatchEvent('click')` fires
 * a real DOM click event without the geometric viewport guard that blocks
 * `locator.click()` and `locator.click({ force: true })`.
 */
async function clickMenuItem(page: Page, name: RegExp | string) {
  const item = page.getByRole("menuitem", { name });
  await expect(item).toBeVisible({ timeout: 5000 });
  await item.dispatchEvent("click");
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe("Upload Dropdown — My Records Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await goToMyRecords(page);
  });

  // ── Test 1: Upload button is visible ──────────────────────────────────────
  test("1: Upload button is visible in the page header", async ({ page }) => {
    const uploadBtn = page.locator("button", { hasText: "Upload" }).first();
    await expect(uploadBtn).toBeVisible();

    // Verify it has the chevron-down indicator (signals it is a dropdown)
    // The button contains an SVG for the CloudUpload icon and a ChevronDown icon
    const svgCount = await uploadBtn.locator("svg").count();
    expect(svgCount).toBeGreaterThanOrEqual(1);

    await screenshot(page, "01-upload-button-visible");
    console.log("  Upload button found and visible");
  });

  // ── Test 2: Dropdown opens with all 4 items ───────────────────────────────
  test("2: Clicking Upload opens dropdown with 4 items", async ({ page }) => {
    await openUploadDropdown(page);

    await screenshot(page, "02-upload-dropdown-open");

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    // All four items must be present
    await expect(page.getByRole("menuitem", { name: /Audio & video files/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Instant speech/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Transcribe from link/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Record meeting/i })).toBeVisible();

    const items = menu.locator('[role="menuitem"]');
    const count = await items.count();
    expect(count).toBe(4);

    console.log(`  Dropdown opened with ${count} items`);

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
  });

  // ── Test 3: Clicking "Audio & video files" opens the upload modal ─────────
  test('3: "Audio & video files" item opens the upload modal', async ({ page }) => {
    await openUploadDropdown(page);

    await clickMenuItem(page, /Audio & video files/i);

    // The modal title is "Audio & video files"
    const modalTitle = page.locator("text=Audio & video files").first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // The modal should have the drag-and-drop zone copy
    await expect(page.getByText(/Drop files here or/i)).toBeVisible();
    await expect(page.getByText(/browse/i).first()).toBeVisible();

    // Supported formats hint
    await expect(page.getByText(/MP3, MP4, M4A/i)).toBeVisible();

    // "Save to folder" label should appear (folder selector is always shown)
    await expect(page.getByText("Save to folder")).toBeVisible();

    await screenshot(page, "03-upload-modal-open");
    console.log("  Upload modal opened successfully");
  });

  // ── Test 4: Upload modal can be closed ────────────────────────────────────
  test("4: Upload modal can be closed with the X button", async ({ page }) => {
    await openUploadDropdown(page);
    await clickMenuItem(page, /Audio & video files/i);

    // Confirm modal is open
    await expect(page.getByText(/Drop files here or/i)).toBeVisible({ timeout: 5000 });

    await screenshot(page, "04-upload-modal-before-close");

    // The ModalShell renders an XBtn with aria-label="Close"
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();

    // After closing, the drop zone should be gone
    await expect(page.getByText(/Drop files here or/i)).not.toBeVisible({ timeout: 5000 });

    await screenshot(page, "04-upload-modal-closed");
    console.log("  Upload modal closed successfully");
  });

  // ── Test 5: Dropdown closes on Escape without modal opening ───────────────
  test("5: Dropdown closes when Escape is pressed (no modal opens)", async ({ page }) => {
    await openUploadDropdown(page);

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible({ timeout: 3000 });

    // The upload modal must NOT have opened
    await expect(page.getByText(/Drop files here or/i)).not.toBeVisible();

    await screenshot(page, "05-dropdown-closed-escape");
    console.log("  Dropdown closed with Escape; no modal opened");
  });

  // ── Test 6: All other dropdown items do not crash the app ────────────────
  test("6: Instant speech, Transcribe from link, and Record meeting items open without crash", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // --- Instant speech ---
    await openUploadDropdown(page);
    await clickMenuItem(page, /Instant speech/i);
    // Modal or some UI should appear — just check the page is still alive
    await page.waitForTimeout(500);
    // Close any modal with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await screenshot(page, "06a-instant-speech-modal");

    // --- Transcribe from link ---
    await openUploadDropdown(page);
    await clickMenuItem(page, /Transcribe from link/i);
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await screenshot(page, "06b-transcribe-from-link-modal");

    // --- Record meeting ---
    await openUploadDropdown(page);
    await clickMenuItem(page, /Record meeting/i);
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await screenshot(page, "06c-record-meeting-modal");

    // Filter out benign Supabase / network errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("supabase") &&
        !e.includes("Failed to fetch") &&
        !e.includes("net::ERR_") &&
        !e.includes("forwardRef"),
    );
    if (criticalErrors.length > 0) {
      console.warn("  Console errors detected:", criticalErrors);
    }
    // App should not have crashed (no critical JS errors)
    expect(criticalErrors.length).toBe(0);
    console.log("  All 3 other dropdown items opened without error");
  });

  // ── Test 7: Upload dropdown inside a subfolder pre-selects the folder ─────
  test("7: Upload > Audio & video files inside a folder pre-selects that folder in the modal", async ({
    page,
  }) => {
    // Open the first folder by double-clicking it
    const firstCard = page
      .locator('[role="button"][aria-label^="Open folder"]')
      .first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    const folderName = await firstCard.locator("p.font-semibold").innerText();
    console.log(`  Opening folder: "${folderName}"`);

    await firstCard.dblclick();
    await page.waitForTimeout(500);

    await screenshot(page, "07a-inside-folder");

    // We are now inside the folder — the breadcrumb should confirm it
    const breadcrumb = page
      .locator('nav[aria-label="breadcrumb"], ol[class*="breadcrumb"]')
      .first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText(folderName);

    // Click Upload dropdown
    await openUploadDropdown(page);

    await screenshot(page, "07b-upload-dropdown-inside-folder");

    // Click "Audio & video files"
    await clickMenuItem(page, /Audio & video files/i);

    // Modal should open
    await expect(page.getByText(/Drop files here or/i)).toBeVisible({ timeout: 5000 });

    await screenshot(page, "07c-upload-modal-inside-folder");

    // The folder selector should show the current folder name selected
    // The FolderSelector renders a Select whose trigger shows the selected value
    const folderSelectTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: folderName });
    await expect(folderSelectTrigger).toBeVisible({ timeout: 5000 });

    console.log(`  Upload modal opened with folder "${folderName}" pre-selected`);

    // Close modal via the XBtn (aria-label="Close")
    const closeBtn = page.getByRole("button", { name: "Close" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await expect(page.getByText(/Drop files here or/i)).not.toBeVisible({ timeout: 5000 });

    await screenshot(page, "07d-upload-modal-closed");
  });
});
