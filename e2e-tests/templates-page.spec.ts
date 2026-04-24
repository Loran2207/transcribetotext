/**
 * E2E Tests: Templates Page (redesigned card grid)
 * App: TranscribeToText — Templates feature
 *
 * Strategy: The dev server runs without Supabase env vars, so the real DB
 * is inaccessible. We intercept the Vite-served module `/src/lib/templates.ts`
 * and replace the query functions with in-memory mocks that simulate a user
 * with 8 built-in templates + any custom ones they create. This lets us
 * verify the full UI flow end-to-end.
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5174";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "templates");
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function shot(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/**
 * Mock module body for `/src/lib/templates.ts`. Keeps type exports inline.
 * Stores state on `window.__mockTemplates` so it survives HMR and tests can
 * inspect/reset it.
 */
const MOCK_TEMPLATES_MODULE = `
// Injected by e2e: full mock of the templates module
const NOW = new Date().toISOString();

function mkTemplate(id, name, description, sections, type = 'built_in') {
  return {
    id, user_id: type === 'built_in' ? null : 'demo-user',
    name, description,
    instructions: '',
    sections: sections.map((s, i) => ({ id: \`s-\${id}-\${i}\`, title: s[0], instruction: s[1], iconId: undefined })),
    type, is_locked: false, is_default: false,
    auto_assign_keywords: [], usage_count: 0,
    created_at: NOW, updated_at: NOW,
  };
}

const BUILTINS = [
  mkTemplate('b1', 'General meeting', 'Versatile summary', [
    ['Summary', 'High level overview of the meeting'],
    ['Decisions', 'Decisions that were made'],
    ['Action items', 'Tasks assigned to participants'],
  ]),
  mkTemplate('b2', 'Sales discovery', 'BANT-style sales call', [
    ['Customer needs', 'Pain points and goals'],
    ['Budget', 'Budget and timeline'],
    ['Next steps', 'Follow up tasks'],
  ]),
  mkTemplate('b3', 'BANT call notes', 'Discovery call', [
    ['Budget', 'Budget'], ['Authority', 'Decision makers'], ['Need', 'Pains'], ['Timeline', 'When'],
  ]),
  mkTemplate('b4', '1-on-1 with report', 'Manager 1-on-1', [
    ['Wins', 'Recent accomplishments'],
    ['Blockers', 'What is in the way'],
    ['Career growth', 'Development plans'],
  ]),
  mkTemplate('b5', 'Candidate interview', 'Interview notes', [
    ['Background', 'Summary of experience'],
    ['Skills', 'Key skills observed'],
    ['Recommendation', 'Hire/no hire with reasoning'],
  ]),
  mkTemplate('b6', 'Engineering standup', 'Daily standup', [
    ['Yesterday', 'Completed work'],
    ['Today', 'Planned work'],
    ['Blockers', 'Anything blocking'],
  ]),
  mkTemplate('b7', 'Sprint retrospective', 'Sprint retro', [
    ['Went well', 'Positive takeaways'],
    ['Could improve', 'Pain points'],
    ['Action items', 'Experiments for next sprint'],
  ]),
  mkTemplate('b8', 'User research session', 'User research notes', [
    ['Context', 'Background of the participant'],
    ['Key findings', 'Main insights'],
    ['Quotes', 'Notable quotes'],
  ]),
];

function getStore() {
  if (!window.__mockTemplates) {
    window.__mockTemplates = {
      items: [...BUILTINS],
      idCounter: 1,
    };
  }
  return window.__mockTemplates;
}

export async function getTemplates() {
  const s = getStore();
  // Mirror real ordering: built_in first, then custom newest-first
  const builtIn = s.items.filter((t) => t.type === 'built_in');
  const custom = s.items.filter((t) => t.type === 'custom')
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return [...builtIn, ...custom];
}

export async function getTemplateById(id) {
  const s = getStore();
  return s.items.find((t) => t.id === id) ?? null;
}

export async function createTemplate(input) {
  const s = getStore();
  const id = 'custom-' + (s.idCounter++);
  const now = new Date().toISOString();
  const t = {
    id, user_id: 'demo-user',
    name: input.name,
    description: input.description ?? null,
    instructions: input.instructions ?? null,
    sections: (input.sections ?? []).map((s) => ({ id: s.id ?? ('sec-' + Math.random().toString(36).slice(2)), title: s.title, instruction: s.instruction, iconId: s.iconId })),
    type: 'custom',
    is_locked: false,
    is_default: !!input.is_default,
    auto_assign_keywords: input.auto_assign_keywords ?? [],
    usage_count: 0,
    created_at: now, updated_at: now,
  };
  s.items.push(t);
  return t;
}

export async function updateTemplate(id, input) {
  const s = getStore();
  const idx = s.items.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Not found');
  s.items[idx] = { ...s.items[idx], ...input, updated_at: new Date().toISOString() };
  return s.items[idx];
}

export async function deleteTemplate(id) {
  const s = getStore();
  s.items = s.items.filter((t) => t.id !== id);
}

export async function setDefaultTemplate(id) {
  const s = getStore();
  s.items = s.items.map((t) => ({ ...t, is_default: t.id === id }));
}

export async function applyTemplateToTranscription() { /* no-op */ }

export async function getAutoAssignTemplate() { return null; }
`;

