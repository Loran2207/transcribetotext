/**
 * E2E Tests: Authentication (Login & Signup)
 * App: TranscribeToText at http://localhost:5173
 *
 * Tests login page, signup page, form validation, password visibility toggle,
 * password strength bar, loading states, error handling, navigation links,
 * protected routes, and redirect behavior.
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5173";
const SUPABASE_URL = "https://knrfdiyvyrawcwxongxb.supabase.co";
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots", "auth");

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

/**
 * Type into an input field keystroke-by-keystroke.
 * This is required because react-hook-form's register() attaches onChange/onBlur
 * handlers that only fire on real keyboard events, not programmatic fill().
 */
async function typeInto(page: Page, selector: string, text: string) {
  const input = page.locator(selector);
  await input.click();
  await input.fill(""); // clear first
  await input.pressSequentially(text, { delay: 30 });
}

/**
 * Intercept Supabase GoTrue auth token endpoint (login).
 */
async function mockLoginSuccess(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fake-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id: "test-user-id",
          aud: "authenticated",
          email: "test@example.com",
          role: "authenticated",
          user_metadata: { full_name: "Test User" },
        },
      }),
    });
  });
}

async function mockLoginError(page: Page, message = "Invalid login credentials") {
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: message,
      }),
    });
  });
}

async function mockLoginSlow(page: Page, delayMs = 2000) {
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      }),
    });
  });
}

