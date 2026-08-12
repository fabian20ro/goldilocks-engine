import { expect, type Page } from "@playwright/test";

export const STARTER_QUEUE_NAME = "Queue one safe Interactive Chat job";

export async function settleStarterJob(page: Page) {
  await page.getByRole("button", { name: STARTER_QUEUE_NAME }).click();
  await page.getByRole("button", { name: "64×" }).click();
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 3 of 3",
    { timeout: 10_000 },
  );
}

export async function beginLibraryPlacement(
  page: Page,
  moduleId: string,
  moduleName: string,
) {
  const card = page.locator(`.module-library [data-module-id="${moduleId}"]`);
  if ((await card.count()) === 0)
    await page.getByRole("button", { name: "Show every module (17)" }).click();
  await card.click();
  await expect(
    page.getByRole("region", { name: `${moduleName} details` }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Place ${moduleName} in Build` })
    .click();
}

export async function placeLibraryModule(
  page: Page,
  moduleId: string,
  moduleName: string,
  slotId: string,
) {
  await beginLibraryPlacement(page, moduleId, moduleName);
  await page
    .getByTestId(`slot-${slotId}`)
    .getByRole("button", { name: "Snap here" })
    .click();
}

export async function beginStagePlacement(
  page: Page,
  moduleName: string,
  slotId: string,
) {
  await page
    .getByTestId(`slot-${slotId}`)
    .getByRole("button", { name: new RegExp(`^${moduleName}\\.`) })
    .click();
  await expect(
    page.getByRole("region", { name: `${moduleName} details` }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Place ${moduleName} in Build` })
    .click();
}
