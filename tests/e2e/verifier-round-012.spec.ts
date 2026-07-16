import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSavedState(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function openPrimary(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

test.describe("verifier round 012 persistence boundaries", () => {
  test("saved configuration keeps its own rig label after the live rig changes", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = 14;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();

    await openPrimary(page, "Upgrades");
    await page
      .getByRole("button", { name: "Buy Used 12 GB GPU for $14.00" })
      .click();
    await page.getByRole("button", { name: "Equip Used 12 GB GPU" }).click();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "Used 12 GB GPU equipped",
    );

    await openPrimary(page, "Inspect");
    await page.getByRole("button", { name: "Save current" }).click();
    const savedPreset = page.getByRole("button", { name: "Load Preset 1" });
    await expect(savedPreset).toContainText("Used 12 GB GPU");

    await openPrimary(page, "Upgrades");
    await page.getByRole("button", { name: "Equip Bedroom CPU" }).click();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "Bedroom CPU equipped",
    );
    await openPrimary(page, "Inspect");

    await expect(savedPreset).toContainText("Used 12 GB GPU");
    await expect(savedPreset).not.toContainText("Bedroom CPU");
  });

  test("malformed current-schema event content recovers without crashing Inspect", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        ledger: Array<{ message: unknown }>;
      };
      state.ledger[0]!.message = { malformed: true };
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();
    await expect(page.getByTestId("pipeline")).toBeVisible();

    await openPrimary(page, "Inspect");
    await page.waitForTimeout(100);
    expect(errors).toEqual([]);
    await expect(
      page.getByRole("heading", { name: "Recent event log" }),
    ).toBeVisible();
  });
});
