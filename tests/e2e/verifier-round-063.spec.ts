import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`verifier round 063: placement tray remains usable at 200% on ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
      .not.toBeNull();
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });

    await page
      .getByRole("button", { name: "Select Input stage", exact: true })
      .click();
    await page
      .locator(
        '[data-inventory-section="owned"] [data-module-id="stream-intake"]',
      )
      .click();
    await page
      .getByRole("button", {
        name: "Place Stream Intake in Build",
        exact: true,
      })
      .click();
    await page.locator(".placement-tray").scrollIntoViewIfNeeded();

    const geometry = await page.evaluate(() => {
      const tray = document.querySelector<HTMLElement>(".placement-tray");
      const copy = tray?.querySelector<HTMLElement>("div");
      const cancel = tray?.querySelector<HTMLElement>("button");
      if (!tray || !copy || !cancel) throw new Error("Missing placement tray");
      const cancelBox = cancel.getBoundingClientRect();
      const copyRange = document.createRange();
      copyRange.selectNodeContents(copy);
      const overlapCount = Array.from(copyRange.getClientRects()).filter(
        (rect) =>
          rect.left < cancelBox.right &&
          rect.right > cancelBox.left &&
          rect.top < cancelBox.bottom &&
          rect.bottom > cancelBox.top,
      ).length;
      return {
        tray: tray.getBoundingClientRect().toJSON(),
        cancel: cancelBox.toJSON(),
        copy: copy.getBoundingClientRect().toJSON(),
        overlapCount,
        viewportHeight: window.innerHeight,
      };
    });

    expect(geometry.tray.top).toBeGreaterThanOrEqual(0);
    expect(geometry.tray.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.cancel.top).toBeGreaterThanOrEqual(0);
    expect(geometry.cancel.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.copy.width).toBeGreaterThan(0);
    expect(geometry.overlapCount).toBe(0);
  });
}
