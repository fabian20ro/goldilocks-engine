import { expect, test } from "@playwright/test";

for (const width of [320, 393]) {
  test(`keeps every primary resource label and value visible at ${width}px and 200 percent text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    const clippedResources = await page
      .locator(".resource-strip dt, .resource-strip dd")
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const clipped = element.scrollWidth > element.clientWidth + 1;
          return clipped
            ? [
                {
                  text: element.textContent?.trim(),
                  clientWidth: element.clientWidth,
                  scrollWidth: element.scrollWidth,
                },
              ]
            : [];
        }),
      );

    expect(clippedResources).toEqual([]);
  });
}
