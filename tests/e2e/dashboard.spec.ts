import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { developmentDashboard } from "../../src/fixtures/dashboard";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(developmentDashboard),
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today’s signal" })).toBeVisible();
});

test("loads the complete dashboard with no serious automated accessibility violations", async ({ page }) => {
  for (const heading of [
    "Trend radar",
    "New models",
    "Coding tools and agents",
    "Benchmark watch",
    "Important dates",
    "Papers worth reading",
    "Source health and methodology",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeAttached();
  }
  await expect(page.getByText("Development fixture", { exact: true }).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("keyboard search and escape work without leaving the page", async ({ page }) => {
  await page.keyboard.press("/");
  const search = page.getByRole("searchbox", { name: "Search all dashboard data" });
  await expect(search).toBeFocused();
  await search.fill("repository-level");
  await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
  await expect(page.getByText("Development fixture: repository-level coding paper").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
});

test("filters narrow the editorial feed", async ({ page }) => {
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Category").selectOption("research");
  await page.getByRole("button", { name: "Show 1 result" }).click();
  await expect(page.locator("[data-feed-item]")).toHaveCount(1);
  await expect(page.locator("[data-feed-item='fixture-research']")).toBeVisible();
});

test("bookmarks persist across repeat visits", async ({ page }) => {
  const bookmark = page.getByRole("button", { name: "Bookmark Development fixture: model release" });
  await bookmark.click();
  await expect(page.getByRole("button", { name: "Remove bookmark for Development fixture: model release" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove bookmark for Development fixture: model release" })).toHaveAttribute("aria-pressed", "true");
});

test("unread filtering and item keyboard navigation are functional", async ({ page }) => {
  await page.keyboard.press("j");
  const activeCard = page.locator("[data-feed-item='fixture-model-release']");
  await expect(activeCard).toBeFocused();
  await page.keyboard.press("b");
  await expect(activeCard.getByRole("button", { name: "Remove bookmark for Development fixture: model release" })).toBeVisible();
  await activeCard.getByRole("button", { name: "Mark Development fixture: model release read" }).click();
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByRole("dialog", { name: "Filter the signal" })).toBeVisible();
  await page.getByLabel("Unread items").check();
  await page.getByRole("button", { name: "Show 2 results" }).click();
  await expect(page.locator("[data-feed-item='fixture-model-release']")).toHaveCount(0);
});

test("source links expose the original destination and new-tab behavior", async ({ page }) => {
  const source = page.locator("[data-feed-item='fixture-model-release']").getByRole("link", { name: /Open original source/ });
  await expect(source).toHaveAttribute("href", "https://example.com/model-release");
  await expect(source).toHaveAttribute("target", "_blank");
  await expect(source).toHaveAttribute("rel", /noopener/);
});

test("important dates export an ICS file", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("development-fixture-verified-future-date.ics");
});

test("the 390px layout does not overflow and retains source attribution", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Mobile-specific responsive assertion");
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  await expect(page.locator("[data-feed-item='fixture-model-release']").getByRole("link", { name: /Open original source from Development fixture/ })).toBeVisible();
  await expect(page.locator(".model-table")).toBeVisible();
  const filterBox = await page.getByRole("button", { name: "Filters" }).boundingBox();
  expect(filterBox?.height).toBeGreaterThanOrEqual(44);
});

test("reduced-motion mode collapses interaction transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page.getByRole("button", { name: "Filters" }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(duration).toMatch(/0\.001s|1ms/);
});
