import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

interface ReplaySnapshot {
  readonly career?: {
    readonly evaluation?: {
      readonly publicScore?: number | null;
      readonly publicEvaluations?: number;
      readonly privateAssessment?: string;
      readonly privateEvaluations?: number;
      readonly coverage?: number;
      readonly evaluationSpend?: number;
      readonly modelSwitches?: number;
    };
    readonly runEnding?: { readonly id?: string } | null;
  };
  readonly meta?: {
    readonly unlockedDiagnosticIds?: readonly string[];
    readonly completedEndingIds?: readonly string[];
    readonly replayCount?: number;
  };
  readonly resources?: { readonly money?: number };
}

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function savedState(page: Page): Promise<ReplaySnapshot> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as ReplaySnapshot;
  }, SAVE_KEY);
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
}

async function assertPortraitControls(page: Page): Promise<void> {
  const layout = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    ).filter((button) => {
      const style = getComputedStyle(button);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      undersized: buttons
        .map((button) => {
          const box = button.getBoundingClientRect();
          return {
            label: button.getAttribute("aria-label") || button.textContent,
            width: box.width,
            height: box.height,
          };
        })
        .filter((button) => button.width < 44 || button.height < 44),
    };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
  expect(layout.undersized).toEqual([]);
}

async function touchTap(page: Page, control: ReturnType<Page["getByRole"]>) {
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  const session = await page.context().newCDPSession(page);
  const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...point, id: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

test.describe("evaluation, failure, and replay acceptance", () => {
  test("keeps public proxy and paid private evidence distinct through recovery and reload", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSave(page);
    await openCareer(page);

    await expect(
      page.getByRole("heading", { name: "Evaluation discipline" }),
    ).toBeVisible();
    await expect(
      page.getByText(/not an exact actual-capability number/i),
    ).toBeVisible();

    const publicPreview = page.getByRole("button", {
      name: "Run public benchmark preview",
    });
    await publicPreview.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(async () => (await savedState(page)).career?.evaluation)
      .toMatchObject({ publicEvaluations: 1, publicScore: expect.any(Number) });

    const privateEvaluation = page.getByRole("button", {
      name: "Run paid private evaluation",
    });
    await privateEvaluation.click();
    await expect
      .poll(async () => (await savedState(page)).career?.evaluation)
      .toMatchObject({
        privateEvaluations: 0,
        privateAssessment: "not-run",
        coverage: 0,
        evaluationSpend: 0,
      });

    await page.getByRole("button", { name: "Withdraw savings" }).click();
    await expect
      .poll(async () => (await savedState(page)).resources?.money ?? 0)
      .toBe(1);

    await privateEvaluation.click();
    await expect
      .poll(async () => (await savedState(page)).career?.evaluation)
      .toMatchObject({
        privateEvaluations: 1,
        evaluationSpend: 0.75,
      });
    expect(
      (await savedState(page)).career?.evaluation?.privateAssessment,
    ).not.toBe("not-run");

    await page.reload();
    await openCareer(page);
    await expect(
      page.getByText("Private assessment", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (await savedState(page)).career?.evaluation?.privateEvaluations,
      )
      .toBe(1);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await assertPortraitControls(page);
  });

  test("records a keyboard/touch-visible tutorial failure, causal postmortem, offline reload, and information-only restart", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 320, height: 742 });
    await page.goto("/");
    await waitForSave(page);
    await openCareer(page);

    const q4 = page.getByRole("button", { name: /^Q4 fast \/ lower memory$/ });
    const q8 = page.getByRole("button", {
      name: /^Q8 quality \/ higher memory$/,
    });
    await q8.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(
        async () => (await savedState(page)).career?.evaluation?.modelSwitches,
      )
      .toBe(1);

    for (let index = 1; index < 8; index += 1) {
      const control = index % 2 === 0 ? q8 : q4;
      if (index === 1) {
        await touchTap(page, control);
      } else {
        await control.click();
      }
      await expect
        .poll(
          async () =>
            (await savedState(page)).career?.evaluation?.modelSwitches,
        )
        .toBe(index + 1);
    }

    await expect
      .poll(async () => (await savedState(page)).career?.runEnding?.id)
      .toBe("tutorial-loop");
    await expect(
      page.getByRole("heading", { name: "Run postmortem" }),
    ).toBeVisible();
    for (const label of [
      "Direct causes",
      "Contributing factors",
      "Correlated conditions",
      "Player-visible hypotheses",
      "Unknowns",
    ])
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByText(/Next-run response:/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Restart this scenario" }),
    ).toBeVisible();

    await page.locator("html[data-offline-ready='true']").waitFor({
      timeout: 15_000,
    });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await openCareer(page);
    await expect(
      page.getByRole("heading", { name: "Run postmortem" }),
    ).toBeVisible();
    await context.setOffline(false);

    await page.getByRole("button", { name: "Restart this scenario" }).click();
    await expect(
      page.getByRole("heading", { name: "Evaluation discipline" }),
    ).toBeVisible();
    await expect
      .poll(async () => {
        const saved = await savedState(page);
        return {
          runEnding: saved.career?.runEnding ?? null,
          unlocked: saved.meta?.unlockedDiagnosticIds ?? [],
          completed: saved.meta?.completedEndingIds ?? [],
          replayCount: saved.meta?.replayCount,
        };
      })
      .toEqual({
        runEnding: null,
        unlocked: ["decision-history"],
        completed: ["tutorial-loop"],
        replayCount: 1,
      });
    await expect(
      page.getByRole("heading", { name: "Diagnostic unlocks" }),
    ).toBeVisible();
    await expect(
      page.getByText("Decision history", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/no production multiplier/i).first(),
    ).toBeVisible();
    await assertPortraitControls(page);
  });
});
