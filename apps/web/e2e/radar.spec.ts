import { test, expect } from "@playwright/test";

/**
 * Phase-1 happy path (zero-key, simulated drive):
 * open /foodmap → start simulated Radar → seeded venues appear in Ahead →
 * behind venues are suppressed once heading is confident → select → compact
 * card with a safe nav URL and a linked menu → Stop returns to entry.
 */
test("radar happy path with the simulated driver", async ({ page }) => {
  await page.goto("/foodmap");

  // No session yet: entry screen, and no permission prompt on load.
  await expect(page.getByTestId("entry-screen")).toBeVisible();

  await page.getByTestId("start-radar-sim").click();
  await expect(page.getByTestId("session-shell")).toBeVisible();

  // Ahead populates with an east/ahead venue as heading confidence builds.
  const burger = page.getByTestId("ahead-row").filter({ hasText: "Burger Town" });
  await expect(burger).toBeVisible({ timeout: 15_000 });

  // A west/behind venue is suppressed once heading is trustworthy.
  await expect(page.getByTestId("ahead-row").filter({ hasText: "Old Town Pizza" })).toHaveCount(0);

  // Select → compact card with a safe nav URL and a linked menu deep-link.
  await burger.click();
  const card = page.getByTestId("venue-card");
  await expect(card).toBeVisible();
  await expect(card.getByTestId("action-navigate")).toHaveAttribute(
    "href",
    /google\.com\/maps\/dir\/.*destination=/,
  );
  await expect(card.getByTestId("action-view-menu")).toHaveAttribute("href", /\/r\/burger-town/);

  // Dismiss the sheet, then switch to the Map view (same candidate collection).
  await card.getByTestId("venue-card-dismiss").click();
  await page.getByTestId("view-map").click();
  await expect(page.getByTestId("mock-map")).toBeVisible();

  // Stop ends the session and returns to the entry screen.
  await page.getByTestId("stop-btn").click();
  await expect(page.getByTestId("entry-screen")).toBeVisible();
});
