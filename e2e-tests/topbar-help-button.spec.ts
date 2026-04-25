/**
 * E2E Tests: TopBar Support Email Link
 * Verifies the support email link in the top-right corner correctly:
 *  - shows the email text inline (visible by default, no hover required)
 *  - has a primary-colored help icon badge to the left of the email text
 *  - is rendered as <a href="mailto:..."> via Button asChild
 *  - has correct aria-label and is keyboard focusable
 *  - is shaped as a pill (rounded-full)
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

function supportLink(page: Page) {
  return page.locator(`a[href="mailto:${SUPPORT_EMAIL}"]`);
}

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

test.describe("TopBar Support Email Link", () => {
  test("inline email + icon badge, mailto, a11y, sibling features", async ({ page }) => {
    const consoleLog = collectConsole(page);

    await loginAsDemo(page);
    await shot(page, "01-loaded");

    const link = supportLink(page);
    await expect(link).toBeVisible();

    // ── Scenario 1: Email text is visible by default (no hover) ──
    await expect(link).toContainText(SUPPORT_EMAIL);
    const linkText = (await link.textContent())?.trim();
    expect(linkText).toBe(SUPPORT_EMAIL);

    // ── Scenario 2: Anchor renders as <a mailto:...> ──
    const tag = await link.evaluate((el) => el.tagName.toLowerCase());
    expect(tag).toBe("a");
    await expect(link).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);

    // ── Scenario 3: a11y — aria-label contains the support email ──
    const ariaLabel = await link.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain(SUPPORT_EMAIL);

    // ── Scenario 4: Visual — pill shape (rounded-full) ──
    const radius = await link.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    // rounded-full means radius >= half the height
    expect(radius).toBeGreaterThanOrEqual(box!.height / 2 - 1);

    // ── Scenario 5: Icon badge — 20x20 circle, primary/10 bg, 12px primary SVG icon inside ──
    const badge = link.locator("span").first();
    const badgeBox = await badge.boundingBox();
    expect(badgeBox).not.toBeNull();
    expect(Math.round(badgeBox!.width)).toBe(20);
    expect(Math.round(badgeBox!.height)).toBe(20);
    const badgeRadius = await badge.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(badgeRadius).toBeGreaterThanOrEqual(10); // half of 20 = circle
    const svg = badge.locator("svg");
    await expect(svg).toBeVisible();
    const svgBox = await svg.boundingBox();
    expect(svgBox).not.toBeNull();
    expect(Math.round(svgBox!.width)).toBe(12);
    expect(Math.round(svgBox!.height)).toBe(12);
    // SVG color === --primary
    const iconColor = await svg.evaluate((el) => getComputedStyle(el).color);
    const primaryColor = await page.evaluate(() => {
      const tmp = document.createElement("span");
      tmp.style.color = "var(--primary)";
      document.body.appendChild(tmp);
      const c = getComputedStyle(tmp).color;
      tmp.remove();
      return c;
    });
    expect(iconColor).toBe(primaryColor);
    await shot(page, "02-inline-email-visible");

    // ── Scenario 6: Keyboard focusable + focus-visible ring ──
    await page.mouse.move(0, 0);
    await link.evaluate((el) => (el as HTMLElement).blur());
    let focused = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const isFocused = await link.evaluate((el) => el === document.activeElement);
      if (isFocused) { focused = true; break; }
    }
    expect(focused).toBe(true);
    const boxShadow = await link.evaluate((el) => {
      el.classList.add("focus-visible");
      return getComputedStyle(el).boxShadow;
    });
    expect(boxShadow === "none" || boxShadow.length === 0).toBe(false);
    await shot(page, "03-link-focused");

    // ── Scenario 7: Sibling features still work ──
    // Quick Find opens search modal
    await page.locator("button", { hasText: "Quick Find" }).click();
    const searchInputAppeared = await page.waitForFunction(
      () => {
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
    expect(searchInputAppeared).not.toBeNull();
    await shot(page, "04-search-modal-open");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Profile dropdown opens
    const profileBtn = page.locator("button", { hasText: "Free Plan" });
    await profileBtn.click();
    await expect(page.getByText("Settings", { exact: false }).first()).toBeVisible({ timeout: 3000 });
    await shot(page, "05-profile-dropdown-open");
    await page.keyboard.press("Escape");
    await page.mouse.click(10, 10);

    // Trial CTA in top bar still visible/enabled
    const trial = page
      .locator("div.h-\\[56px\\]")
      .getByRole("button", { name: "Start my trial now" })
      .first();
    await expect(trial).toBeVisible();
    await expect(trial).toBeEnabled();

    // ── Scenario 8: No console errors ──
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