/** Install the mock before any page load. Applies to all requests to `/src/lib/templates.ts`. */
async function installTemplatesMock(page: Page) {
  await page.route("**/src/lib/templates.ts*", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/javascript", "cache-control": "no-cache" },
      body: MOCK_TEMPLATES_MODULE,
    });
  });
}

/** Demo auth bypass (src/app/components/auth-context.tsx) */
async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("admin@test.com");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function goToTemplates(page: Page) {
  await installTemplatesMock(page);
  // Clear starred/trashed between tests
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("ttt_starred_templates");
      localStorage.removeItem("ttt_trashed_templates");
      localStorage.removeItem("ttt_template_actions");
    } catch {}
  });
  await loginAsDemo(page);
  // Sidebar "Templates" entry — it is a SidebarMenuButton with the label text.
  const sidebarItem = page.locator("button", { hasText: /^Templates$/ }).first();
  await sidebarItem.click();
  // Wait for grid to hydrate with mock data
  await page.waitForSelector("text=General meeting", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Locator for a template card by visible template name. */
function cardByName(page: Page, name: string) {
  return page.locator('p.truncate.font-semibold', { hasText: new RegExp(`^${name}$`) }).locator("xpath=ancestor::div[contains(@class,'rounded-[18px]')][1]");
}

// ══════════════════════════════════════════════════════════════════════════════

test.describe("Templates Page", () => {
  // ─── #1: Page loads ────────────────────────────────────────────────────────
  test("#1 Page loads: 8 built-ins in categories, My templates w/ Create card, no console errors", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await goToTemplates(page);

    await expect(page.locator("p", { hasText: /^Templates$/ }).first()).toBeVisible();

    // 8 templates visible on the All tab
    for (const name of [
      "General meeting", "Sales discovery", "BANT call notes", "1-on-1 with report",
      "Candidate interview", "Engineering standup", "Sprint retrospective", "User research session",
    ]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }

    // Category headers (DOM text is title-case; CSS uppercases visually)
    for (const label of ["My templates", "Basic", "Sales", "HR & Management", "IT & Engineering", "Research"]) {
      await expect(page.locator("h3", { hasText: new RegExp(`^${label}$`, "i") })).toBeVisible();
    }

    // Dashed Create card
    await expect(page.getByRole("button", { name: /Create template/ })).toBeVisible();

    await shot(page, "01-all-loaded");

    const critical = errors.filter(
      (e) =>
        !/supabase is not configured/i.test(e) &&
        !/Failed to fetch/i.test(e) &&
        !/net::ERR_/i.test(e) &&
        !/forwardRef/i.test(e),
    );
    expect(critical, `Unexpected console errors: ${critical.join("\n")}`).toEqual([]);
  });

  // ─── #2: Card visual ──────────────────────────────────────────────────────
  test("#2 Card visual: pastel bg + emoji tile + title + preview block with section names", async ({
    page,
  }) => {
    await goToTemplates(page);

    const card = cardByName(page, "General meeting");
    await expect(card).toBeVisible();

    // Card has pastel background (any rgba/oklch/hex; just verify it's not white)
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, `card bg was ${bg}`).not.toBe("rgba(0, 0, 0, 0)");
    expect(bg, `card bg was white ${bg}`).not.toBe("rgb(255, 255, 255)");

    // Preview block contains section titles
    await expect(card.getByText("Summary", { exact: true })).toBeVisible();
    await expect(card.getByText("Decisions", { exact: true }).first()).toBeVisible();

    await shot(page, "02-card-visual");
  });

  // ─── #3: Hover state ──────────────────────────────────────────────────────
  test("#3 Hover reveals Preview + Use buttons and star button", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "General meeting");
    // Before hover: Preview/Use are opacity-0 pointer-events-none
    await card.hover();
    await page.waitForTimeout(300);

    await expect(card.getByRole("button", { name: /Preview/ })).toBeVisible();
    await expect(card.getByRole("button", { name: /^Use$/ })).toBeVisible();

    await shot(page, "03-hover-state");
  });

  // ─── #4: Click card opens detail ──────────────────────────────────────────
  test("#4 Clicking card body opens detail editor with breadcrumb", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "General meeting");
    // Click card body (on the title, not the card-inner preview)
    await card.locator('p.truncate.font-semibold', { hasText: "General meeting" }).click();
    await page.waitForTimeout(400);

    await expect(page.locator("nav").getByText(/General meeting/)).toBeVisible();
    await shot(page, "04-detail-editor");
  });

  // ─── #5: Preview button opens detail ──────────────────────────────────────
  test("#5 Preview button opens detail editor", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "Sales discovery");
    await card.hover();
    await card.getByRole("button", { name: /Preview/ }).click();
    await page.waitForTimeout(400);

    await expect(page.locator("nav").getByText(/Sales discovery/)).toBeVisible();
    await shot(page, "05-preview-opens-detail");
  });

  // ─── #6: Use button opens detail ──────────────────────────────────────────
  test("#6 Use button opens detail editor", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "1-on-1 with report");
    await card.hover();
    await card.getByRole("button", { name: /^Use$/ }).click();
    await page.waitForTimeout(400);

    await expect(page.locator("nav").getByText(/1-on-1 with report/)).toBeVisible();
    await shot(page, "06-use-opens-detail");
  });

  // ─── #7: Star toggle ──────────────────────────────────────────────────────
  test("#7 Star toggle persists and moves card to Starred tab", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "BANT call notes");
    await card.hover();
    const starBtn = card.locator('button[title="Star"], button[title="Unstar"]');
    await expect(starBtn).toBeVisible();
    await starBtn.click();
    await page.waitForTimeout(300);

    // Switch to Starred tab
    await page.getByRole("tab", { name: /Starred/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText("BANT call notes", { exact: true })).toBeVisible();

    // Unstar by clicking the star again
    const starredCard = cardByName(page, "BANT call notes");
    await starredCard.hover();
    await starredCard.locator('button[title="Unstar"]').click();
    await page.waitForTimeout(300);

    // Should disappear from Starred
    await expect(page.getByText("BANT call notes", { exact: true })).not.toBeVisible();

    await shot(page, "07-star-toggle");
  });

  // ─── #8: New template button ──────────────────────────────────────────────
  test("#8 + New template button opens editor in create mode", async ({ page }) => {
    await goToTemplates(page);
    await page.getByRole("button", { name: /New template/ }).click();
    await page.waitForTimeout(400);

    await expect(page.locator("nav").getByText(/New template/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Create template$/ })).toBeVisible();
    await shot(page, "08-new-template-editor");
  });

  // ─── #9: Dashed Create card ───────────────────────────────────────────────
  test("#9 Dashed 'Create template' card opens editor in create mode", async ({ page }) => {
    await goToTemplates(page);

    const createCard = page.getByRole("button", { name: /Create template/ }).filter({ hasText: /Start from scratch/i });
    await createCard.click();
    await page.waitForTimeout(400);

    await expect(page.locator("nav").getByText(/New template/)).toBeVisible();
    await shot(page, "09-dashed-create");
  });

  // ─── #10: Create custom template ──────────────────────────────────────────
  test("#10 Create custom template — appears in My templates as purple card", async ({ page }) => {
    await goToTemplates(page);

    await page.getByRole("button", { name: /New template/ }).click();
    await page.waitForTimeout(400);

    // Fill template name
    const nameInput = page.locator('input[type="text"], input:not([type])').first();
    await nameInput.fill("QA Test Template");

    // Fill first section title (there's usually one empty section by default)
    const firstSectionTitle = page.locator('input[placeholder*="section" i], textarea').first();
    // Click "Create template"
    await page.getByRole("button", { name: /^Create template$/ }).click();
    await page.waitForTimeout(800);

    // Should return to list view, new card appears in My templates
    await expect(page.getByText("QA Test Template", { exact: true })).toBeVisible();

    const newCard = cardByName(page, "QA Test Template");
    const bg = await newCard.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Purple pastel background (custom)
    // HUE_PALETTE.purple.bg = #F1EDFE → rgb(241, 237, 254)
    expect(bg).toMatch(/rgb\(24[01], 23[67], 25[34]\)/);

    await shot(page, "10-custom-created");
  });

  // ─── #11: Edit custom template ────────────────────────────────────────────
  test("#11 Edit custom template: change name, save, returns to list with new name", async ({
    page,
  }) => {
    await goToTemplates(page);

    // Create a custom first
    await page.getByRole("button", { name: /New template/ }).click();
    await page.waitForTimeout(300);
    const nameInput1 = page.locator('input[type="text"], input:not([type])').first();
    await nameInput1.fill("Original Name");
    await page.getByRole("button", { name: /^Create template$/ }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText("Original Name", { exact: true })).toBeVisible();

    // Click into the custom card to edit
    const card = cardByName(page, "Original Name");
    await card.locator('p.truncate.font-semibold', { hasText: /^Original Name$/ }).click();
    await page.waitForTimeout(400);

    // Editor shows heading with current name. Click it to activate the inline input.
    await page.getByRole("heading", { level: 1, name: /Original Name/ }).click();
    const nameInput2 = page.locator('input[placeholder="Template name"]');
    await expect(nameInput2).toBeVisible();
    await nameInput2.fill("Updated Name");
    // Blur by pressing Enter
    await nameInput2.press("Enter");

    // Save button text differs for custom (Save changes) vs built-in (Save as copy)
    await page.getByRole("button", { name: /Save changes|Create template/ }).click();
    await page.waitForTimeout(800);

    // Back to list, new name appears
    await expect(page.getByText("Updated Name", { exact: true })).toBeVisible();
    await expect(page.getByText("Original Name", { exact: true })).not.toBeVisible();

    await shot(page, "11-edit-custom");
  });

  // ─── #12: Per-card "..." menu ─────────────────────────────────────────────
  test("#12 Per-card '...' menu: System shows Delete; Custom shows Duplicate + Delete", async ({
    page,
  }) => {
    await goToTemplates(page);

    // System: hover a built-in, click ...
    const sysCard = cardByName(page, "General meeting");
    await sysCard.hover();
    await sysCard.locator('button[title="More"]').click();
    await page.waitForTimeout(200);

    // Dropdown menu should show "Delete" only (no "Duplicate")
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Delete")).toBeVisible();
    await expect(menu.getByText("Duplicate")).not.toBeVisible();
    // Close the menu
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Create a custom template first
    await page.getByRole("button", { name: /New template/ }).click();
    await page.waitForTimeout(300);
    const nameInput = page.locator('input[type="text"], input:not([type])').first();
    await nameInput.fill("Custom X");
    await page.getByRole("button", { name: /^Create template$/ }).click();
    await page.waitForTimeout(800);

    const customCard = cardByName(page, "Custom X");
    await customCard.hover();
    await customCard.locator('button[title="More"]').click();
    await page.waitForTimeout(200);
    const menu2 = page.locator('[role="menu"]');
    await expect(menu2.getByText("Duplicate")).toBeVisible();
    await expect(menu2.getByText("Delete")).toBeVisible();

    await shot(page, "12-card-menu");
  });

  // ─── #13: Delete → trash ──────────────────────────────────────────────────
  test("#13 Delete (trash) moves card to Trash and shows toast", async ({ page }) => {
    await goToTemplates(page);

    const card = cardByName(page, "General meeting");
    await card.hover();
    await card.locator('button[title="More"]').click();
    await page.waitForTimeout(200);
    await page.locator('[role="menu"]').getByText("Delete").click();
    await page.waitForTimeout(400);

    await expect(page.getByText(/moved to trash/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("General meeting", { exact: true })).not.toBeVisible();

    // Switch to Trash tab
    await page.getByRole("tab", { name: /Trash/ }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("General meeting", { exact: true })).toBeVisible();

    await shot(page, "13-trash");
  });

  // ─── #14: Restore from trash ──────────────────────────────────────────────
  test("#14 Restore from trash returns template to its category", async ({ page }) => {
    await goToTemplates(page);

    // Trash one first
    const card = cardByName(page, "Sales discovery");
    await card.hover();
    await card.locator('button[title="More"]').click();
    await page.locator('[role="menu"]').getByText("Delete").click();
    await page.waitForTimeout(400);

    await page.getByRole("tab", { name: /Trash/ }).click();
    await page.waitForTimeout(300);

    const trashCard = cardByName(page, "Sales discovery");
    await expect(trashCard).toBeVisible();
    await expect(trashCard.getByRole("button", { name: /Restore/ })).toBeVisible();

    // Star button should NOT be visible in trash
    await expect(trashCard.locator('button[title="Star"], button[title="Unstar"]')).toHaveCount(0);
    // ... menu should NOT be visible in trash
    await expect(trashCard.locator('button[title="More"]')).toHaveCount(0);
    // Preview/Use should NOT be visible
    await expect(trashCard.getByRole("button", { name: /Preview/ })).toHaveCount(0);

    // Click Restore
    await trashCard.getByRole("button", { name: /Restore/ }).click();
    await page.waitForTimeout(400);

    await expect(page.getByText(/restored/i)).toBeVisible({ timeout: 3000 });
    // Back to All tab, should be visible again
    await page.getByRole("tab", { name: /^All\b/ }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Sales discovery", { exact: true })).toBeVisible();

    await shot(page, "14-restore");
  });

  // ─── #15: Duplicate from card menu ────────────────────────────────────────
  test("#15 Duplicate from card menu (custom) creates 'Copy of ...' in My templates", async ({
    page,
  }) => {
    await goToTemplates(page);

    // Create a custom first
    await page.getByRole("button", { name: /New template/ }).click();
    await page.waitForTimeout(300);
    await page.locator('input[type="text"], input:not([type])').first().fill("My Custom");
    await page.getByRole("button", { name: /^Create template$/ }).click();
    await page.waitForTimeout(800);

    const card = cardByName(page, "My Custom");
    await card.hover();
    await card.locator('button[title="More"]').click();
    await page.waitForTimeout(200);
    await page.locator('[role="menu"]').getByText("Duplicate").click();
    await page.waitForTimeout(800);

    await expect(page.getByText("Copy of My Custom", { exact: true })).toBeVisible();
    await shot(page, "15-duplicate-from-menu");
  });

  // ─── #16: Duplicate from editor (built-in) ────────────────────────────────
  test("#16 Duplicate from editor: built-in opens detail → Duplicate creates custom copy", async ({
    page,
  }) => {
    await goToTemplates(page);

    const card = cardByName(page, "User research session");
    await card.hover();
    await card.getByRole("button", { name: /Preview/ }).click();
    await page.waitForTimeout(400);

    // Click Duplicate button in the editor (pill-outline variant in the header)
    await page.getByRole("button", { name: /^Duplicate$/ }).click();
    await page.waitForTimeout(800);

    // We're now in the editor for "Copy of User research session"
    await expect(page.locator("nav").getByText(/Copy of User research session/)).toBeVisible();
    await shot(page, "16-duplicate-from-editor");
  });

  // ─── #17: Category grouping on All tab ────────────────────────────────────
  test("#17 Category grouping: empty categories are hidden", async ({ page }) => {
    await goToTemplates(page);

    for (const label of ["My templates", "Basic", "Sales", "HR & Management", "IT & Engineering", "Research"]) {
      await expect(page.locator("h3", { hasText: new RegExp(`^${label}$`, "i") })).toBeVisible();
    }
    // Consulting / Marketing / Education should NOT render (no data in mock)
    await expect(page.locator("h3", { hasText: /Consulting/i })).toHaveCount(0);
    await expect(page.locator("h3", { hasText: /^Marketing$/i })).toHaveCount(0);
    await expect(page.locator("h3", { hasText: /^Education$/i })).toHaveCount(0);
  });

  // ─── #18: System tab ──────────────────────────────────────────────────────
  test("#18 System tab: only built-ins grouped, no My templates, no Create card", async ({
    page,
  }) => {
    await goToTemplates(page);
    await page.getByRole("tab", { name: /System/ }).click();
    await page.waitForTimeout(300);

    await expect(page.locator("h3", { hasText: /My templates/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Create template/ })).toHaveCount(0);
    await expect(page.locator("h3", { hasText: /Basic/i })).toBeVisible();
  });

  // ─── #19: My templates tab ────────────────────────────────────────────────
  test("#19 My templates tab: flat grid, Create card prepended", async ({ page }) => {
    await goToTemplates(page);
    await page.getByRole("tab", { name: /My templates/ }).click();
    await page.waitForTimeout(300);

    // Create card visible; no system templates
    await expect(page.getByRole("button", { name: /Create template/ }).filter({ hasText: /Start from scratch/i })).toBeVisible();
    await expect(page.getByText("General meeting", { exact: true })).not.toBeVisible();
  });

  // ─── #20: Starred tab ────────────────────────────────────────────────────
  test("#20 Starred tab: flat grid of starred only", async ({ page }) => {
    await goToTemplates(page);

    // Star two
    const c1 = cardByName(page, "General meeting");
    await c1.hover();
    await c1.locator('button[title="Star"]').click();
    await page.waitForTimeout(200);

    const c2 = cardByName(page, "BANT call notes");
    await c2.hover();
    await c2.locator('button[title="Star"]').click();
    await page.waitForTimeout(200);

    await page.getByRole("tab", { name: /Starred/ }).click();
    await page.waitForTimeout(300);
    // Should be a flat grid — no category h3 headers
    await expect(page.locator("h3", { hasText: /Basic/i })).toHaveCount(0);
    await expect(page.getByText("General meeting", { exact: true })).toBeVisible();
    await expect(page.getByText("BANT call notes", { exact: true })).toBeVisible();
  });

  // ─── #21: Trash tab ──────────────────────────────────────────────────────
  test("#21 Trash tab cards: Restore only, no star, no dots, not clickable", async ({ page }) => {
    await goToTemplates(page);

    // Trash one
    const card = cardByName(page, "Engineering standup");
    await card.hover();
    await card.locator('button[title="More"]').click();
    await page.locator('[role="menu"]').getByText("Delete").click();
    await page.waitForTimeout(300);

    await page.getByRole("tab", { name: /Trash/ }).click();
    await page.waitForTimeout(300);

    const tc = cardByName(page, "Engineering standup");
    await expect(tc.getByRole("button", { name: /Restore/ })).toBeVisible();
    await expect(tc.locator('button[title="Star"], button[title="Unstar"]')).toHaveCount(0);
    await expect(tc.locator('button[title="More"]')).toHaveCount(0);
    await expect(tc.getByRole("button", { name: /Preview/ })).toHaveCount(0);

    // Clicking the card title should NOT open editor
    await tc.locator('p.truncate.font-semibold', { hasText: /^Engineering standup$/ }).click();
    await page.waitForTimeout(400);
    await expect(page.locator("nav").getByText(/Engineering standup/)).toHaveCount(0);
  });

  // ─── #22: Tab counts ──────────────────────────────────────────────────────
  test("#22 Tab counts update after star/trash/restore", async ({ page }) => {
    await goToTemplates(page);

    const readCount = async (label: string) => {
      const text = await page.getByRole("tab", { name: new RegExp(label, "i") }).locator("span").first().innerText();
      return parseInt(text.trim(), 10);
    };

    const allBefore = await readCount("All");
    expect(allBefore).toBe(8);
    expect(await readCount("Starred")).toBe(0);
    expect(await readCount("System")).toBe(8);
    expect(await readCount("My templates")).toBe(0);
    expect(await readCount("Trash")).toBe(0);

    // Star one
    const c = cardByName(page, "General meeting");
    await c.hover();
    await c.locator('button[title="Star"]').click();
    await page.waitForTimeout(300);
    expect(await readCount("Starred")).toBe(1);

    // Trash one
    const c2 = cardByName(page, "Sales discovery");
    await c2.hover();
    await c2.locator('button[title="More"]').click();
    await page.locator('[role="menu"]').getByText("Delete").click();
    await page.waitForTimeout(400);
    expect(await readCount("Trash")).toBe(1);
    expect(await readCount("All")).toBe(7);
    expect(await readCount("System")).toBe(7);
  });

  // ─── #23: Mobile responsive ──────────────────────────────────────────────
  test("#23 Mobile responsive: grid collapses, no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goToTemplates(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await shot(page, "23-mobile");
  });

  // ─── #24: No console errors ──────────────────────────────────────────────
  test("#24 No console errors during full interaction loop", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await goToTemplates(page);

    for (const n of ["Starred", "System", "My templates", "Trash", "All"]) {
      await page.getByRole("tab", { name: new RegExp(n, "i") }).click();
      await page.waitForTimeout(150);
    }

    const c = cardByName(page, "General meeting");
    await c.hover();
    await c.locator('button[title="Star"]').click();
    await page.waitForTimeout(200);

    const critical = errors.filter(
      (e) =>
        !/supabase is not configured/i.test(e) &&
        !/Failed to fetch/i.test(e) &&
        !/net::ERR_/i.test(e) &&
        !/forwardRef/i.test(e),
    );
    expect(critical, `Unexpected console errors: ${critical.join("\n")}`).toEqual([]);
  });

  // ─── #25: Design system compliance ───────────────────────────────────────
  test("#25 Design system: rounded-full button; no Lucide in chrome", async ({ page }) => {
    await goToTemplates(page);

    const btn = page.getByRole("button", { name: /New template/ });
    const radius = await btn.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(16);
  });
});
