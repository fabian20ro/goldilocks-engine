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

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test.describe("verifier round 013 persistence and configuration recovery", () => {
  test("loading a saved configuration restores its stored rig after live divergence", async ({
    page,
  }) => {
    const errors = captureErrors(page);
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
    await openPrimary(page, "Inspect");
    await page.getByRole("button", { name: "Save current" }).click();

    await openPrimary(page, "Upgrades");
    await page.getByRole("button", { name: "Equip Bedroom CPU" }).click();
    await openPrimary(page, "Inspect");
    await page.getByRole("button", { name: "Load Preset 1" }).click();

    await expect
      .poll(() =>
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
            hardwareId?: string;
          } | null;
          return state?.hardwareId;
        }, SAVE_KEY),
      )
      .toBe("used-gpu");
    await openPrimary(page, "Upgrades");
    await expect(
      page.getByRole("button", { name: "Equipped now" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a stale integrity digest is resealed and the recovered run stays operable", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.goto("/");
    await waitForSavedState(page);
    const staleDigest = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        integrity: { digest: string };
      };
      state.integrity.digest = "00000000";
      localStorage.setItem(key, JSON.stringify(state));
      return state.integrity.digest;
    }, SAVE_KEY);
    await page.reload();

    await expect
      .poll(() =>
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
            integrity?: { digest?: string };
            migration?: { steps?: string[] };
          } | null;
          return {
            digest: state?.integrity?.digest,
            resealed: state?.migration?.steps?.includes("integrity-resealed"),
          };
        }, SAVE_KEY),
      )
      .toMatchObject({ resealed: true });
    expect(
      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          integrity: { digest: string };
        };
        return state.integrity.digest;
      }, SAVE_KEY),
    ).not.toBe(staleDigest);

    await openPrimary(page, "Jobs");
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs?: { queued?: number; completed?: number; failed?: number };
          } | null;
          return (
            (state?.jobs?.queued ?? 0) +
            (state?.jobs?.completed ?? 0) +
            (state?.jobs?.failed ?? 0)
          );
        }, SAVE_KEY),
      )
      .toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
