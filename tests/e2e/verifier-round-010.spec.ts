import { expect, test, type Page } from "@playwright/test";
import { placeLibraryModule, settleStarterJob } from "./helpers";

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test.describe("verifier round 010 pressure-action boundaries", () => {
  test("offers only reachable memory and thermal remediations at policy and workload minima", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");

    await page.getByRole("button", { name: "Jobs" }).click();
    await settleStarterJob(page);
    await page.getByRole("button", { name: "Build" }).click();
    await placeLibraryModule(
      page,
      "full-model",
      "Full Precision Model",
      "runtime",
    );
    await page.getByRole("button", { name: "Jobs" }).click();
    const warning = page.getByLabel("Current warning and actions");

    await page.getByLabel("Memory reserve percentage").fill("0");
    await page.getByRole("button", { name: /Batch Classification/ }).click();
    await expect(warning).toContainText("Memory limit exceeded");
    await expect(warning).toContainText("Choose lighter compatible modules");
    await expect(warning).not.toContainText("Lower the reserve");
    await expect(warning).not.toContainText("lower-memory workload");

    // Schema-v4 intentionally persists the run. Establish the original
    // minimum-CU thermal boundary explicitly instead of relying on reload to
    // discard the preceding memory configuration.
    await page.getByRole("button", { name: "Build" }).click();
    await placeLibraryModule(
      page,
      "quantized-model",
      "Quantized Model",
      "runtime",
    );
    await expect(page.getByTestId("slot-runtime")).toContainText(
      "Quantized Model",
    );
    await page.getByRole("button", { name: "Jobs" }).click();
    const interactive = page.getByRole("button", { name: /Interactive Chat/ });
    await interactive.click();
    await expect(interactive).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const state = JSON.parse(
            localStorage.getItem("goldilocks-simulation-save-v4") ?? "null",
          ) as { workloadId?: string } | null;
          return state?.workloadId;
        }),
      )
      .toBe("interactive-chat");
    await page.reload();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByLabel("Compute budget percentage").fill("100");
    await expect(warning).toContainText("Thermal throttling");
    await expect(warning).toContainText("Lower compute budget");
    await expect(warning).not.toContainText(
      "choose a workload with lower CU demand",
    );
    await expect(warning).toContainText(
      "Animations control changes visuals only; it does not affect heat or simulation time",
    );

    await page.getByLabel("Compute budget percentage").fill("25");
    await expect(warning).not.toContainText("Thermal throttling");
    expect(errors).toEqual([]);
  });
});
