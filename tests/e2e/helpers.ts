import { expect, type Page } from "@playwright/test";

export const STARTER_QUEUE_NAME = "Queue one safe Interactive Chat job";

/** Global controls are intentionally compact until the player asks for them. */
export async function openSimulationContext(page: Page) {
  // The anchored Help panel intentionally takes visual precedence while open.
  // Close that separate disclosure through its own summary before asking for
  // Simulation; this mirrors sequential keyboard/touch use rather than
  // bypassing native details state in a test.
  const settings = page.locator(".header-settings");
  if (
    await settings.evaluate((element) => (element as HTMLDetailsElement).open)
  )
    await settings.locator(":scope > summary").click();
  const context = page.getByTestId("simulation-context");
  await expect(context).toBeVisible();
  const open = await context.evaluate(
    (element) => (element as HTMLDetailsElement).open,
  );
  if (!open) await context.locator(":scope > summary").click();
  return context;
}

export async function chooseSimulationSpeed(
  page: Page,
  speed: "1×" | "4×" | "16×" | "64×",
) {
  const context = await openSimulationContext(page);
  const control = context.getByRole("button", { name: speed, exact: true });
  await control.click();
  return control;
}

/** Help and motion share one progressive disclosure in the compact header. */
export async function openHelpAndMotionSettings(page: Page) {
  const settings = page.locator(".header-settings");
  await expect(settings).toBeVisible();
  const open = await settings.evaluate(
    (element) => (element as HTMLDetailsElement).open,
  );
  if (!open) await settings.locator(":scope > summary").click();
  return settings;
}

export async function settleStarterJob(page: Page) {
  await page.getByRole("button", { name: STARTER_QUEUE_NAME }).click();
  await chooseSimulationSpeed(page, "64×");
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
