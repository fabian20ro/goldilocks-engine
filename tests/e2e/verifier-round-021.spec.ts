import { expect, test, type Locator, type Page } from "@playwright/test";
import { resealSavedRecord } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function buyAndActivateExpansion(page: Page) {
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
}

async function decisionCopyFailures(cards: Locator) {
  return cards.evaluateAll((elements) =>
    elements.flatMap((card, cardIndex) => {
      const fields = Array.from(
        card.querySelectorAll<HTMLElement>(
          ".module-copy strong, .module-copy small, .module-copy .module-status",
        ),
      );
      return fields.flatMap((field) => {
        const text = field.textContent?.trim() ?? "";
        const firstWord = text.match(/\S+/)?.[0] ?? "";
        const textNode = field.firstChild;
        let firstWordLines = 0;
        if (textNode && firstWord) {
          const range = document.createRange();
          range.setStart(textNode, 0);
          range.setEnd(
            textNode,
            Math.min(firstWord.length, textNode.textContent?.length ?? 0),
          );
          firstWordLines = range.getClientRects().length;
        }
        const style = getComputedStyle(field);
        const clipped =
          field.scrollWidth > field.clientWidth + 1 ||
          field.scrollHeight > field.clientHeight + 1;
        return clipped ||
          firstWordLines > 1 ||
          style.textOverflow === "ellipsis"
          ? [
              {
                cardIndex,
                text,
                clipped,
                firstWordLines,
                textOverflow: style.textOverflow,
              },
            ]
          : [];
      });
    }),
  );
}

for (const width of [320, 393]) {
  test(`intrinsic module reflow keeps pipeline and drawer copy readable at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await buyAndActivateExpansion(page);

    const outputCard = page.getByTestId("slot-sink").locator(".module-card");
    await expect(outputCard).toBeVisible();
    expect(
      await outputCard.evaluate((element) => getComputedStyle(element).display),
    ).toBe(width === 320 ? "grid" : "flex");

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await expect
      .poll(() =>
        outputCard.evaluate((element) => getComputedStyle(element).display),
      )
      .toBe("grid");

    expect(
      await decisionCopyFailures(page.locator(".pipeline .module-card")),
    ).toEqual([]);
    expect(
      await decisionCopyFailures(page.locator(".module-library .module-card")),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
