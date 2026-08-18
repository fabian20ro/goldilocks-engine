import { expect, test, type Page } from "@playwright/test";
import { resealSavedRecord } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openResearch(page: Page) {
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Research console" }),
  ).toBeVisible();
}

test.describe("Research frontier", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
      .not.toBeNull();
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number; reputation: number };
        jobs: { completed: number; paused: boolean };
      };
      state.resources.money = 8;
      state.resources.reputation = 0.2;
      state.jobs.completed = 1;
      state.jobs.paused = true;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await resealSavedRecord(page, SAVE_KEY);
    await page.reload();
  });

  test("normal and adversarial: goal, bounded ranges, inspect, hidden frontier, and prerequisite failure", async ({
    page,
  }) => {
    await openResearch(page);
    await expect(
      page.getByRole("heading", { name: "Short research goal" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Research goal" })
      .fill("Find the safest useful evidence");
    await page.getByRole("button", { name: "Save research goal" }).click();
    await expect(page.locator(".pending-decision")).toContainText(
      "Inspect the frontier",
    );
    await expect(page.getByText("Duration range")).toBeVisible();
    await expect(page.getByText("Usefulness range")).toBeVisible();
    await page
      .getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      })
      .click();
    await expect(
      page.getByTestId("research-project-evidence-weave"),
    ).toBeVisible();
    const blocked = page.getByRole("button", {
      name: "Inspect evidence for Evidence Weave",
    });
    await expect(blocked).toBeDisabled();
    await expect(
      page.getByText(/Collect 20% private evaluation coverage/),
    ).toBeVisible();
  });

  test("lifecycle: reload persistence, keyboard focus, reduced motion, 320px and 200% text", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 693 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openResearch(page);
    await page
      .getByRole("textbox", { name: "Research goal" })
      .fill("Keep a durable evidence trail");
    await page.getByRole("button", { name: "Save research goal" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          (key) =>
            (
              JSON.parse(localStorage.getItem(key) ?? "null") as {
                research?: { goal?: { text?: string } | null };
              }
            ).research?.goal?.text,
          SAVE_KEY,
        ),
      )
      .toBe("Keep a durable evidence trail");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.getByText("Keep a durable evidence trail")).toBeVisible();
    await page
      .getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      })
      .focus();
    await expect(
      page.getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      }),
    ).toBeFocused();
    await page.reload();
    await openResearch(page);
    await expect(
      page.getByRole("textbox", { name: "Research goal" }),
    ).toHaveValue("Keep a durable evidence trail");
    await page.context().setOffline(true);
    await expect(
      page.getByRole("heading", { name: "Research console" }),
    ).toBeVisible();
    await page.context().setOffline(false);
  });
});
