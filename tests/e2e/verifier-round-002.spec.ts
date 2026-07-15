import { expect, test, type Page } from "@playwright/test";

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test.describe("verifier round 002 adversarial flows", () => {
  test("restores every player-authored preset field after divergent changes", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");

    await page.getByRole("button", { name: /Robust Evaluation/ }).click();
    await page
      .getByTestId("slot-verify")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: /Shadow evaluation/ }).click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: /Long Document/ }).click();
    await page.getByLabel("Compute budget percentage").fill("45");
    await page.getByLabel("Memory reserve percentage").fill("25");
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await page.getByRole("button", { name: "Save current" }).click();

    await page.getByRole("button", { name: "Build" }).click();
    await page
      .getByRole("button", { name: /Smoke Check/ })
      .last()
      .click();
    await page
      .getByTestId("slot-verify")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: /Shadow evaluation/ }).click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: /Interactive Chat/ }).click();
    await page.getByLabel("Compute budget percentage").fill("100");
    await page.getByLabel("Memory reserve percentage").fill("0");

    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await page.getByRole("button", { name: /Preset 1/ }).click();
    await expect(page.getByTestId("slot-verify")).toContainText(
      "Robust Evaluation",
    );
    await expect(
      page.getByRole("button", { name: /Shadow evaluation/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Jobs" }).click();
    await expect(
      page.getByRole("button", { name: /Long Document/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Compute budget percentage")).toHaveValue(
      "45",
    );
    await expect(page.getByLabel("Memory reserve percentage")).toHaveValue(
      "25",
    );
    expect(errors).toEqual([]);
  });

  test("keeps the worker-backed pipeline operable after an offline reload", async ({
    page,
    context,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: "Queue 10" }).click();
    await page.getByRole("button", { name: "Build" }).click();
    await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();
    await context.setOffline(false);
    expect(errors).toEqual([]);
  });

  test("renders hostile persisted preset names only as inert text", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "goldilocks-pipeline-presets-v1",
        JSON.stringify([
          {
            id: "hostile-name",
            name: '<img src=x onerror="window.__presetXss=true">',
            slots: [
              { slotId: "source", moduleId: "request-buffer" },
              { slotId: "prepare", moduleId: "basic-cleaner" },
              { slotId: "runtime", moduleId: "quantized-model" },
              { slotId: "verify", moduleId: "smoke-check" },
              { slotId: "sink", moduleId: "delivery-gate" },
            ],
            workloadId: "interactive-chat",
            branchEnabled: false,
            computeAllocation: 80,
            memoryReserve: 10,
          },
        ]),
      );
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await expect(page.getByText(/<img src=x onerror=/)).toBeVisible();
    expect(await page.locator("img").count()).toBe(0);
    expect(
      await page.evaluate(
        () => (window as typeof window & { __presetXss?: boolean }).__presetXss,
      ),
    ).not.toBe(true);
    expect(errors).toEqual([]);
  });

  test("keeps every primary view reachable at 200 percent text size", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 742 });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    const failures: Array<{
      view: string;
      client: number;
      scroll: number;
      undersized: number;
      offenders: string[];
    }> = [];
    for (const view of ["Build", "Jobs", "Inspect"] as const) {
      await page.getByRole("button", { name: view, exact: true }).click();
      const dimensions = await page.evaluate(() => {
        const client = document.documentElement.clientWidth;
        return {
          client,
          scroll: document.documentElement.scrollWidth,
          offenders: [...document.querySelectorAll<HTMLElement>("body *")]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.right > client + 0.5 || box.left < -0.5;
            })
            .slice(0, 8)
            .map(
              (element) =>
                `${element.tagName.toLowerCase()}.${element.className || "(no-class)"}`,
            ),
        };
      });
      const undersized = await page.locator("button:visible").evaluateAll(
        (buttons) =>
          buttons.filter((button) => {
            const box = button.getBoundingClientRect();
            return box.width < 44 || box.height < 44;
          }).length,
      );
      if (dimensions.scroll > dimensions.client || undersized > 0) {
        failures.push({ view, undersized, ...dimensions });
      }
    }
    expect(failures).toEqual([]);
  });
});
