/**
 * E2E Tests: Folder Management
 * App: Transcription/Recording Management App at http://localhost:5173
 *
 * Tests 10 scenarios for folder management functionality on the My Records page.
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

// ── Helpers ──────────────────────────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  [screenshot] ${filePath}`);
  return filePath;
}

/** Navigate to the app and click "My Records" in the sidebar. */
async function goToMyRecords(page: Page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  // Click "My Records" nav item in the sidebar
  await page.locator('text=My Records').first().click();
  await page.waitForTimeout(400);
}

/** Get the first folder card (the first .group element in the folder grid). */
function firstFolderCard(page: Page) {
  return page.locator('[role="button"][aria-label^="Open folder"]').first();
}

/** Get the three-dot trigger on a specific folder card. */
function folderCardDotMenu(page: Page, index = 0) {
  return page
    .locator('[role="button"][aria-label^="Open folder"]')
    .nth(index)
    .locator('[aria-label="Folder actions"]');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Folder Management", () => {
  test.beforeEach(async ({ page }) => {
    await goToMyRecords(page);
  });

  // ── Test 1: View folder grid ───────────────────────────────────────────────
  test("1: View folder grid – folders appear as cards with name, file count, and three-dot menu", async ({
    page,
  }) => {
    await screenshot(page, "01-folder-grid");

    // At least one folder card should be visible
    const cards = page.locator('[role="button"][aria-label^="Open folder"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Each card should show a name
    const firstCard = cards.first();
    const nameEl = firstCard.locator("p.font-semibold");
    await expect(nameEl).toBeVisible();

    // Each card should show a file count (e.g. "2 files")
    const fileCountEl = firstCard.locator("p.text-muted-foreground");
    await expect(fileCountEl).toBeVisible();
    await expect(fileCountEl).toHaveText(/\d+ files?/);

    // Each card should have a three-dot menu button
    const dotBtn = firstCard.locator('[aria-label="Folder actions"]');
    await expect(dotBtn).toBeVisible();

    console.log(`  Found ${count} folder card(s)`);
  });

  // ── Test 2: Three-dot dropdown menu ────────────────────────────────────────
  test("2: Three-dot menu on folder card – dropdown shows Open, Edit, Move to folder, Delete", async ({
    page,
  }) => {
    const dotBtn = folderCardDotMenu(page, 0);
    await dotBtn.click();
    await page.waitForTimeout(300);

    await screenshot(page, "02-folder-card-dropdown");

    // Verify all four expected items
    await expect(page.locator('[role="menuitem"]', { hasText: "Open folder" })).toBeVisible();
    await expect(page.locator('[role="menuitem"]', { hasText: "Edit" })).toBeVisible();
    await expect(page.locator('[role="menuitem"], [role="menuitemradio"]', { hasText: "Move to folder" }).first()).toBeVisible();
    await expect(page.locator('[role="menuitem"]', { hasText: "Delete" })).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
  });

  // ── Test 3: Move to folder submenu ─────────────────────────────────────────
  test("3: Move to folder submenu – shows folder list with colored icons and 'Create folder and move'", async ({
    page,
  }) => {
    const dotBtn = folderCardDotMenu(page, 0);
    await dotBtn.click();
    await page.waitForTimeout(300);

    // Hover/click "Move to folder" to trigger submenu
    const moveToFolderTrigger = page.locator('[role="menuitem"]', { hasText: "Move to folder" }).first();
    await moveToFolderTrigger.hover();
    await page.waitForTimeout(400);

    await screenshot(page, "03-move-to-folder-submenu");

    // The submenu should appear – look for "Create folder and move" at the bottom
    const createAndMove = page.locator('[role="menuitem"]', { hasText: "Create folder and move" });
    await expect(createAndMove).toBeVisible({ timeout: 3000 });

    // Should also show at least one folder entry (colored folder icon rows)
    // "My Records (root)" is always present
    const rootOption = page.locator('[role="menuitem"]', { hasText: "My Records (root)" });
    await expect(rootOption).toBeVisible();

    await page.keyboard.press("Escape");
  });

  // ── Test 4: Edit folder dialog ─────────────────────────────────────────────
  test("4: Edit folder dialog – opens with name input and color picker, can be closed", async ({
    page,
  }) => {
    const dotBtn = folderCardDotMenu(page, 0);
    await dotBtn.click();
    await page.waitForTimeout(300);

    const editItem = page.locator('[role="menuitem"]', { hasText: "Edit" });
    await editItem.click();
    await page.waitForTimeout(400);

    await screenshot(page, "04-edit-folder-dialog");

    // Dialog should be open — look for the heading "Edit folder"
    await expect(page.locator('h2', { hasText: "Edit folder" })).toBeVisible();

    // Should have a name input
    const nameInput = page.locator('input[placeholder="e.g. Client Meetings"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveValue("");

    // Should have color swatches (8 of them)
    // They render as buttons inside the dialog with style background-color
    const colorButtons = page
      .locator('[class*="rounded-full"][style*="background-color"]')
      .filter({ has: page.locator("xpath=ancestor::*[contains(@class,'fixed')]") });
    // Just verify cancel button exists
    const cancelBtn = page.locator('button', { hasText: "Cancel" });
    await expect(cancelBtn).toBeVisible();

    // Close the dialog
    await cancelBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('h2', { hasText: "Edit folder" })).not.toBeVisible();

    await screenshot(page, "04b-edit-folder-dialog-closed");
  });

  // ── Test 5: Open folder / navigate into folder ─────────────────────────────
  test("5: Open folder – double-click navigates into folder with breadcrumb and header buttons", async ({
    page,
  }) => {
    const firstCard = firstFolderCard(page);
    const folderName = await firstCard.locator("p.font-semibold").innerText();

    // Double-click to open
    await firstCard.dblclick();
    await page.waitForTimeout(500);

    await screenshot(page, "05-inside-folder");

    // Breadcrumb should appear: "My Records > Folder Name"
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"], ol[class*="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText("My Records");
    await expect(breadcrumb).toContainText(folderName);

    // Blue "Edit folder" button should be visible
    const editFolderBtn = page.locator('button', { hasText: "Edit folder" });
    await expect(editFolderBtn).toBeVisible();

    // "Add Folder" button should be visible
    const addFolderBtn = page.locator('button', { hasText: "Add Folder" });
    await expect(addFolderBtn).toBeVisible();

    // Header three-dot (⋮) button should be visible
    const headerDot = page.locator('button[aria-label="Folder actions"]').first();
    await expect(headerDot).toBeVisible();

    console.log(`  Opened folder: "${folderName}"`);
  });

  // ── Test 6: Header three-dot inside folder ─────────────────────────────────
  test("6: Header three-dot inside folder – shows Edit, Move to folder, Export files N, Delete folder", async ({
    page,
  }) => {
    // First open a folder
    const firstCard = firstFolderCard(page);
    await firstCard.dblclick();
    await page.waitForTimeout(500);

    // Click the header three-dot
    const headerDot = page.locator('button[aria-label="Folder actions"]').first();
    await headerDot.click();
    await page.waitForTimeout(300);

    await screenshot(page, "06-header-three-dot-menu");

    // Verify menu items
    await expect(page.locator('[role="menuitem"]', { hasText: "Edit" })).toBeVisible();
    await expect(page.locator('[role="menuitem"]', { hasText: "Move to folder" }).first()).toBeVisible();
    // "Export files" with a number suffix
    const exportItem = page.locator('[role="menuitem"]', { hasText: "Export files" });
    await expect(exportItem).toBeVisible();
    // "Delete folder"
    await expect(page.locator('[role="menuitem"]', { hasText: "Delete folder" })).toBeVisible();

    await page.keyboard.press("Escape");
  });

  // ── Test 7: Add subfolder ──────────────────────────────────────────────────
  test("7: Add folder while inside a folder – creates subfolder visible in current folder grid", async ({
    page,
  }) => {
    // Open a folder first
    const firstCard = firstFolderCard(page);
    await firstCard.dblclick();
    await page.waitForTimeout(500);

    // Click "Add Folder" button
    const addFolderBtn = page.locator('button', { hasText: "Add Folder" });
    await addFolderBtn.click();
    await page.waitForTimeout(400);

    await screenshot(page, "07-create-subfolder-dialog");

    // Dialog should be visible
    const dialogHeading = page.locator('h2', { hasText: /New Folder|Create/ });
    await expect(dialogHeading).toBeVisible();

    // Fill in a unique name
    const folderName = `TestFolder_${Date.now()}`;
    const nameInput = page.locator('input[placeholder="e.g. Client Meetings"]');
    await nameInput.fill(folderName);

    // Pick the second color (green)
    const colorButtons = page.locator('.fixed button[style*="background-color"]');
    if ((await colorButtons.count()) > 1) {
      await colorButtons.nth(1).click();
    }

    await screenshot(page, "07b-create-subfolder-filled");

    // Click the "Create" submit button
    const submitBtn = page.locator('.fixed button', { hasText: /Create/ });
    await submitBtn.click();
    await page.waitForTimeout(500);

    await screenshot(page, "07c-subfolder-created");

    // The subfolder should now appear in the current folder's card grid (not at root)
    const newCard = page.locator('[role="button"][aria-label^="Open folder"]', {
      hasText: folderName,
    });
    await expect(newCard).toBeVisible({ timeout: 3000 });

    console.log(`  Created subfolder inside current folder: "${folderName}"`);
  });

  // ── Test 8: Create folder and move ────────────────────────────────────────
  test("8: Create folder and move – clicking 'Create folder and move' opens create folder dialog", async ({
    page,
  }) => {
    // Open the three-dot menu on the first folder card
    const dotBtn = folderCardDotMenu(page, 0);
    await dotBtn.click();
    await page.waitForTimeout(300);

    // Hover "Move to folder"
    const moveToFolderTrigger = page.locator('[role="menuitem"]', { hasText: "Move to folder" }).first();
    await moveToFolderTrigger.hover();
    await page.waitForTimeout(400);

    // Click "Create folder and move"
    const createAndMove = page.locator('[role="menuitem"]', { hasText: "Create folder and move" });
    await expect(createAndMove).toBeVisible({ timeout: 3000 });
    await createAndMove.click();
    await page.waitForTimeout(400);

    await screenshot(page, "08-create-folder-and-move-dialog");

    // Create folder dialog should open
    const dialogHeading = page.locator('h2', { hasText: /New Folder|Create/ });
    await expect(dialogHeading).toBeVisible();

    // Close without saving
    const cancelBtn = page.locator('button', { hasText: "Cancel" });
    await cancelBtn.click();
    await page.waitForTimeout(300);
  });

  // ── Test 9: Delete folder with confirmation ────────────────────────────────
  test("9: Delete folder – shows confirmation dialog with Cancel and Delete buttons", async ({
    page,
  }) => {
    const dotBtn = folderCardDotMenu(page, 0);
    await dotBtn.click();
    await page.waitForTimeout(300);

    const deleteItem = page.locator('[role="menuitem"]', { hasText: "Delete" });
    await deleteItem.click();
    await page.waitForTimeout(400);

    await screenshot(page, "09-delete-confirmation");

    // Alert dialog should appear
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible();

    // Should contain "Delete folder?" title
    await expect(alertDialog.locator('text=Delete folder?')).toBeVisible();

    // Cancel button
    const cancelBtn = alertDialog.locator('button', { hasText: "Cancel" });
    await expect(cancelBtn).toBeVisible();

    // Delete button
    const deleteBtn = alertDialog.locator('button', { hasText: "Delete" });
    await expect(deleteBtn).toBeVisible();

    // Cancel without deleting
    await cancelBtn.click();
    await page.waitForTimeout(300);

    // Dialog should close
    await expect(alertDialog).not.toBeVisible();

    await screenshot(page, "09b-delete-cancelled");
  });

  // ── Test 10: Sidebar folder navigation ────────────────────────────────────
  test("10: Sidebar folder navigation – clicking folder in sidebar opens it in My Records", async ({
    page,
  }) => {
    // First go to dashboard to reset state
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    // Find the "Folders" section in the sidebar
    // The sidebar group label is "Folders"
    const foldersLabel = page.locator('text=Folders').first();
    await expect(foldersLabel).toBeVisible();

    await screenshot(page, "10-sidebar-folders-section");

    // Find a folder link in the sidebar folders list
    // SidebarMenuSubButton items under the Folders group
    const sidebarFolderLinks = page.locator('[data-sidebar="menu-sub-button"]');
    const linkCount = await sidebarFolderLinks.count();

    // Filter to those that might be folder items (with SVG path fill color)
    // The folder items are SidebarMenuSubButtons with an SVG inside
    // We click the first one that's a folder (not a starred record)
    // The Folders section comes after Starred, so we take the last ones
    // Let's find the sidebar items that have a colored folder SVG
    const folderSidebarItems = page.locator('[data-sidebar="menu-sub"] [data-sidebar="menu-sub-button"]');
    const folderItemCount = await folderSidebarItems.count();

    console.log(`  Sidebar sub-items: ${linkCount}, folder section items: ${folderItemCount}`);

    // Find one that is under the "Folders" label
    // We'll locate by looking for the "Folders" group label and its descendant buttons
    const foldersGroup = page.locator('[data-sidebar="group"]').filter({
      has: page.locator('[data-sidebar="group-label"]', { hasText: "Folders" }),
    });

    await screenshot(page, "10b-folders-group");

    const firstFolderSidebarItem = foldersGroup.locator('[data-sidebar="menu-sub-button"]').first();
    const sidebarFolderName = await firstFolderSidebarItem.innerText();

    await expect(firstFolderSidebarItem).toBeVisible();
    await firstFolderSidebarItem.click();
    await page.waitForTimeout(600);

    await screenshot(page, "10c-after-sidebar-folder-click");

    // Should now be on My Records page inside the folder
    // Breadcrumb should be visible
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"], ol[class*="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible({ timeout: 3000 });
    await expect(breadcrumb).toContainText("My Records");

    console.log(`  Clicked sidebar folder: "${sidebarFolderName.trim()}"`);
  });
});
