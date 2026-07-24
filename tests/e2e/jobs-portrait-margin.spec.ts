import { expect, test } from "@playwright/test";

const MINIMUM_NAV_CLEARANCE_PX = 8;

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`initial Jobs dispatch controls keep an ${MINIMUM_NAV_CLEARANCE_PX}px navigation reserve at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();

    const geometry = await page.evaluate(() => {
      const region = document.querySelector<HTMLElement>(".app-scroll-region");
      const nav = document.querySelector<HTMLElement>(".bottom-nav");
      const selected = document.querySelector<HTMLElement>(
        ".selected-dispatch strong",
      );
      const queue = document.querySelector<HTMLButtonElement>(".queue-one");

      if (!region || !nav || !selected || !queue) return null;

      const navBox = nav.getBoundingClientRect();
      const selectedBox = selected.getBoundingClientRect();
      const queueBox = queue.getBoundingClientRect();
      return {
        scrollTop: region.scrollTop,
        selectedClearance: navBox.top - selectedBox.bottom,
        queueClearance: navBox.top - queueBox.bottom,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry!.scrollTop).toBe(0);
    expect(geometry!.selectedClearance).toBeGreaterThanOrEqual(
      MINIMUM_NAV_CLEARANCE_PX,
    );
    expect(geometry!.queueClearance).toBeGreaterThanOrEqual(
      MINIMUM_NAV_CLEARANCE_PX,
    );
  });
}
