import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const BACKUP_KEY = "goldilocks-simulation-save-recovery-backup-v1";

async function readSave(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("simulation save missing");
    return JSON.parse(raw) as Record<string, unknown>;
  }, SAVE_KEY);
}

test.describe("verifier round 115 sealed-save lifecycle", () => {
  for (const width of [320, 393]) {
    test(`rejects a stale seal and stays fresh through reload/offline at ${width}px`, async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      await page.setViewportSize({ width, height: 742 });
      await page.goto("/");
      await expect
        .poll(
          () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
          { timeout: 10_000 },
        )
        .not.toBeNull();

      const stale = await readSave(page);
      const resources = stale.resources as Record<string, unknown>;
      resources.money = 42;
      await page.evaluate(
        ({ key, serialized }) => localStorage.setItem(key, serialized),
        { key: SAVE_KEY, serialized: JSON.stringify(stale) },
      );

      await page.reload();
      const status = page.getByTestId("save-recovery-status");
      await expect(status).toContainText("invalid integrity");
      await expect(status).toContainText("Reset: the untrusted saved run");
      await expect(status).toContainText(
        "One bounded raw recovery backup was preserved",
      );
      expect((await readSave(page)).resources).toMatchObject({ money: 0 });

      const backupBeforeReload = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) throw new Error("recovery backup missing");
        return JSON.parse(raw) as { raw: string; truncated: boolean };
      }, BACKUP_KEY);
      expect(backupBeforeReload.truncated).toBe(false);
      expect(backupBeforeReload.raw).toBe(JSON.stringify(stale));

      await expect
        .poll(
          () =>
            page.evaluate(() => document.documentElement.dataset.offlineReady),
          { timeout: 20_000 },
        )
        .toBe("true");
      await page.context().setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: "Goldilocks Engine" }),
      ).toBeVisible();
      expect((await readSave(page)).resources).toMatchObject({ money: 0 });

      const backupAfterOfflineReload = await page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null)
          throw new Error("recovery backup missing after reload");
        return JSON.parse(raw) as { raw: string; truncated: boolean };
      }, BACKUP_KEY);
      expect(backupAfterOfflineReload).toEqual(backupBeforeReload);
      await page.context().setOffline(false);
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
