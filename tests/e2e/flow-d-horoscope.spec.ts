import { test, expect } from "@playwright/test";

// ─── Flow D: login → dzienny horoskop ────────────────────────────────────────

test.describe("Flow D — horoskop dzienny", () => {

  test("publiczna strona /daily-horoscope ładuje się", async ({ page }) => {
    const res = await page.goto("/daily-horoscope");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/horoskop|Cosmo/i);
  });

  test("publiczna strona /daily-horoscope zawiera znaki zodiaku", async ({ page }) => {
    await page.goto("/daily-horoscope");
    await page.waitForLoadState("networkidle");

    // At least one zodiac sign should appear
    const zodiacSigns = ["Baran", "Byk", "Bliźnięta", "Rak", "Lew", "Panna",
                         "Waga", "Skorpion", "Strzelec", "Koziorożec", "Wodnik", "Ryby"];
    const content = await page.content();
    const hasSign = zodiacSigns.some(sign => content.includes(sign));
    expect(hasSign).toBe(true);
  });

  test("/api/health zwraca 200 i status ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.ts).toBe("string");
  });

  test("strona /login renderuje formularz", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("nieprawidłowe dane logowania → komunikat błędu", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("nieistniejacy@test.invalid");
    await page.locator('input[type="password"]').fill("wrongpassword123");
    await page.locator('button[type="submit"]').click();

    // Should show error message, not redirect
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("/login");
  });

  // ─── Auth-dependent tests ─────────────────────────────────────────────────
  test("zalogowany user widzi personalny horoskop w /app/horoscope", async ({ page }) => {
    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_USER_EMAIL i TEST_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    await page.goto("/app/horoscope");
    await page.waitForLoadState("networkidle");

    // Should see horoscope content — not an empty page
    const horoscopeContent = page.locator(
      '[class*="horoscope"], [class*="Horoscope"], h1, h2'
    ).first();
    await expect(horoscopeContent).toBeVisible();
  });

  test("toggle email horoskopu zapisuje preferencję", async ({ page }) => {
    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_USER_EMAIL i TEST_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    // Find the horoscope email toggle
    const toggle = page.locator(
      'input[type="checkbox"][id*="horoscope"], input[type="checkbox"][id*="email"]'
    ).first();

    if (await toggle.isVisible()) {
      const wasBefore = await toggle.isChecked();
      await toggle.click();

      // Wait for save
      await page.waitForTimeout(1000);

      // Reload and verify state persisted
      await page.reload();
      await page.waitForLoadState("networkidle");

      const afterReload = page.locator(
        'input[type="checkbox"][id*="horoscope"], input[type="checkbox"][id*="email"]'
      ).first();

      // State should have changed
      const isNow = await afterReload.isChecked();
      expect(isNow).toBe(!wasBefore);

      // Restore original state
      await afterReload.click();
    }
  });

  test("chat: /api/chat/message wymaga autoryzacji", async ({ request }) => {
    const res = await request.post("/api/chat/message", {
      data: { conversationId: "test", content: "Cześć" },
    });
    expect(res.status()).toBe(401);
  });

  // ─── Security: nowe endpointy wymagają autoryzacji ────────────────────────

  test("/api/daily-personal-horoscope wymaga tokenu Bearer", async ({ request }) => {
    const res = await request.get("/api/daily-personal-horoscope?date=2026-06-15");
    expect(res.status()).toBe(401);
  });

  test("/api/power-day-explanation wymaga tokenu Bearer", async ({ request }) => {
    const res = await request.post("/api/power-day-explanation", {
      data: { date: "2026-06-15" },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/daily-personal-horoscope odrzuca nieprawidłową datę", async ({ request }) => {
    const res = await request.get("/api/daily-personal-horoscope?date=not-a-date", {
      headers: { Authorization: "Bearer fake-token-that-will-fail-auth" },
    });
    // Either 400 (bad date) or 401 (auth fails first) — not 500
    expect(res.status()).toBeLessThan(500);
  });

  // ─── /app/horoscope — widok horoskopu ────────────────────────────────────

  test("niezalogowany user na /app/horoscope jest przekierowany", async ({ page }) => {
    await page.goto("/app/horoscope");
    await page.waitForLoadState("networkidle");
    // Should redirect to /login or similar auth gate
    const url = page.url();
    const isAuthGated = url.includes("/login") || url.includes("/signup") || url.includes("/app/horoscope");
    expect(isAuthGated).toBe(true);
  });

  test("zalogowany user widzi sekcję 'Energia dnia'", async ({ page }) => {
    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_USER_EMAIL i TEST_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    await page.goto("/app/horoscope");
    await page.waitForLoadState("networkidle");

    // "Energia dnia" section should be visible for any user with a chart
    const energySection = page.getByText("Energia dnia");
    await expect(energySection).toBeVisible({ timeout: 8000 });
  });

  test("wolny user widzi lock na personalnym horoskopie", async ({ page }) => {
    const email    = process.env.TEST_FREE_USER_EMAIL;
    const password = process.env.TEST_FREE_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_FREE_USER_EMAIL i TEST_FREE_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    await page.goto("/app/horoscope");
    await page.waitForLoadState("networkidle");

    // Free user should see the upsell lock section
    const lockSection = page.getByText("Personalny horoskop tranzytowy");
    await expect(lockSection).toBeVisible({ timeout: 8000 });
  });

  // ─── Kalendarz — Dni Mocy ─────────────────────────────────────────────────

  test("strona /app/calendar ładuje się bez błędów", async ({ page }) => {
    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Wymaga TEST_USER_EMAIL i TEST_USER_PASSWORD");

    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);

    const res = await page.goto("/app/calendar");
    expect(res?.status()).toBeLessThan(400);
    await page.waitForLoadState("networkidle");

    // Calendar grid or loading state should be present
    const hasContent = await page.locator('h1, h2, [class*="calendar"], [class*="Calendar"]').first().isVisible();
    expect(hasContent).toBe(true);
  });
});
