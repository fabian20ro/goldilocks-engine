import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5310";
const outputDirectory =
  process.env.OUTPUT_DIR ?? "test-results/round-070-adversarial";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const findings = [];

function finding(id, actual, expected) {
  findings.push({ id, actual, expected });
}

async function freshCareerPage() {
  const context = await browser.newContext({
    viewport: { width: 393, height: 742 },
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Goldilocks Engine" }).waitFor();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  return { context, errors, page };
}

try {
  const { context, errors, page } = await freshCareerPage();
  try {
    await page
      .getByLabel("Show Model tiers and quantization", { exact: true })
      .click();
    const tiers = await page.locator(".career-model-list").innerText();
    for (const expected of [
      "Unlock with $8.00 saved, one competition submission, or one product release.",
      "Unlock with $18.00 saved plus either the competition prize or $8.00 product revenue.",
    ]) {
      if (!tiers.includes(expected)) {
        finding(
          "career-tier-threshold-not-compact",
          tiers,
          `Career model-tier requirement must use the compact cents-default policy: ${expected}`,
        );
        break;
      }
    }

    await page
      .getByLabel("Show Independent conclusion", { exact: true })
      .click();
    const exit = await page.locator(".career-exit").innerText();
    await page.locator(".career-exit").screenshot({
      path: `${outputDirectory}/career-exit-threshold.png`,
    });
    if (!exit.includes("save $24.00")) {
      finding(
        "career-exit-threshold-bypasses-compact-currency",
        exit,
        "The compact Career exit requirement/progress target uses the shared cents-default formatter: save $24.00.",
      );
    }
  } finally {
    if (errors.length > 0) {
      finding(
        "career-threshold-flow-emits-browser-errors",
        errors,
        "Career threshold disclosures render without page or console errors.",
      );
    }
    await context.close();
  }
} catch (error) {
  finding(
    "probe-runtime-error",
    error instanceof Error ? (error.stack ?? error.message) : String(error),
    "The independent Career threshold probe reaches its asserted disclosure state.",
  );
} finally {
  await browser.close();
}

process.stdout.write(`${JSON.stringify({ baseURL, findings }, null, 2)}\n`);
if (findings.length > 0) process.exitCode = 1;
