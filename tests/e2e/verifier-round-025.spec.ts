import { expect, test } from "@playwright/test";
import { openSimulationContext } from "./helpers";

for (const width of [320, 393]) {
  test(`keeps the 64x simulation-time control physically tap-reachable at ${width}px and 200 percent text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    const context = await openSimulationContext(page);
    const speed = context.getByRole("button", { name: "64×" });
    await speed.scrollIntoViewIfNeeded();
    const box = await speed.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const physicalTarget = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return element?.closest("button")?.textContent?.trim() ?? null;
    }, point);
    expect(physicalTarget).toContain("64×");

    await page.mouse.click(point.x, point.y);
    await openSimulationContext(page);
    await expect(speed).toHaveAttribute("aria-pressed", "true");
  });
}
