import { expect, test, type Locator, type Page } from "@playwright/test";
import { openHelpAndMotionSettings, openSimulationContext } from "./helpers";

async function assertUncoveredTapTarget(
  page: Page,
  target: Locator,
  navTop: number,
): Promise<boolean> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return false;
  const label = (await target.textContent())?.trim() ?? "unnamed control";

  expect.soft(box.width).toBeGreaterThanOrEqual(44);
  expect.soft(box.height).toBeGreaterThanOrEqual(44);
  expect.soft(box.y).toBeGreaterThanOrEqual(0);
  expect
    .soft(
      box.y + box.height,
      `${label} must remain above fixed Primary navigation`,
    )
    .toBeLessThanOrEqual(navTop);

  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const hit = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element?.closest("button")?.textContent?.trim() ?? null;
  }, point);
  expect.soft(hit, `${label} center must resolve to itself`).toBe(label);
  return box.y >= 0 && box.y + box.height <= navTop && hit === label;
}

for (const { width, height } of [
  { width: 320, height: 568 },
  { width: 393, height: 667 },
]) {
  test(`verifier round 026: keeps every scaled header control reachable at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    const settings = await openHelpAndMotionSettings(page);
    const help = page.getByRole("button", {
      name: "Help / Quick start",
      exact: true,
    });
    const motion = page.getByRole("button", {
      name: "Animations on",
      exact: true,
    });
    const nav = page.getByRole("navigation", { name: "Primary" });
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    if (!navBox) return;
    if (!(await assertUncoveredTapTarget(page, help, navBox.y))) return;
    if (!(await assertUncoveredTapTarget(page, motion, navBox.y))) return;

    await motion.click();
    await expect(
      page.getByRole("button", { name: "Animations off", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    await settings.locator(":scope > summary").click();
    const context = await openSimulationContext(page);
    for (const label of ["1×", "4×", "16×", "64×"] as const) {
      const speed = context.getByRole("button", { name: label, exact: true });
      if (!(await assertUncoveredTapTarget(page, speed, navBox.y))) return;
      await speed.click();
      await openSimulationContext(page);
      await expect(speed).toHaveAttribute("aria-pressed", "true");
    }

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  });
}
