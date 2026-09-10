import { expect, test, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const SUPABASE_URL = "https://knrfdiyvyrawcwxongxb.supabase.co";

async function loginWithQueue(page: Page, state: "mixed" | "failed") {
  await page.addInitScript((queueState) => {
    window.localStorage.setItem("ttt_demo_jobs", queueState);
  }, state);
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
  await page.waitForURL(`${BASE_URL}/`);
}

test("queue reference uses a real Lottie without an aggregate percentage", async ({ page }, testInfo) => {
  await page.goto(`${BASE_URL}/queue-states.html`, { waitUntil: "networkidle" });
  await expect(page.locator(".lottie-glyph svg")).toHaveCount(3);
  await expect.poll(() => page.evaluate(() => window.__lotties?.length ?? 0)).toBe(3);
  await expect(page.locator("body")).not.toContainText(/\d+%/);
  await page.screenshot({ path: testInfo.outputPath("queue-reference.png"), fullPage: true });
});

test("mixed queue keeps honest counters and the Lottie working state", async ({ page }, testInfo) => {
  await loginWithQueue(page, "mixed");
  const lottie = page.locator("[data-queue-lottie]");
  await expect(lottie.locator("svg")).toBeVisible();
  const button = lottie.locator("..");
  await expect(button).toHaveAttribute("aria-label", /files failed/);
  await expect(button).not.toHaveAttribute("aria-label", /%/);
  await expect(button.getByText("5", { exact: true })).toBeVisible();
  await expect(button.getByText("3", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("queue-mixed.png") });
});

test("failed-only queue stops the working animation and turns the ring red", async ({ page }, testInfo) => {
  await loginWithQueue(page, "failed");
  await expect(page.locator("[data-queue-lottie]")).toHaveCount(0);
  const button = page.getByRole("button", { name: "3 files failed" });
  await expect(button).toBeVisible();
  await expect(button.locator("circle").first()).toHaveClass(/text-destructive/);
  await page.screenshot({ path: testInfo.outputPath("queue-failed.png") });
});

test("reduced motion freezes the queue Lottie", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${BASE_URL}/queue-states.html`, { waitUntil: "networkidle" });
  const lottie = page.locator(".lottie-glyph").first();
  await expect(lottie.locator("svg")).toBeVisible();
  const before = await lottie.innerHTML();
  await page.waitForTimeout(500);
  expect(await lottie.innerHTML()).toBe(before);
  await expect(page.locator(".halo").first()).toHaveCSS("animation-name", "none");
});

declare global {
  interface Window {
    __lotties?: unknown[];
  }
}
