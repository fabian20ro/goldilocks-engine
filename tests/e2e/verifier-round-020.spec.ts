import { expect, test, type Page } from "@playwright/test";
import { resealSavedRecord } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

test("keeps output decision copy readable at 393px and 200 percent text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto("/");
  await page.getByRole("button", { name: "Dismiss tutorial" }).click();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    state.resources.money = 45;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await resealSavedRecord(page, SAVE_KEY);
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });

  const output = page.getByTestId("slot-sink");
  await output.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );

  const clippedFields = await output
    .locator(
      ".module-copy strong, .module-copy small, .module-copy .module-status",
    )
    .evaluateAll((elements) =>
      elements.map((element) => ({
        text: element.textContent?.trim() ?? "",
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })),
    );

  expect(clippedFields.map(({ text }) => text)).toEqual([
    "Delivery Gate",
    "20/m · 0.2 GB · 99.7%",
    "EQUIPPED",
  ]);
  expect(
    clippedFields.filter(
      ({ clientWidth, scrollWidth }) => scrollWidth > clientWidth,
    ),
  ).toEqual([]);
});
