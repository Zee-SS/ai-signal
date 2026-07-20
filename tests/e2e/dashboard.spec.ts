import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { developmentDashboard } from "../../src/fixtures/dashboard";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
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
  await page.waitForTimeout(1100);

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

test("large linked rows hover gently and make coordinated visual space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1080p", "Desktop pointer-motion assertion");
  await page.getByText("Skills gaining attention", { exact: true }).scrollIntoViewIfNeeded();

  const firstRow = page.locator(".skill-bar").first();
  await firstRow.evaluate((element) => {
    const parent = element.parentNode;
    parent?.appendChild(element.cloneNode(true));
    parent?.appendChild(element.cloneNode(true));
  });
  await page.waitForTimeout(1100);

  const rows = page.locator(".skill-bar");
  await expect(rows).toHaveCount(3);
  const transition = await rows.nth(1).evaluate((element) => ({
    duration: getComputedStyle(element).transitionDuration,
    easing: getComputedStyle(element).transitionTimingFunction,
  }));
  expect(transition.duration.split(", ")).toEqual(["0.42s", "0.42s", "0.42s"]);
  expect(transition.easing).toBe(Array(3).fill("cubic-bezier(0.65, 0, 0.35, 1)").join(", "));

  const before = await rows.evaluateAll((elements) => elements.map((element) => ({
    offsetTop: (element as HTMLElement).offsetTop,
    rect: element.getBoundingClientRect().toJSON(),
  })));
  await rows.nth(1).hover();
  await page.waitForTimeout(210);
  const during = await rows.evaluateAll((elements) => elements.map((element) => ({
    offsetTop: (element as HTMLElement).offsetTop,
    rect: element.getBoundingClientRect().toJSON(),
  })));
  const firstBefore = before[0]!;
  const hoveredBefore = before[1]!;
  const lastBefore = before[2]!;
  const firstDuring = during[0]!;
  const hoveredDuring = during[1]!;
  const lastDuring = during[2]!;

  expect(firstDuring.rect.y).toBeLessThan(firstBefore.rect.y);
  expect(lastDuring.rect.y).toBeGreaterThan(lastBefore.rect.y);
  expect(hoveredDuring.rect.width / hoveredBefore.rect.width).toBeGreaterThan(1);
  expect(hoveredDuring.rect.width / hoveredBefore.rect.width).toBeLessThanOrEqual(1.0035);
  expect(during.map((row) => row.offsetTop)).toEqual(before.map((row) => row.offsetTop));
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

test("night mode is accessible and persists on this device", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await toggle.evaluate((element) => element.nextElementSibling?.classList.contains("header-github"))).toBe(true);
  await toggle.click();
  await page.waitForTimeout(350);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("ai-signal:theme:v1"))).toBe('"dark"');

  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(accessibility.violations, JSON.stringify(accessibility.violations, null, 2)).toEqual([]);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("reload control reloads the document and every reload starts at the top", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "Desktop document reload assertion");
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, document.body.scrollHeight);
    root.style.removeProperty("scroll-behavior");
    (window as Window & { __aiSignalDocumentMarker?: boolean }).__aiSignalDocumentMarker = true;
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const reloadNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reload AI Signal from the top" }).click();
  await reloadNavigation;
  await expect(page.getByRole("heading", { name: /The coding edge/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => (window as Window & { __aiSignalDocumentMarker?: boolean }).__aiSignalDocumentMarker)).toBeUndefined();

  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, document.body.scrollHeight);
    root.style.removeProperty("scroll-behavior");
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /The coding edge/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("desktop wheel scrolling settles with a slight spring overshoot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "Desktop wheel-motion assertion");
  const samplesPromise = page.evaluate(() => new Promise<number[]>((resolve) => {
    const samples: number[] = [];
    let started = false;
    const sample = (): void => {
      const active = document.documentElement.dataset.scrollMotion === "active";
      if (active) started = true;
      samples.push(window.scrollY);
      if (started && !active) {
        resolve(samples);
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));

  await page.mouse.wheel(0, 600);
  const samples = await samplesPromise;
  const finalPosition = samples.at(-1) ?? 0;
  const maximumPosition = Math.max(...samples);
  expect(finalPosition).toBeGreaterThan(300);
  expect(maximumPosition).toBeGreaterThan(finalPosition + 1);
  expect(maximumPosition).toBeLessThan(finalPosition * 1.025);
  expect(new Set(samples.map((sample) => Math.round(sample))).size).toBeGreaterThan(10);
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

test("reduced-motion mode removes reveal and press transitions", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "mobile-390") {
    expect(await page.evaluate(() => matchMedia("(pointer: fine)").matches)).toBe(false);
  } else {
    await page.evaluate(() => {
      const testWindow = window as Window & { __wheelPrevented?: boolean };
      delete testWindow.__wheelPrevented;
      window.addEventListener("wheel", (event) => {
        testWindow.__wheelPrevented = event.defaultPrevented;
      }, { once: true });
    });
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => (window as Window & { __wheelPrevented?: boolean }).__wheelPrevented)).toBe(false);
  }
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-motion", "active");
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
