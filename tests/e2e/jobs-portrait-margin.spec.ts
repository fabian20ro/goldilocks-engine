import { expect, test, type Page } from "@playwright/test";

import { settleStarterJob } from "./helpers";

const MINIMUM_NAV_CLEARANCE_PX = 8;
const portraitViewports = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];

async function openJobs(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
}

async function readSelectedDispatchLayout(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(".bottom-nav");
    const header = document.querySelector<HTMLElement>(
      ".selected-dispatch > div",
    );
    const title = document.querySelector<HTMLElement>(
      ".selected-dispatch > div > span > strong",
    );
    const price = document.querySelector<HTMLElement>(
      ".selected-dispatch > div > b",
    );
    const queue = document.querySelector<HTMLButtonElement>(".queue-one");
    if (!nav || !header || !title || !price || !queue) return null;

    const textBounds = (element: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect();
    };
    const titleBounds = textBounds(title);
    const priceBounds = textBounds(price);
    const style = getComputedStyle(header);
    return {
      gridTemplateAreas: style.gridTemplateAreas,
      trackCount: style.gridTemplateColumns.trim().split(/\s+/).length,
      queueClearance:
        nav.getBoundingClientRect().top - queue.getBoundingClientRect().bottom,
      title: {
        text: title.textContent?.trim(),
        left: titleBounds.left,
        right: titleBounds.right,
        top: titleBounds.top,
        bottom: titleBounds.bottom,
      },
      price: {
        text: price.textContent?.trim(),
        left: priceBounds.left,
        right: priceBounds.right,
        top: priceBounds.top,
        bottom: priceBounds.bottom,
      },
      noHorizontalOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    };
  });
}

for (const viewport of portraitViewports) {
  test(`initial Jobs dispatch controls keep an ${MINIMUM_NAV_CLEARANCE_PX}px navigation reserve at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await openJobs(page);

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

for (const viewport of portraitViewports) {
  test(`selected Jobs workload stays compact at raw text and reflows its quote at 200% text at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await openJobs(page);
    await settleStarterJob(page);

    const rawLayout = await readSelectedDispatchLayout(page);
    expect(rawLayout).not.toBeNull();
    expect(rawLayout!.gridTemplateAreas).toBe("none");
    expect(rawLayout!.trackCount).toBe(3);
    expect(rawLayout!.queueClearance).toBeGreaterThanOrEqual(
      MINIMUM_NAV_CLEARANCE_PX,
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).fontSize,
        ),
      )
      .toBe("32px");
    await page.locator(".selected-dispatch").scrollIntoViewIfNeeded();

    const scaledLayout = await readSelectedDispatchLayout(page);
    expect(scaledLayout).not.toBeNull();
    expect(scaledLayout!.gridTemplateAreas).toBe('"glyph summary" ". price"');
    expect(scaledLayout!.trackCount).toBe(2);
    expect(scaledLayout!.title.text).not.toBe("");
    expect(scaledLayout!.price.text).not.toBe("");
    expect(scaledLayout!.title.bottom).toBeLessThanOrEqual(
      scaledLayout!.price.top,
    );
    expect(scaledLayout!.noHorizontalOverflow).toBe(true);
  });
}
