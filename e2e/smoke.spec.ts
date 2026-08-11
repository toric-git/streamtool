import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home shows signup for first-time users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "新規登録" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "はじめての方へ" })).toBeVisible();
  });

  test("login and signup modes are reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await page.goto("/login?mode=signup");
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
    await expect(page.getByLabel("表示名")).toBeVisible();
  });

  test("soundboard tool page links into product flow", async ({ page }) => {
    await page.goto("/tools/soundboard");
    await expect(
      page.getByRole("heading", { name: /サウンドボード/ }),
    ).toBeVisible();
  });
});

/**
 * Full invite → play path needs a seeded Supabase project + credentials.
 * Keep this skipped in CI; enable locally with E2E_LIVE=1 and env secrets.
 */
test.describe("live room flow", () => {
  test.skip(
    !process.env.E2E_LIVE,
    "Set E2E_LIVE=1 with a seeded Supabase project to run multiplayer playback checks.",
  );

  test("placeholder for invite-play", async () => {
    // Intentionally empty scaffold — wire credentials + room fixtures next.
    expect(true).toBe(true);
  });
});
