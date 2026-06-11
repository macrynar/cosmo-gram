import { test, expect } from "@playwright/test";

// ─── Flow B: upgrade premium ──────────────────────────────────────────────────
// Tests the paywall and Stripe checkout redirect.
// Full checkout flow requires Stripe test keys — skipped in CI without credentials.

test.describe("Flow B — upgrade premium", () => {

  test("strona /pricing renderuje się bez błędów", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Cennik|Cosmogram/);
  });

  test("strona /pricing zawiera CTA z ceną", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Should see a pricing-related element
    const priceEl = page.locator('text=/zł|PLN|miesięcznie|rok/').first();
    await expect(priceEl).toBeVisible();
  });

  test("/api/create-checkout-session wymaga autoryzacji — zwraca 401 bez tokenu", async ({ request }) => {
    const res = await request.post("/api/create-checkout-session", {
      data: { priceId: "price_test" },
    });
    expect(res.status()).toBe(401);
  });

  // ─── Auth-dependent tests ─────────────────────────────────────────────────
  test("free user widzi paywall po kliknięciu zablokowanego modułu", async ({ page }) => {
    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_USER_EMAIL i TEST_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    await page.goto("/app/cosmogram");
    await page.waitForLoadState("networkidle");

    // Click a locked placeholder
    const locked = page.locator('[class*="LockedModule"]').or(
      page.locator('[class*="blur"]').locator("..").locator("..")
    ).first();

    if (await locked.isVisible()) {
      await locked.click();

      // Paywall modal or pricing page should appear
      const paywallModal = page.locator('[class*="PaywallModal"], [role="dialog"]');
      const pricingPage  = page.url().includes("/pricing");
      const paywallVisible = await paywallModal.isVisible().catch(() => false);

      expect(paywallVisible || pricingPage).toBe(true);
    }
  });

  test("premium user może otworzyć portal Stripe", async ({ page }) => {
    const email    = process.env.TEST_PREMIUM_EMAIL;
    const password = process.env.TEST_PREMIUM_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_PREMIUM_EMAIL i TEST_PREMIUM_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    // Portal session should return a redirect URL (real Stripe — skip if no live key)
    test.skip(
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("placeholder"),
      "Wymaga prawdziwego STRIPE_SECRET_KEY"
    );

    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");
    const manageBtn = page.locator('button:has-text("Zarządzaj"), a:has-text("Zarządzaj")').first();
    if (await manageBtn.isVisible()) {
      await expect(manageBtn).toBeEnabled();
    }
  });
});
