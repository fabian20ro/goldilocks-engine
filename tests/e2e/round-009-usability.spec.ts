import { expect, test, type Page } from "@playwright/test";

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function openInspect(page: Page) {
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Configurations" }),
  ).toBeVisible();
}

test.describe("round 009 first-session comprehension", () => {
  test("persists tutorial dismissal and always reopens exact mechanics from Help", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");

    const tutorial = page.getByTestId("quick-start");
    await expect(tutorial).toBeVisible();
    await expect(tutorial).toContainText("A failed job earns no gross payout");
    await expect(tutorial).toContainText(
      "Gross per success: Interactive Chat $1.40",
    );
    await expect(tutorial).toContainText("CU means normalized Compute Units");
    await expect(tutorial).toContainText(
      "Memory reserve is RAM deliberately held back",
    );
    await expect(tutorial).toContainText(
      "Hardware purchasing is a Milestone 2 feature",
    );
    await expect(tutorial).toContainText(
      "Animations is visual only and never changes simulation time",
    );
    await expect(tutorial).toContainText(
      "use its labeled Delete button, confirm, then Undo",
    );

    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await expect(tutorial).toHaveCount(0);
    await page.reload();
    await expect(tutorial).toHaveCount(0);

    const help = page.getByRole("button", { name: "Help / Quick start" });
    const helpBox = await help.boundingBox();
    expect(helpBox?.height).toBeGreaterThanOrEqual(44);
    await help.click();
    await expect(tutorial).toBeVisible();
  });

  test("shows the complete money loop and earned-money settlement", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: "Jobs" }).click();

    await expect(page.getByLabel("Money loop")).toContainText(
      "Choose→2 Queue→3 Run→4 Complete→5 Payout",
    );
    await expect(page.getByText("No payout yet — queue a job.")).toBeVisible();
    await expect(
      page.getByText(/Interactive Chat.*\$1\.40 gross/, { exact: false }),
    ).toBeVisible();
    await page.getByRole("button", { name: "16×" }).click();
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();

    await expect(page.getByText(/1 paid · 0 failed/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText(/Run totals: \$1\.40 gross earned/),
    ).toBeVisible();
    await openInspect(page);
    await expect(
      page.getByText(/gross payout earned before operating cost/),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("deletes presets only after confirmation, supports undo, and persists both outcomes", async ({
    page,
  }) => {
    await page.goto("/");
    await openInspect(page);
    await page.getByRole("button", { name: "Save current" }).click();
    const loadPreset = page.getByRole("button", { name: "Load Preset 1" });
    await expect(loadPreset).toBeVisible();

    await page.getByRole("button", { name: "Delete Preset 1" }).click();
    await expect(
      page.getByRole("group", { name: "Confirm deletion of Preset 1" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(loadPreset).toBeVisible();

    await page.getByRole("button", { name: "Delete Preset 1" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await expect(loadPreset).toHaveCount(0);
    await page.getByRole("button", { name: "Undo delete" }).click();
    await expect(loadPreset).toBeVisible();
    await page.reload();
    await openInspect(page);
    await expect(loadPreset).toBeVisible();

    await page.getByRole("button", { name: "Delete Preset 1" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await page.reload();
    await openInspect(page);
    await expect(loadPreset).toHaveCount(0);
  });

  test("defines CU and memory accounting and keeps hardware purchases honestly locked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Jobs" }).click();

    await expect(
      page.getByText("CU = normalized Compute Units."),
    ).toBeVisible();
    await expect(
      page.getByText(/Current memory: .* GB used \/ .* GB rig capacity/),
    ).toBeVisible();
    await expect(
      page.getByText(/GB is reserved, leaving .* GB usable/),
    ).toBeVisible();
    await expect(page.getByText("HARDWARE SHOP LOCKED")).toBeVisible();
    await expect(
      page.getByText(/Hardware purchasing belongs to Milestone 2/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Used 12 GB GPU|24 GB Workstation/ }),
    ).toHaveCount(0);
  });

  test("gives pressure-specific memory and thermal actions without false certainty", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await page.locator('.module-library [data-module-id="full-model"]').click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: /Long Document/ }).click();
    const warning = page.getByLabel("Current warning and actions");
    await expect(warning).toContainText("only");
    await expect(warning).toContainText("lighter compatible modules");
    await expect(warning).toContainText(
      "the warning does not assume one sole cause",
    );

    await page.reload();
    await page
      .locator('.module-library [data-module-id="smoke-check"]')
      .click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByLabel("Memory reserve percentage").fill("0");
    await page.getByLabel("Compute budget percentage").fill("100");
    await page.getByRole("button", { name: /Competition Training/ }).click();
    await expect(warning).toContainText("Lower compute budget");
    await expect(warning).toContainText(
      "Module swaps mainly change memory, throughput, quality, and reliability in this toy—not heat directly",
    );
    await expect(warning).toContainText(
      "Throttling is predicted, not a certain hardware fault",
    );
  });

  test("keeps animation visual-only while bounded fast-forward advances work", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.getByText("Visual only", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "1×" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Animations on" }).click();
    await expect(
      page.getByRole("button", { name: "Animations off" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "1×" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "16×" }).click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect(page.getByText(/1 paid · 0 failed/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: "16×" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    expect(
      await page
        .getByRole("group", { name: "Time speed" })
        .getByRole("button")
        .allTextContents(),
    ).toEqual(["1×", "4×", "16×"]);
  });
});
