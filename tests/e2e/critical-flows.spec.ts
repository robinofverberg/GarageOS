import { expect, test } from "@playwright/test";

test("registers, creates a first vehicle, and sees it in the garage", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;

  await page.goto("/garage");
  await expect(page).toHaveURL(/\/auth\/login\?from=%2Fgarage$/);

  await page.getByRole("link", { name: "Create one" }).click();
  await page.getByLabel("Name").fill("E2E Driver");
  await page.getByLabel("Email *").fill(email);
  await page.getByLabel(/Password/).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/garage$/);
  await expect(page.getByRole("heading", { name: "Garage" })).toBeVisible();
  await expect(page.getByText("No vehicles in the garage yet.")).toBeVisible();

  await page.getByRole("link", { name: "+ Add Vehicle" }).click();
  await expect(page.getByRole("heading", { name: "Add Vehicle" })).toBeVisible();

  await page.getByLabel("Nickname").fill("Test Runner");
  await page.getByLabel("Year *").fill("1994");
  await page.getByLabel("Make *").fill("Toyota");
  await page.getByLabel("Model *").fill("Supra");
  await page.getByLabel("Trim").fill("Turbo");
  await page.getByLabel("Body Type").selectOption("Coupe");
  await page.getByLabel("Color").fill("White");
  await page.getByLabel("Mileage (mi)").fill("100000");
  await page.getByRole("button", { name: "Add Vehicle" }).click();

  await expect(page).toHaveURL(/\/vehicle\/[^/]+$/);
  await expect(page.getByRole("heading", { name: /Test Runner/ })).toBeVisible();
  await expect(page.getByText("100,000 mi")).toBeVisible();

  await page.getByRole("link", { name: /Garage/ }).click();
  await expect(page).toHaveURL(/\/garage$/);
  await expect(page.getByText("Test Runner")).toBeVisible();
  await expect(page.getByText(/1994 Toyota Supra Turbo/)).toBeVisible();
});
