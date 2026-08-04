import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home and login are reachable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.goto("/login");
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });

  test("obs without token shows error", async ({ page }) => {
    await page.goto("/obs/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/OBSトークン/)).toBeVisible();
  });
});
