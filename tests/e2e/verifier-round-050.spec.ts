import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type SeededPage = {
  auditKey: string;
  context: BrowserContext;
  marker: string;
  page: Page;
};

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function waitForSave(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function waitForGuideStep(page: Page, step: string) {
  await expect(page.getByTestId("first-session-guide")).toContainText(step);
}

async function preparePurchaseStep(page: Page) {
  await page.goto("/");
  await waitForSave(page);
  await waitForGuideStep(page, "step 1 of 3");
  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await waitForGuideStep(page, "step 2 of 3");
  await page.getByRole("button", { name: "64×" }).click();
  await waitForGuideStep(page, "step 3 of 3");
}

async function openPrebootSeed(
  browser: Browser,
  saved: string,
  viewport: { height: number; width: number },
  name: string,
): Promise<SeededPage> {
  const context = await browser.newContext({
    viewport,
    serviceWorkers: "allow",
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  const marker = `verifier-round-050-${name}-seeded`;
  const auditKey = `verifier-round-050-${name}-serialized`;
  await context.addInitScript(
    ({ auditKey, key, marker, saved }) => {
      if (sessionStorage.getItem(marker) === "seeded") return;
      localStorage.setItem(key, saved);
      // Preserve the exact state observed by the app's boot boundary. This
      // prevents a clean fresh context from falsely satisfying recovery checks.
      sessionStorage.setItem(auditKey, localStorage.getItem(key) ?? "");
      sessionStorage.setItem(marker, "seeded");
    },
    { auditKey, key: SAVE_KEY, marker, saved },
  );
  const page = await context.newPage();
  return { auditKey, context, marker, page };
}

async function expectPrebootSeed(
  page: Page,
  auditKey: string,
  marker: string,
  saved: string,
) {
  expect(
    await page.evaluate(
      ({ auditKey, marker }) => ({
        audit: sessionStorage.getItem(auditKey),
        marker: sessionStorage.getItem(marker),
      }),
      { auditKey, marker },
    ),
  ).toEqual({ audit: saved, marker: "seeded" });
}

function observeErrors(page: Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
}

for (const viewport of [
  { height: 693, width: 320 },
  { height: 742, width: 393 },
]) {
  test(`verifier round 050: one-shot preboot expansion seed is consumed at ${viewport.width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    observeErrors(page, errors);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForSave(page);
    const saved = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = 45;
      return JSON.stringify(state);
    }, SAVE_KEY);

    // Match the candidate's same-context repair: the source Worker is closed
    // before a one-shot fixture can reach the next application boot.
    const context = page.context();
    await page.close();
    const marker = `verifier-round-050-expansion-${viewport.width}-seeded`;
    const auditKey = `verifier-round-050-expansion-${viewport.width}-serialized`;
    await context.addInitScript(
      ({ auditKey, key, marker, saved }) => {
        if (sessionStorage.getItem(marker) === "seeded") return;
        localStorage.setItem(key, saved);
        sessionStorage.setItem(auditKey, localStorage.getItem(key) ?? "");
        sessionStorage.setItem(marker, "seeded");
      },
      { auditKey, key: SAVE_KEY, marker, saved },
    );
    page = await context.newPage();
    await page.setViewportSize(viewport);
    observeErrors(page, errors);
    await page.goto("/");
    await waitForSave(page);
    await expectPrebootSeed(page, auditKey, marker, saved);
    expect(
      await page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          resources: { money: number };
        };
        return state.resources.money;
      }, SAVE_KEY),
    ).toBe(45);

    await openTab(page, "Upgrades");
    await page
      .getByRole("button", {
        name: "Buy Workstation Expansion I for $45.00",
      })
      .click();
    await page
      .getByRole("button", { name: "Activate six-position pipeline" })
      .click();
    await openTab(page, "Build");
    await expect(
      page.getByTestId("pipeline").locator(".pipeline-slot"),
    ).toHaveCount(8);
    await page.reload();
    await waitForSave(page);
    await expectPrebootSeed(page, auditKey, marker, saved);
    await expect(
      page.getByTestId("pipeline").locator(".pipeline-slot"),
    ).toHaveCount(8);
    const state = await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
        activeExpansionId: string | null;
        resources: { money: number };
      };
      return saved;
    }, SAVE_KEY);
    expect(state.resources.money).toBe(0);
    expect(state.activeExpansionId).toBe("workstation-expansion-i");
    const overflow = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    expect(errors).toEqual([]);
  });
}

test("verifier round 050: an audited forged completion fails closed through a real reload", async ({
  browser,
  page,
}) => {
  const errors: string[] = [];
  observeErrors(page, errors);
  await page.setViewportSize({ height: 742, width: 393 });
  await preparePurchaseStep(page);
  const forged = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: {
        observedSettlementTaskId: string | null;
        purchasedModuleId: string | null;
        starterTaskId: string | null;
        step: string;
      };
      ownedModuleIds: string[];
      slots: { moduleId: string | null; slotId: string }[];
    };
    state.ownedModuleIds = [...state.ownedModuleIds, "precision-cleaner"];
    state.slots = state.slots.map((slot) =>
      slot.slotId === "prepare"
        ? { ...slot, moduleId: "precision-cleaner" }
        : slot,
    );
    state.firstSession = {
      step: "complete",
      starterTaskId: state.firstSession.starterTaskId,
      observedSettlementTaskId: state.firstSession.observedSettlementTaskId,
      purchasedModuleId: "precision-cleaner",
    };
    return JSON.stringify(state);
  }, SAVE_KEY);

  const restored = await openPrebootSeed(
    browser,
    forged,
    { height: 742, width: 393 },
    "forged-completion",
  );
  try {
    observeErrors(restored.page, errors);
    await restored.page.goto("/");
    await waitForSave(restored.page);
    await expectPrebootSeed(
      restored.page,
      restored.auditKey,
      restored.marker,
      forged,
    );
    await waitForGuideStep(restored.page, "step 1 of 3");
    expect(
      await restored.page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession: { step: string };
          ownedModuleIds: string[];
          resources: { money: number };
        };
        return state;
      }, SAVE_KEY),
    ).toMatchObject({
      firstSession: { step: "queue-starter" },
      ownedModuleIds: expect.not.arrayContaining(["precision-cleaner"]),
      resources: { money: 0 },
    });
    await openTab(restored.page, "Jobs");
    await expect(
      restored.page.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(0);
    await restored.page.reload();
    await waitForSave(restored.page);
    await waitForGuideStep(restored.page, "step 1 of 3");
    await openTab(restored.page, "Jobs");
    await expect(
      restored.page.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(0);
  } finally {
    await restored.context.close();
  }
  expect(errors).toEqual([]);
});

test("verifier round 050: audited paid completion survives stale-save recovery without another deduction", async ({
  browser,
  page,
}) => {
  const errors: string[] = [];
  observeErrors(page, errors);
  await page.setViewportSize({ height: 742, width: 393 });
  await preparePurchaseStep(page);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const money = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      return state.resources.money;
    }, SAVE_KEY);
    if (money >= 4) break;
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs: { queued: number };
          };
          return state.jobs.queued;
        }, SAVE_KEY),
      )
      .toBe(0);
  }
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
    .click();
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("first-session-guide")).toHaveCount(0);
  const stale = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      lastUpgradeNotice: unknown;
    };
    state.lastUpgradeNotice = null;
    return JSON.stringify(state);
  }, SAVE_KEY);
  const expected = JSON.parse(stale) as {
    ledger: { kind: string; message: string }[];
    resources: { money: number };
  };
  const expectedPurchaseEvents = expected.ledger.filter(
    (event) =>
      event.kind === "success" &&
      event.message ===
        "Precision Cleaner purchased for $4.000 and is now owned. Add it to a compatible process slot in Build; purchase deducted exactly once.",
  ).length;
  expect(expectedPurchaseEvents).toBe(1);

  const restored = await openPrebootSeed(
    browser,
    stale,
    { height: 742, width: 393 },
    "paid-completion",
  );
  try {
    observeErrors(restored.page, errors);
    await restored.page.goto("/");
    await waitForSave(restored.page);
    await expectPrebootSeed(
      restored.page,
      restored.auditKey,
      restored.marker,
      stale,
    );
    await expect(restored.page.getByTestId("first-session-guide")).toHaveCount(
      0,
    );
    const assertCompletedState = async () => {
      const state = await restored.page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession: { step: string };
          ledger: { kind: string; message: string }[];
          ownedModuleIds: string[];
          resources: { money: number };
          slots: { moduleId: string | null; slotId: string }[];
        };
        return state;
      }, SAVE_KEY);
      expect(state.firstSession.step).toBe("complete");
      expect(state.resources.money).toBe(expected.resources.money);
      expect(state.ownedModuleIds).toContain("precision-cleaner");
      expect(
        state.slots.find((slot) => slot.slotId === "prepare")?.moduleId,
      ).toBe("precision-cleaner");
      expect(
        state.ledger.filter(
          (event) =>
            event.kind === "success" &&
            event.message ===
              "Precision Cleaner purchased for $4.000 and is now owned. Add it to a compatible process slot in Build; purchase deducted exactly once.",
        ),
      ).toHaveLength(1);
    };
    await assertCompletedState();
    await openTab(restored.page, "Jobs");
    await expect(
      restored.page.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(1);
    await restored.page.reload();
    await waitForSave(restored.page);
    await expect(restored.page.getByTestId("first-session-guide")).toHaveCount(
      0,
    );
    await assertCompletedState();
  } finally {
    await restored.context.close();
  }
  expect(errors).toEqual([]);
});
