import { expect, test } from "@playwright/test";

for (const scenario of [
  { width: 320, height: 693, scale: 100 },
  { width: 393, height: 742, scale: 100 },
  { width: 320, height: 693, scale: 200 },
  { width: 393, height: 742, scale: 200 },
]) {
  test(`Career controls remain contained at ${scenario.width}px and ${scenario.scale}% text`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.setViewportSize({
      width: scenario.width,
      height: scenario.height,
    });
    await page.goto("/");
    if (scenario.scale === 200) {
      await page.addStyleTag({
        content: ":root { font-size: 200% !important; }",
      });
    }
    await page.getByRole("button", { name: "Career" }).click();

    const controls = page.locator(
      '.career-route input[type="number"], .hour-tokens button',
    );
    await expect(controls).toHaveCount(20);

    for (const control of await controls.all()) {
      const geometry = await control.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const route = element.closest(".career-route")?.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          left: box.left,
          right: box.right,
          routeLeft: route?.left ?? Number.NaN,
          routeRight: route?.right ?? Number.NaN,
        };
      });
      expect(geometry.width).toBeGreaterThanOrEqual(44);
      expect(geometry.height).toBeGreaterThanOrEqual(44);
      expect(geometry.left).toBeGreaterThanOrEqual(geometry.routeLeft);
      expect(geometry.right).toBeLessThanOrEqual(geometry.routeRight);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(scenario.width);
    }

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
