import { expect, test } from "@playwright/test";

test("exact Career hour inputs remain reachable at 320px and 200% text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
  await page.getByRole("button", { name: "Career" }).click();

  const inputs = page.locator('.career-route input[type="number"]');
  await expect(inputs).toHaveCount(4);

  const geometry = await inputs.evaluateAll((elements) =>
    elements.map((element) => {
      const input = element.getBoundingClientRect();
      const route = element.closest(".career-route")?.getBoundingClientRect();
      return {
        width: input.width,
        height: input.height,
        left: input.left,
        right: input.right,
        routeLeft: route?.left ?? Number.NaN,
        routeRight: route?.right ?? Number.NaN,
      };
    }),
  );

  for (const box of geometry) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.left).toBeGreaterThanOrEqual(box.routeLeft);
    expect(box.right).toBeLessThanOrEqual(box.routeRight);
  }
});
