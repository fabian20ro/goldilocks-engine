import { expect, test } from "@playwright/test";

test.describe("verifier round 004 adversarial mobile behavior", () => {
  test("the touch module drawer exposes modules beyond the first screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");

    const drawer = page.locator(".module-library");
    const firstCard = drawer.locator(".module-card").first();
    await firstCard.scrollIntoViewIfNeeded();
    const dimensions = await drawer.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(
      dimensions.clientWidth + 100,
    );
    expect(await drawer.locator(".module-card").count()).toBeGreaterThan(2);
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    const initialScroll = await drawer.evaluate(
      (element) => element.scrollLeft,
    );

    const session = await page.context().newCDPSession(page);
    const start = {
      x: box!.x + box!.width * 0.75,
      y: box!.y + box!.height / 2,
    };
    const endX = start.x - Math.min(220, box!.width * 0.7);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    for (let step = 1; step <= 10; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + ((endX - start.x) * step) / 10,
            y: start.y,
            id: 1,
          },
        ],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });

    await expect
      .poll(() => drawer.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(initialScroll + 40);
  });

  test("Animations off removes every document animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: "Queue 10" }).click();
    await page.getByRole("button", { name: "Build" }).click();
    await page.getByRole("button", { name: "Animations on" }).click();
    await expect(
      page.getByRole("button", { name: "Animations off" }),
    ).toBeVisible();
    await page.waitForTimeout(50);

    const active = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => {
          const duration = animation.effect?.getTiming().duration;
          return (
            animation.playState !== "finished" &&
            (typeof duration !== "number" || duration > 1)
          );
        })
        .map((animation) => ({
          playState: animation.playState,
          duration: animation.effect?.getTiming().duration,
        })),
    );
    expect(active).toEqual([]);
  });
});
