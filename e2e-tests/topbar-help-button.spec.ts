/**
 * E2E Tests: TopBar Help Button (mailto support tooltip)
 * Verifies the help icon in the top-right corner correctly:
 *  - shows tooltip with support email on hover
 *  - is rendered as <a href="mailto:..."> via Button asChild
 *  - has correct aria-label and is keyboard focusable
 *  - keeps the same visual size (32x32 button, 16px icon)
 *  - does not break sibling top-bar features (search, profile, trial CTA)
 *  - produces no console errors
 */

import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SUPPORT_EMAIL = "support@transcribetotext.ai";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "topbar-help");

async function shot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  const email = page.locator("#email");
  await email.click();
  await email.pressSequentially("admin@test.com", { delay: 15 });
  const pw = page.locator("#password");
  await pw.click();
  await pw.pressSequentially("admin123", { delay: 15 });
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

function helpButton(page: Page) {
  return page.locator(`a[href="mailto:${SUPPORT_EMAIL}"]`);
}

// Collect console errors / warnings
function collectConsole(page: Page): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
    if (msg.type() === "warning") warnings.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return { errors, warnings };
}

test.describe("TopBar Help Button (mailto support)", () => {
  test("scenarios 1-7: tooltip, mailto, a11y, visual, console, sibling features", async ({ page }) => {
    const consoleLog = collectConsole(page);

    await loginAsDemo(page);
    await shot(page, "01-loaded");

    const help = helpButton(page);
    await expect(help).toBeVisible();

    // ── Scenario 3: Click triggers mailto — verify the rendered DOM is <a mailto:...> ──
    const tag = await help.evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe("a");
    await expect(help).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);

    // ── Scenario 4: a11y — aria-label contains the support email ──
    const ariaLabel = await help.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain(SUPPORT_EMAIL);

    // ── Scenario 5: Visual — 32px circle button, 16px icon ──
    const box = await help.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.width)).toBe(32);
    expect(Math.round(box!.height)).toBe(32);
    // border-radius should produce a circle (>= 50% of width)
    const radius = await help.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius).toBeGreaterThanOrEqual(16);
    // icon is an SVG inside the anchor with size-[16px]
    const svg = help.locator("svg");
    await expect(svg).toBeVisible();
    const svgBox = await svg.boundingBox();
    expect(svgBox).not.toBeNull();
    expect(Math.round(svgBox!.width)).toBe(16);
    expect(Math.round(svgBox!.height)).toBe(16);
    // icon color === --muted-foreground
    const iconColor = await svg.evaluate((el) => getComputedStyle(el).color);
    const mutedRoot = await page.evaluate(() => {
      const tmp = document.createElement("span");
      tmp.style.color = "var(--muted-foreground)";
      document.body.appendChild(tmp);
      const c = getComputedStyle(tmp).color;
      tmp.remove();
      return c;
    });
    expect(iconColor).toBe(mutedRoot);

    // ── Scenario 1 & 2: Tooltip appears on hover with exact text ──
    await help.hover();
    // Radix tooltip is portaled and has role="tooltip"
    const tooltip = page.getByRole("tooltip", { name: SUPPORT_EMAIL });
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    const tooltipText = (await tooltip.textContent())?.trim();
    expect(tooltipText).toBe(SUPPORT_EMAIL);
    await shot(page, "02-tooltip-visible");

    // ── Scenario 4 (cont): keyboard focusable + focus-visible ring ──
    await page.mouse.move(0, 0); // unhover
    await help.evaluate((el) => (el as HTMLElement).blur());
    // Tab from the body until we land on the help link (or stop after a sane number of tries)
    let focused = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const isFocused = await help.evaluate((el) => el === document.activeElement);
      if (isFocused) { focused = true; break; }
    }
    expect(focused).toBe(true);
    // Force focus-visible state and check ring style is applied
    const ringWidth = await help.evaluate((el) => {
      el.classList.add("focus-visible");
      return getComputedStyle(el).boxShadow;
    });
    // Tailwind focus-visible:ring shows a non-empty box-shadow
    expect(ringWidth === "none" || ringWidth.length === 0).toBe(false);
    await shot(page, "03-help-focused");

    // ── Scenario 7: Sibling features still work ──
    // Quick Find button opens search modal
    await page.locator("button", { hasText: "Quick Find" }).click();
    // Search modal should mount (look for search input or modal container)
    const modalCloseDetected = await page.waitForFunction(
      () => {
        // Scan for any visible element that looks like the search modal: a fixed overlay or input
        const inputs = Array.from(document.querySelectorAll("input"));
        return inputs.some((i) => {
          const style = getComputedStyle(i);
          return (
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            i.offsetParent !== null &&
            (i.placeholder?.toLowerCase().includes("search") ||
              i.placeholder?.toLowerCase().includes("find"))
          );
        });
      },
      undefined,
      { timeout: 5000 },
    ).catch(() => null);
    expect(modalCloseDetected).not.toBeNull();
    await shot(page, "04-search-modal-open");
    // Close the modal with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Profile dropdown opens
    const profileBtn = page.locator("button", { hasText: "Free Plan" });
    await profileBtn.click();
    await expect(page.getByText("Settings", { exact: false }).first()).toBeVisible({ timeout: 3000 });
    await shot(page, "05-profile-dropdown-open");
    await page.keyboard.press("Escape");
    await page.mouse.click(10, 10);

    // Trial CTA visible and clickable — scope to the top bar (h-[56px] gradient bar)
    // There are two "Start my trial now" buttons in the app (top bar + right panel).
    // We just need to verify the top-bar one (sibling of the help button) is intact.
    const trial = page
      .locator("div.h-\\[56px\\]")
      .getByRole("button", { name: "Start my trial now" })
      .first();
    await expect(trial).toBeVisible();
    await expect(trial).toBeEnabled();

    // ── Scenario 6: No console errors / warnings (filter benign noise) ──
    const benign = (s: string) =>
      s.includes("supabase") ||
      s.includes("Failed to fetch") ||
      s.includes("net::ERR_") ||
      s.includes("forwardRef") ||
      s.includes("Function components cannot be given refs") ||
      s.includes("[vite]") ||
      s.includes("Download the React DevTools");
    const criticalErrors = consoleLog.errors.filter((e) => !benign(e));
    const criticalWarnings = consoleLog.warnings.filter((w) => !benign(w));
    if (criticalErrors.length || criticalWarnings.length) {
      console.log("Console errors:", criticalErrors);
      console.log("Console warnings:", criticalWarnings);
    }
    expect(criticalErrors).toEqual([]);
  });
});
