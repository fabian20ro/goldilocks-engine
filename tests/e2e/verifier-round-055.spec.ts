import { expect, test, type Page } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function touchTap(page: Page, label: string): Promise<void> {
  const target = page.getByRole("button", { name: label });
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`Missing touch target: ${label}`);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 },
      ],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

function offlineReadySave(): string {
  const state = createInitialState(55_055);
  return JSON.stringify(
    sealSimulationState({
      ...state,
      career: {
        ...state.career,
        offlinePolicy: {
          ...state.career.offlinePolicy,
          enabled: true,
          maxHours: 4,
          maxElectricityCost: 5,
          maxOperatingCost: 5,
          minReliability: 0.7,
        },
      },
    }),
  );
}

test("verifier round 055: a rejected evening cannot relabel a later offline completion", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: offlineReadySave() },
  );
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await page.getByRole("button", { name: "Run scheduled evening" }).click();
  await expect(page.locator(".career-schedule-feedback")).toContainText(
    /Worker rejected the scheduled evening:.*No evening was run/i,
  );

  const disclosure = page
    .locator('summary[aria-label="Show Safe freelance-only automation"]')
    .locator("xpath=..");
  await disclosure.locator("summary").click();
  await disclosure
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();
  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: {
            schedule?: { completedEvenings?: number };
            offlinePolicy?: { lastReport?: { appliedHours?: number } };
          };
        };
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? 0,
        };
      }, SAVE_KEY),
    )
    .toEqual({ completedEvenings: 1, offlineHours: 4 });

  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("4.00h used");
  expect(pageErrors).toEqual([]);
});

test("verifier round 055: Phase 2 Career controls retain accessible portrait behavior", async ({
  browser,
}) => {
  for (const { width, height, scale } of [
    { width: 320, height: 693, scale: true },
    { width: 393, height: 742, scale: false },
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") pageErrors.push(message.text());
    });
    try {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      if (scale)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Career", exact: true })
        .click();

      const freelance = page.getByLabel("Freelance delivery evening hours");
      const details = page.getByRole("button", {
        name: "Freelance delivery details",
      });
      await freelance.scrollIntoViewIfNeeded();
      await expect(freelance).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Run scheduled evening" }),
      ).toBeVisible();
      await touchTap(page, "Allocate 1 hours to Freelance delivery");
      await expect(freelance).toHaveValue("1");
      const controlSizes = await Promise.all([
        details.boundingBox(),
        page
          .getByRole("button", {
            name: "Allocate 1 hours to Freelance delivery",
          })
          .boundingBox(),
        page
          .getByRole("button", { name: "Run scheduled evening" })
          .boundingBox(),
      ]);
      for (const box of controlSizes) {
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Inspect", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("button", { name: "Career", exact: true })
        .click();
      await expect(freelance).toHaveValue("1");

      await details.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("region", { name: "Freelance delivery details" }),
      ).toBeVisible();
      const competitionDetails = page.getByRole("button", {
        name: "Bedroom Benchmark Cup details",
      });
      await competitionDetails.click();
      await expect(
        page.getByRole("region", { name: "Freelance delivery details" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("region", {
          name: "Bedroom Benchmark Cup details",
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(competitionDetails).toBeFocused();

      for (const title of [
        "Career progress and route actions",
        "Evaluation discipline",
        "Savings and costs",
        "Model tiers and quantization",
        "Safe freelance-only automation",
        "Independent conclusion",
        "Diagnostics",
      ]) {
        const summary = page.locator(`summary[aria-label="Show ${title}"]`);
        await summary.scrollIntoViewIfNeeded();
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(summary.locator("xpath=..")).toHaveAttribute("open", "");
      }

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        nestedCareerScrollers: Array.from(
          document.querySelectorAll<HTMLElement>(".career-composer *"),
        ).filter((element) => {
          const style = getComputedStyle(element);
          return (
            /(auto|scroll)/.test(style.overflowY) &&
            element.scrollHeight > element.clientHeight + 1
          );
        }).length,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.nestedCareerScrollers).toBe(0);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
