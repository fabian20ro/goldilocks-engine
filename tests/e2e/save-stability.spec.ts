import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const RECOVERY_BACKUP_KEY = "goldilocks-simulation-save-recovery-backup-v1";
const RECOVERY_STATUS_KEY = "goldilocks-simulation-save-recovery-status-v1";

type Fixture = {
  payload: Record<string, unknown>;
};

const evaluationFixture = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "fixtures/save-fixtures/schema-7-evaluation-replay-1.json",
    ),
    "utf8",
  ),
) as Fixture;
const localLabFixture = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "fixtures/save-fixtures/schema-7-local-lab-1.json"),
    "utf8",
  ),
) as Fixture;
async function seedSave(page: Page, value: string): Promise<void> {
  await page.addInitScript(
    ({ key, serialized }) => {
      localStorage.clear();
      localStorage.setItem(key, serialized);
    },
    { key: SAVE_KEY, serialized: value },
  );
}

async function savedState(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("save was not persisted");
    return JSON.parse(raw) as Record<string, unknown>;
  }, SAVE_KEY);
}

test.describe("M7D save stability", () => {
  for (const width of [320, 393]) {
    test(`migrates a supported sealed save at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 742 });
      await seedSave(page, JSON.stringify(evaluationFixture.payload));
      await page.goto("/");

      await expect(page.getByTestId("save-recovery-status")).toContainText(
        "content generation migration",
      );
      await expect(
        page.getByRole("heading", { name: "Goldilocks Engine" }),
      ).toBeVisible();
      await expect
        .poll(async () => (await savedState(page)).contentVersion)
        .toBe("local-lab-1");

      const restored = await savedState(page);
      const source = evaluationFixture.payload;
      const sourceJobs = source.jobs as Record<string, unknown>;
      const restoredJobs = restored.jobs as Record<string, unknown>;
      const sourceResources = source.resources as Record<string, unknown>;
      const restoredResources = restored.resources as Record<string, unknown>;
      expect(restored.schemaVersion).toBe(7);
      expect(restored.seed).toBe(source.seed);
      expect(restored.rngState).toBe(source.rngState);
      expect(restoredJobs.queued).toBe(sourceJobs.queued);
      expect(restoredResources.money).toBe(sourceResources.money);
      expect(restoredResources.reputation).toBe(sourceResources.reputation);
      expect(
        await page.evaluate(
          (key) => localStorage.getItem(key),
          RECOVERY_BACKUP_KEY,
        ),
      ).not.toBeNull();
    });
  }

  test("recovers malformed and tampered saves with one bounded raw backup", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 742 });
    await seedSave(page, "{malformed save");
    await page.goto("/");
    await expect(page.getByTestId("save-recovery-status")).toContainText(
      "malformed save",
    );
    const malformedBackup = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw === null
        ? null
        : (JSON.parse(raw) as { raw: string; truncated: boolean });
    }, RECOVERY_BACKUP_KEY);
    expect(malformedBackup).toMatchObject({
      raw: "{malformed save",
      truncated: false,
    });
    await page.getByRole("button", { name: "Dismiss recovery note" }).click();
    await expect(page.getByTestId("save-recovery-status")).toHaveCount(0);

    await page.close();
    const tamperedPage = await page.context().newPage();
    await tamperedPage.setViewportSize({ width: 320, height: 742 });
    const tampered = JSON.parse(
      JSON.stringify(localLabFixture.payload),
    ) as Record<string, unknown>;
    tampered.firstSession = {
      step: "complete",
      starterTaskId: "forged",
      observedSettlementTaskId: "forged",
      purchasedModuleId: "precision-cleaner",
    };
    delete tampered.integrity;
    await tamperedPage.addInitScript(
      ({ key, serialized, statusKey }) => {
        localStorage.clear();
        localStorage.removeItem(statusKey);
        localStorage.setItem(key, serialized);
      },
      {
        key: SAVE_KEY,
        serialized: JSON.stringify(tampered),
        statusKey: RECOVERY_STATUS_KEY,
      },
    );
    await tamperedPage.goto("/");
    await expect(
      tamperedPage.getByTestId("save-recovery-status"),
    ).toContainText("invalid integrity");
    await expect(
      tamperedPage.getByTestId("save-recovery-status"),
    ).toContainText("One bounded raw recovery backup was preserved");
    expect((await savedState(tamperedPage)).firstSession).toMatchObject({
      step: "queue-starter",
    });
  });

  test("resets an unsealed save through reload and an offline PWA reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await expect
      .poll(
        async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
        { timeout: 10_000 },
      )
      .not.toBeNull();
    const persisted = await savedState(page);
    delete persisted.integrity;
    const staleResources = persisted.resources as Record<string, unknown>;
    staleResources.money = 3;
    await page.evaluate(
      ({ key, serialized }) => localStorage.setItem(key, serialized),
      { key: SAVE_KEY, serialized: JSON.stringify(persisted) },
    );
    await page.reload();
    await expect(page.getByTestId("save-recovery-status")).toContainText(
      "invalid integrity",
    );
    await expect(page.getByTestId("save-recovery-status")).toContainText(
      "Reset: the untrusted saved run",
    );
    await expect(page.getByTestId("save-recovery-status")).toContainText(
      "One bounded raw recovery backup was preserved",
    );
    expect((await savedState(page)).resources).toMatchObject({ money: 0 });

    await page.reload();
    await expect(page.getByTestId("save-recovery-status")).toBeVisible();
    await expect
      .poll(
        async () =>
          page.evaluate(() => document.documentElement.dataset.offlineReady),
        {
          timeout: 20_000,
        },
      )
      .toBe("true");

    await page.context().setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Goldilocks Engine" }),
    ).toBeVisible();
    expect((await savedState(page)).schemaVersion).toBe(7);
    await page.context().setOffline(false);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Goldilocks Engine" }),
    ).toBeVisible();
    expect((await savedState(page)).schemaVersion).toBe(7);
  });
});