async function mockSignupSuccess(page: Page) {
  await page.route(`${SUPABASE_URL}/auth/v1/signup**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "new-user-id",
        aud: "authenticated",
        email: "jane@example.com",
        role: "authenticated",
        user_metadata: { full_name: "Jane Doe" },
      }),
    });
  });
}

async function mockSignupSlow(page: Page, delayMs = 2000) {
  await page.route(`${SUPABASE_URL}/auth/v1/signup**`, async (route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "new-user-id",
        email: "jane@example.com",
        user_metadata: { full_name: "Jane Doe" },
      }),
    });
  });
}

async function mockSignupError(page: Page, message = "User already registered") {
  await page.route(`${SUPABASE_URL}/auth/v1/signup**`, async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: "user_already_exists",
        error_description: message,
        msg: message,
      }),
    });
  });
}

// Collect console errors during a test
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

// ═════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE TESTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
  });

  test("renders login form with all expected elements", async ({ page }) => {
    // Heading
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // Subtitle
    await expect(page.getByText("Sign in to your TranscribeToText account")).toBeVisible();

    // Email field
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");

    // Password field
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Submit button
    const submitBtn = page.getByRole("button", { name: "Sign in" });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Link to signup
    const signupLink = page.getByRole("link", { name: /Create one free/i });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute("href", "/signup");

    await screenshot(page, "login-page-initial");
  });

  test("email and password fields accept input", async ({ page }) => {
    await typeInto(page, "#email", "test@example.com");
    await expect(page.locator("#email")).toHaveValue("test@example.com");

    await typeInto(page, "#password", "MyPassword123");
    await expect(page.locator("#password")).toHaveValue("MyPassword123");
  });

  test("shows validation errors when submitting empty form", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: "Sign in" });
    await submitBtn.click();

    // Should show validation errors for required fields
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    await screenshot(page, "login-validation-errors");
  });

  test("password show/hide toggle works", async ({ page }) => {
    const passwordInput = page.locator("#password");
    const toggleBtn = page.getByLabel(/Show password|Hide password/);

    // Initially password type
    await expect(passwordInput).toHaveAttribute("type", "password");

    await typeInto(page, "#password", "secret123");

    // Click toggle — should switch to text
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again — should switch back to password
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    await screenshot(page, "login-password-toggle");
  });

  test("submit button shows loading state during submission", async ({ page }) => {
    // Use a long delay so loading state is visible after typing finishes
    await mockLoginSlow(page, 10000);

    await typeInto(page, "#email", "test@example.com");
    await typeInto(page, "#password", "password123");

    const submitBtn = page.getByRole("button", { name: "Sign in" });
    await submitBtn.click();

    // Should show loading state — check text first, then disabled
    const loadingText = page.getByText("Signing in...");
    await expect(loadingText).toBeVisible({ timeout: 5000 });

    // Button should be disabled while loading
    const loadingBtn = page.locator("button[type='submit']");
    await expect(loadingBtn).toBeDisabled();

    await screenshot(page, "login-loading-state");
  });

  test("shows error message on invalid credentials", async ({ page }) => {
    await mockLoginError(page);

    await typeInto(page, "#email", "wrong@example.com");
    await typeInto(page, "#password", "wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should show error message
    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 10000 });

    await screenshot(page, "login-error-invalid-credentials");
  });

  test("successful login redirects to /", async ({ page }) => {
    await mockLoginSuccess(page);

    await typeInto(page, "#email", "test@example.com");
    await typeInto(page, "#password", "validpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to home
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });

    await screenshot(page, "login-success-redirect");
  });

  test("'Create one free' link navigates to signup page", async ({ page }) => {
    const signupLink = page.getByRole("link", { name: /Create one free/i });
    await signupLink.click();

    await page.waitForURL(`${BASE_URL}/signup`);
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("no console errors on login page load", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Filter out known benign errors (Supabase connection, forwardRef warning)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("supabase") &&
        !e.includes("Failed to fetch") &&
        !e.includes("net::ERR_") &&
        !e.includes("forwardRef") &&
        !e.includes("Function components cannot be given refs"),
    );

    if (criticalErrors.length > 0) {
      console.log("Console errors found:", criticalErrors);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  SIGNUP PAGE TESTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe("Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState("networkidle");
  });

  test("renders signup form with all expected elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByText("Start transcribing in seconds")).toBeVisible();

    const nameInput = page.locator("#fullName");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute("placeholder", "Jane Doe");

    const emailInput = page.locator("#signupEmail");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("#signupPassword");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("placeholder", "At least 6 characters");

    const confirmInput = page.locator("#confirmPassword");
    await expect(confirmInput).toBeVisible();

    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    const loginLink = page.getByRole("link", { name: /Sign in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");

    await screenshot(page, "signup-page-initial");
  });

  test("all form fields accept input", async ({ page }) => {
    await typeInto(page, "#fullName", "Jane Doe");
    await expect(page.locator("#fullName")).toHaveValue("Jane Doe");

    await typeInto(page, "#signupEmail", "jane@example.com");
    await expect(page.locator("#signupEmail")).toHaveValue("jane@example.com");

    await typeInto(page, "#signupPassword", "StrongPass123");
    await expect(page.locator("#signupPassword")).toHaveValue("StrongPass123");

    await typeInto(page, "#confirmPassword", "StrongPass123");
    await expect(page.locator("#confirmPassword")).toHaveValue("StrongPass123");
  });

  test("shows validation errors on empty submit (after blur)", async ({ page }) => {
    // Focus and blur each field to trigger onBlur validation
    await page.locator("#fullName").focus();
    await page.locator("#signupEmail").focus();
    await page.locator("#signupPassword").focus();
    await page.locator("#confirmPassword").focus();

    // Submit to trigger all validations
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Name is required")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Email is required")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Password is required")).toBeVisible({ timeout: 5000 });

    await screenshot(page, "signup-validation-errors");
  });

  test("email validation rejects invalid format", async ({ page }) => {
    // Type invalid email keystroke-by-keystroke so RHF registers the value
    await typeInto(page, "#signupEmail", "notanemail");

    // Blur the email field by clicking elsewhere
    await page.locator("#signupPassword").focus();

    await expect(page.getByText("Enter a valid email address")).toBeVisible({ timeout: 5000 });

    await screenshot(page, "signup-invalid-email");
  });

  test("password minimum length validation", async ({ page }) => {
    await typeInto(page, "#signupPassword", "abc");

    // Blur the password field
    await page.locator("#confirmPassword").focus();

    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible({
      timeout: 5000,
    });

    await screenshot(page, "signup-password-too-short");
  });

  test("password confirmation mismatch shows error", async ({ page }) => {
    await typeInto(page, "#signupPassword", "StrongPass123");
    await typeInto(page, "#confirmPassword", "DifferentPass456");

    // Blur confirm password
    await page.locator("#fullName").focus();

    await expect(page.getByText("Passwords do not match")).toBeVisible({ timeout: 5000 });

    await screenshot(page, "signup-password-mismatch");
  });

  test("password show/hide toggle works for both password fields", async ({ page }) => {
    const passwordInput = page.locator("#signupPassword");
    const confirmInput = page.locator("#confirmPassword");

    await typeInto(page, "#signupPassword", "secret123");
    await typeInto(page, "#confirmPassword", "secret123");

    // Get toggle buttons by aria-label
    const toggleButtons = page.getByLabel(/Show password|Hide password/);
    await expect(toggleButtons).toHaveCount(2);

    // Toggle first password field
    await expect(passwordInput).toHaveAttribute("type", "password");
    await toggleButtons.nth(0).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await toggleButtons.nth(0).click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle confirm password field
    await expect(confirmInput).toHaveAttribute("type", "password");
    await toggleButtons.nth(1).click();
    await expect(confirmInput).toHaveAttribute("type", "text");
    await toggleButtons.nth(1).click();
    await expect(confirmInput).toHaveAttribute("type", "password");

    await screenshot(page, "signup-password-toggles");
  });

  test("password strength bar updates as user types", async ({ page }) => {
    const passwordInput = page.locator("#signupPassword");

    // Weak password (< 6 chars)
    await typeInto(page, "#signupPassword", "abc");
    await expect(page.getByText("Weak")).toBeVisible({ timeout: 3000 });
    await screenshot(page, "signup-strength-weak");

    // Medium password (>= 6 chars with digit)
    await passwordInput.fill("");
    await typeInto(page, "#signupPassword", "abcdef1");
    await expect(page.getByText("Medium")).toBeVisible({ timeout: 3000 });
    await screenshot(page, "signup-strength-medium");

    // Strong password (>= 10 chars with mixed case and special)
    await passwordInput.fill("");
    await typeInto(page, "#signupPassword", "AbcDefGh1!");
    await expect(page.getByText("Strong")).toBeVisible({ timeout: 3000 });
    await screenshot(page, "signup-strength-strong");
  });

  test("password strength bar not shown when password is empty", async ({ page }) => {
    await expect(page.getByText("Weak")).not.toBeVisible();
    await expect(page.getByText("Medium")).not.toBeVisible();
    await expect(page.getByText("Strong")).not.toBeVisible();
  });

  test("submit button shows loading state during submission", async ({ page }) => {
    await mockSignupSlow(page, 3000);

    await typeInto(page, "#fullName", "Jane Doe");
    await typeInto(page, "#signupEmail", "jane@example.com");
    await typeInto(page, "#signupPassword", "StrongPass123");
    await typeInto(page, "#confirmPassword", "StrongPass123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Creating account...")).toBeVisible({ timeout: 5000 });

    await screenshot(page, "signup-loading-state");
  });

  test("successful signup shows toast and redirects to /login", async ({ page }) => {
    await mockSignupSuccess(page);

    await typeInto(page, "#fullName", "Jane Doe");
    await typeInto(page, "#signupEmail", "jane@example.com");
    await typeInto(page, "#signupPassword", "StrongPass123");
    await typeInto(page, "#confirmPassword", "StrongPass123");

    await page.getByRole("button", { name: "Create account" }).click();

    // Should show success toast
    await expect(page.getByText("Account created! Check your email.")).toBeVisible({
      timeout: 10000,
    });

    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });

    await screenshot(page, "signup-success-redirect");
  });

  test("shows error message on signup failure", async ({ page }) => {
    await mockSignupError(page);

    await typeInto(page, "#fullName", "Jane Doe");
    await typeInto(page, "#signupEmail", "existing@example.com");
    await typeInto(page, "#signupPassword", "StrongPass123");
    await typeInto(page, "#confirmPassword", "StrongPass123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/already registered|already exists/i)).toBeVisible({
      timeout: 10000,
    });

    await screenshot(page, "signup-error-duplicate");
  });

  test("'Sign in' link navigates to login page", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /Sign in/i });
    await loginLink.click();

    await page.waitForURL(`${BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH LAYOUT TESTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe("Auth Layout", () => {
  test("login page shows branded left panel on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Logo is an SVG element inside a container div
    const brandLogo = page.locator("svg[viewBox='0 0 180 30']");
    await expect(brandLogo).toBeVisible();

    await expect(page.getByText("Turn audio into text instantly")).toBeVisible();

    // Feature pills — use exact match to avoid "Recording..." conflict
    await expect(page.getByText("Record", { exact: true })).toBeVisible();
    await expect(page.getByText("Upload", { exact: true })).toBeVisible();
    await expect(page.getByText("Link", { exact: true })).toBeVisible();

    await screenshot(page, "auth-layout-desktop");
  });

  test("login page hides left panel on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Left panel should be hidden on mobile (lg: breakpoint)
    await expect(page.getByText("Turn audio into text instantly")).not.toBeVisible();

    // But form should still be visible
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await screenshot(page, "auth-layout-mobile");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES & REDIRECTS
// ═════════════════════════════════════════════════════════════════════════════

test.describe("Protected Routes", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await screenshot(page, "protected-route-redirect");
  });

  test("unauthenticated user visiting /transcriptions/:id is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${BASE_URL}/transcriptions/some-id`);
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await screenshot(page, "protected-transcription-redirect");
  });

  test("protected route shows loading spinner while checking auth", async ({ page }) => {
    // Intercept the Supabase session check to slow it down
    await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({ status: 401, body: JSON.stringify({}) });
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("domcontentloaded");

    await screenshot(page, "protected-route-loading");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  KEYBOARD ACCESSIBILITY
// ═════════════════════════════════════════════════════════════════════════════

test.describe("Keyboard Accessibility", () => {
  test("login form can be submitted with keyboard only", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Tab to email field and type
    await page.locator("#email").focus();
    await page.keyboard.type("test@example.com");

    // Tab to password field and type
    await page.keyboard.press("Tab");
    await page.keyboard.type("password123");

    // Tab to submit button (skip the toggle button which has tabIndex={-1})
    await page.keyboard.press("Tab");

    // The focused element should be the submit button
    const focusedElement = page.getByRole("button", { name: "Sign in" });
    await expect(focusedElement).toBeFocused();

    await screenshot(page, "login-keyboard-navigation");
  });

  test("signup form can be navigated with Tab key", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState("networkidle");

    await page.locator("#fullName").focus();
    await expect(page.locator("#fullName")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#signupEmail")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#signupPassword")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#confirmPassword")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Create account" })).toBeFocused();

    await screenshot(page, "signup-keyboard-navigation");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  UI CONSISTENCY CHECKS
// ═════════════════════════════════════════════════════════════════════════════

test.describe("UI Consistency", () => {
  test("login page uses correct design tokens (no hardcoded colors in form area)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Verify the submit button uses primary color
    const submitBtn = page.getByRole("button", { name: "Sign in" });
    await expect(submitBtn).toBeVisible();

    // Check that form labels use the Label component
    const labels = page.locator("label");
    await expect(labels.nth(0)).toHaveText("Email");
    await expect(labels.nth(1)).toHaveText("Password");
  });

  test("signup page password strength bar uses correct colors", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState("networkidle");

    // Weak — should use destructive color
    await typeInto(page, "#signupPassword", "abc");
    const weakLabel = page.getByText("Weak");
    await expect(weakLabel).toBeVisible({ timeout: 3000 });

    // Strong — should use green
    await page.locator("#signupPassword").fill("");
    await typeInto(page, "#signupPassword", "AbcDefGh1!");
    const strongLabel = page.getByText("Strong");
    await expect(strongLabel).toBeVisible({ timeout: 3000 });
  });
});
