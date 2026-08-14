import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function reseal(state: Record<string, unknown>): string {
  const payload = { ...state };
  delete payload.integrity;
  const serialized = JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  const digest = (hash >>> 0).toString(16).padStart(8, "0");
  return JSON.stringify({
    ...state,
    integrity: { algorithm: "fnv1a-32-json-v1", digest },
  });
}

async function seedUnlockedLaboratory(page: Page) {
  const serialized = await page.evaluate(
    (key) => localStorage.getItem(key),
    SAVE_KEY,
  );
  if (!serialized) throw new Error("Expected the initial simulation save");
  const state = JSON.parse(serialized) as Record<string, unknown>;
  const lab = state.laboratory as Record<string, unknown>;
  state.laboratory = {
    ...lab,
    unlocked: true,
    unlockedAtTick: 0,
    scenarioId: "limited-hardware",
    scenarioUnlockIds: ["limited-hardware"],
    scenarioProgress: {
      ...(lab.scenarioProgress as Record<string, number>),
      "limited-hardware": 1,
    },
  };
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  const context = page.context();
  await page.close();
  await context.addInitScript(
    ({ key, saved }) => {
      if (sessionStorage.getItem("laboratory-seed-installed") === "1") return;
      localStorage.setItem(key, saved);
      sessionStorage.setItem("laboratory-seed-installed", "1");
    },
    { key: SAVE_KEY, saved: reseal(state) },
  );
  const restored = await context.newPage();
  await restored.setViewportSize(viewport);
  await restored.goto("/");
  return restored;
}

test("Local Laboratory is reachable, persistent, and usable at portrait widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Lab", exact: true }),
  ).toBeVisible();

  page = await seedUnlockedLaboratory(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const labTab = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Lab", exact: true });
  await labTab.click();
  await expect(
    page.getByRole("heading", { name: "Local Laboratory" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Machines" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipelines" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Choose what the lab becomes" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Document the current method" })
    .click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          laboratory?: { reproducibility?: { documentedRuns?: number } };
        } | null;
        return saved?.laboratory?.reproducibility?.documentedRuns ?? 0;
      }, SAVE_KEY),
    )
    .toBe(1);
  await page.reload();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Lab", exact: true })
    .click();
  await expect(page.getByText("1 documented", { exact: true })).toBeVisible();

  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 742 });
    await expect(
      page.getByRole("heading", { name: "Local Laboratory" }),
    ).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const scaledLayout = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(scaledLayout.scrollWidth).toBeLessThanOrEqual(scaledLayout.width + 1);
});
