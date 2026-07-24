import { expect, test } from "@playwright/test";

const PORTRAITS = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
] as const;
const NAVIGATION_RESERVE_PX = 8;

for (const viewport of PORTRAITS) {
  test(`verifier round 044: raw Jobs controls keep a physical ${NAVIGATION_RESERVE_PX}px reserve at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();

    const geometry = await page.evaluate(() => {
      const region = document.querySelector<HTMLElement>(".app-scroll-region");
      const nav = document.querySelector<HTMLElement>(".bottom-nav");
      const label = document.querySelector<HTMLElement>(
        ".selected-dispatch strong",
      );
      const queue = document.querySelector<HTMLButtonElement>(".queue-one");
      if (!region || !nav || !label || !queue) return null;

      const navBox = nav.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const queueBox = queue.getBoundingClientRect();
      const hit = document.elementFromPoint(
        queueBox.left + queueBox.width / 2,
        queueBox.top + queueBox.height / 2,
      );
      return {
        scrollTop: region.scrollTop,
        horizontalOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        labelClearance: navBox.top - labelBox.bottom,
        queueClearance: navBox.top - queueBox.bottom,
        queueWidth: queueBox.width,
        queueHeight: queueBox.height,
        queueCenterHitsQueue: hit?.closest("button") === queue,
        queueCenter: {
          x: queueBox.left + queueBox.width / 2,
          y: queueBox.top + queueBox.height / 2,
        },
      };
    });

    expect(geometry).not.toBeNull();
    await testInfo.attach("raw-jobs-geometry.json", {
      body: JSON.stringify(geometry, null, 2),
      contentType: "application/json",
    });
    expect(geometry!.scrollTop).toBe(0);
    expect(geometry!.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(geometry!.labelClearance).toBeGreaterThanOrEqual(
      NAVIGATION_RESERVE_PX,
    );
    expect(geometry!.queueClearance).toBeGreaterThanOrEqual(
      NAVIGATION_RESERVE_PX,
    );
    expect(geometry!.queueWidth).toBeGreaterThanOrEqual(44);
    expect(geometry!.queueHeight).toBeGreaterThanOrEqual(44);
    expect(geometry!.queueCenterHitsQueue).toBe(true);

    await page.mouse.click(geometry!.queueCenter.x, geometry!.queueCenter.y);
    await expect(page.getByTestId("first-session-guide")).toContainText(
      "step 2 of 3",
    );
    await page.screenshot({
      path: `test-results/verifier-round-044/${viewport.width}-raw-jobs.png`,
    });
    expect(errors).toEqual([]);
  });

  test(`verifier round 044: scaled Jobs remains reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();
    const queue = page.getByRole("button", {
      name: "Queue one safe Interactive Chat job",
    });
    await queue.scrollIntoViewIfNeeded();

    const scaled = await queue.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return {
        width: box.width,
        height: box.height,
        centerHitsQueue: hit?.closest("button") === element,
        horizontalOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        activeAnimations: document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
      };
    });

    expect(scaled.width).toBeGreaterThanOrEqual(44);
    expect(scaled.height).toBeGreaterThanOrEqual(44);
    expect(scaled.centerHitsQueue).toBe(true);
    expect(scaled.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(scaled.activeAnimations).toBe(0);
    await queue.click();
    await expect(page.getByTestId("first-session-guide")).toContainText(
      "step 2 of 3",
    );
    await page.screenshot({
      path: `test-results/verifier-round-044/${viewport.width}-scaled-jobs.png`,
    });
    expect(errors).toEqual([]);
  });
}
