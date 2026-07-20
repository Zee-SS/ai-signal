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
  await expect(page.getByRole("heading", { name: /The coding edge/ })).toBeVisible();
});

test("loads the focused coding pulse with no serious accessibility violations", async ({ page }) => {
  for (const heading of [
    "Best depends on what you value.",
    "Where the coding happens matters.",
    "Only dates worth watching.",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeAttached();
  }
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByText("Development fixture", { exact: true }).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const violations = accessibility.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.html),
  }));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("switches model graph views and reveals a model trade-off", async ({ page }) => {
  const costView = page.getByRole("button", { name: "Quality × cost" });
  await expect(costView).toHaveAttribute("aria-pressed", "false");
  await costView.click();
  await expect(costView).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Fixture fast model: 57% resolved/ }).click();
  await expect(page.getByText("Fixture-only faster, lower-quality trade-off used to exercise chart switching.")).toBeVisible();
  await expect(page.getByRole("complementary").getByText("164 tok/s", { exact: true })).toBeVisible();
});

test("separates local and browser agents and shows skill momentum", async ({ page }) => {
  await expect(page.getByText("Terminal + PC", { exact: true })).toBeAttached();
  await expect(page.getByText("Browser + cloud", { exact: true })).toBeAttached();
  await expect(page.getByRole("link", { name: /Fixture Agent/ })).toHaveAttribute("href", "https://example.com/agent");
  await expect(page.getByRole("link", { name: /Fixture Cloud Agent/ })).toHaveAttribute("href", "https://example.com/browser-agent");
  await expect(page.getByRole("link", { name: /Fixture Skills/ })).toContainText("84");
});

test("navigation morphs into a rounded sticky island after scrolling", async ({ page }) => {
  await page.getByRole("link", { name: "Agents + skills" }).click();
  await expect(page.getByRole("heading", { name: "Where the coding happens matters." })).toBeInViewport();
  await expect(page.locator(".site-header")).toHaveAttribute("data-compact", "true");
  const position = await page.getByRole("navigation", { name: "Primary navigation" }).evaluate((element) => getComputedStyle(element.closest(".site-header-slot") as Element).position);
  expect(position).toBe("sticky");
});

test("mark seen stores the visit on this device", async ({ page }) => {
  await page.getByRole("button", { name: "Mark seen" }).click();
  const lastVisit = await page.evaluate(() => localStorage.getItem("ai-signal:last-visit:v1"));
  expect(lastVisit).toMatch(/2026|2027|2028/);
});

test("source links retain original destinations and safe new-tab behavior", async ({ page }) => {
  const qualitySource = page.getByRole("link", { name: "Leaderboard" });
  await expect(qualitySource).toHaveAttribute("href", "https://example.com/quality");
  await expect(qualitySource).toHaveAttribute("target", "_blank");
  await expect(qualitySource).toHaveAttribute("rel", /noopener/);
});

test("release radar exports a valid ICS file", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Development fixture: verified future date calendar file" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("development-fixture-verified-future-date.ics");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (stream) for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString("utf8")).toContain("BEGIN:VCALENDAR");
});

test("the 390px layout has no horizontal overflow and keeps 44px controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Mobile-specific responsive assertion");
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole("button", { name: /Fixture coding model: 61% resolved/ })).toBeVisible();
  const metricToggle = await page.getByRole("button", { name: "Quality × speed" }).boundingBox();
  expect(metricToggle?.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("link", { name: /Fixture Cloud Agent/ })).toBeAttached();
});

test("reduced-motion mode removes reveal and press transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page.getByRole("button", { name: "Quality × cost" }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(duration).toMatch(/0\.001s|1ms/);
});

test("going offline keeps the loaded coding pulse usable", async ({ page, context }) => {
  await context.setOffline(true);
  await expect(page.getByText("Offline snapshot", { exact: true })).toBeVisible();
  await expect(page.getByText("Showing the last verified dashboard saved on this device.")).toBeVisible();
  await expect(page.getByRole("heading", { name: /The coding edge/ })).toBeVisible();
  await context.setOffline(false);
});
