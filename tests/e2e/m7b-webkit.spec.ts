import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";

const navigationLabels = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
] as const;

const KNOWN_WEBKIT_OFFLINE_CONSOLE_MESSAGE =
  "Failed to load resource: WebKit encountered an internal error";

type RawErrorEvent = {
  id: string;
  kind: "pageerror" | "console";
  type: string;
  message: string;
  location: { url: string; lineNumber: number; columnNumber: number } | null;
  pageUrl: string;
  observedAt: number;
  isError: boolean;
  operationId: string | null;
  operation: string | null;
};

type OfflineNavigationError = {
  source: "page.reload";
  operation: "offline-reload";
  message: string;
  errorType: string;
  targetUrl: string;
  pageUrl: string;
};

type OfflineOperation = {
  id: string;
  name: "offline-reload";
  targetUrl: string;
  startedAt: number;
  endedAt: number | null;
  eventIds: string[];
};

type ErrorEvidence = {
  rawEvents: RawErrorEvent[];
  rawErrors: RawErrorEvent[];
  errors: string[];
  operation: OfflineOperation;
  uncorrelatedErrors: RawErrorEvent[];
  correlatedOfflineError: {
    status: "BLOCKED";
    operation: OfflineOperation;
    navigation: OfflineNavigationError;
    console: RawErrorEvent;
    cardinality: { operationErrors: number; exactCandidates: number };
  } | null;
  correlationFailure: Record<string, unknown> | null;
};

function captureErrors(page: Page) {
  const rawEvents: RawErrorEvent[] = [];
  let nextEventId = 1;
  let nextOperationId = 1;
  let activeOperation: OfflineOperation | null = null;

  function record(
    event: Omit<
      RawErrorEvent,
      "id" | "pageUrl" | "observedAt" | "operationId" | "operation"
    >,
  ) {
    const operation = activeOperation;
    const rawEvent: RawErrorEvent = {
      ...event,
      id: `event-${nextEventId++}`,
      pageUrl: page.url(),
      observedAt: Date.now(),
      operationId: operation?.id ?? null,
      operation: operation?.name ?? null,
    };
    rawEvents.push(rawEvent);
    if (operation) operation.eventIds.push(rawEvent.id);
  }

  page.on("pageerror", (error) =>
    record({
      kind: "pageerror",
      type: error.name,
      message: error.message,
      location: null,
      isError: true,
    }),
  );
  page.on("console", (message) =>
    record({
      kind: "console",
      type: message.type(),
      message: message.text(),
      location: message.location(),
      isError: message.type() === "error",
    }),
  );

  function beginOperation(targetUrl: string): OfflineOperation {
    const operation: OfflineOperation = {
      id: `operation-${nextOperationId++}`,
      name: "offline-reload",
      targetUrl,
      startedAt: Date.now(),
      endedAt: null,
      eventIds: [],
    };
    activeOperation = operation;
    return operation;
  }

  function finishOperation(operation: OfflineOperation) {
    if (operation.endedAt === null) {
      if (activeOperation?.id === operation.id) activeOperation = null;
      operation.endedAt = Date.now();
    }
  }

  function evidence(
    operation: OfflineOperation,
    offlineNavigationError: OfflineNavigationError | null,
  ): ErrorEvidence {
    const operationEvents = rawEvents.filter(
      (event) =>
        event.operationId === operation.id &&
        event.observedAt >= operation.startedAt &&
        event.observedAt <= (operation.endedAt ?? Date.now()),
    );
    const operationErrors = operationEvents.filter((event) => event.isError);
    const candidates = operationErrors.filter(
      (event) =>
        event.kind === "console" &&
        event.type === "error" &&
        event.message === KNOWN_WEBKIT_OFFLINE_CONSOLE_MESSAGE &&
        event.pageUrl === operation.targetUrl &&
        (!event.location?.url || event.location.url === operation.targetUrl),
    );
    const navigationMatches =
      offlineNavigationError?.source === "page.reload" &&
      offlineNavigationError.operation === "offline-reload" &&
      offlineNavigationError.targetUrl === operation.targetUrl &&
      offlineNavigationError.message.includes(
        KNOWN_WEBKIT_OFFLINE_CONSOLE_MESSAGE,
      );
    const correlated =
      offlineNavigationError &&
      navigationMatches &&
      operationErrors.length === 1 &&
      candidates.length === 1
        ? {
            status: "BLOCKED" as const,
            operation: { ...operation, eventIds: [...operation.eventIds] },
            navigation: offlineNavigationError,
            console: candidates[0],
            cardinality: {
              operationErrors: operationErrors.length,
              exactCandidates: candidates.length,
            },
          }
        : null;
    const correlatedId = correlated?.console.id ?? null;
    const uncorrelatedErrors = rawEvents.filter(
      (event) => event.isError && event.id !== correlatedId,
    );
    const correlationFailure =
      offlineNavigationError && !correlated
        ? {
            source: "page.reload",
            operationName: "offline-reload",
            reason:
              "offline navigation was not paired with exactly one matching console error in its operation window",
            operation: { ...operation, eventIds: [...operation.eventIds] },
            navigation: offlineNavigationError,
            operationErrorCount: operationErrors.length,
            exactCandidateCount: candidates.length,
          }
        : null;
    return {
      rawEvents: rawEvents.map((event) => ({ ...event })),
      rawErrors: rawEvents
        .filter((event) => event.isError)
        .map((event) => ({ ...event })),
      errors: rawEvents
        .filter((event) => event.isError)
        .map(
          (event) =>
            `${event.kind === "pageerror" ? "page" : "console"}: ${event.message}`,
        ),
      operation: { ...operation, eventIds: [...operation.eventIds] },
      uncorrelatedErrors,
      correlatedOfflineError: correlated,
      correlationFailure,
    };
  }

  return { beginOperation, finishOperation, evidence };
}

async function assertTargetGeometry(page: Page) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  const targets = nav.getByRole("button");
  await expect(targets).toHaveCount(navigationLabels.length);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    ),
    navScrollWidth:
      document.querySelector<HTMLElement>(".bottom-nav")?.scrollWidth,
    navClientWidth:
      document.querySelector<HTMLElement>(".bottom-nav")?.clientWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.navScrollWidth).toBeGreaterThanOrEqual(
    layout.navClientWidth ?? 0,
  );
}

async function assertNavigation(page: Page, width: number) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(
    nav
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
  ).resolves.toEqual([...navigationLabels]);
  await assertTargetGeometry(page);

  if (width === 320) {
    await expect(nav).toHaveAttribute(
      "aria-describedby",
      "primary-nav-overflow-hint",
    );
    await expect(nav).toHaveClass(/has-right-overflow/);
    await expect(nav).toContainText("World");
  }

  // Keyboard activation and the app's state-driven reveal share the same
  // route. The target may start outside the narrow strip's viewport.
  const world = nav.getByRole("button", { name: "World", exact: true });
  await world.focus();
  await page.keyboard.press("Enter");
  await expect(world).toHaveAttribute("aria-current", "page");
  const worldBox = await world.boundingBox();
  const navBox = await nav.boundingBox();
  expect(worldBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  if (!worldBox || !navBox) throw new Error("navigation geometry unavailable");
  expect(worldBox.x).toBeGreaterThanOrEqual(navBox.x - 1);
  expect(worldBox.x + worldBox.width).toBeLessThanOrEqual(
    navBox.x + navBox.width + 1,
  );

  // A real touch-equivalent activation must reveal the same destination.
  await nav.getByRole("button", { name: "Jobs", exact: true }).tap();
  await expect(
    nav.getByRole("button", { name: "Jobs", exact: true }),
  ).toHaveAttribute("aria-current", "page");
}

async function assertOfflineRecovery(
  page: Page,
  context: BrowserContext,
  testInfo: TestInfo,
  errorRecorder: ReturnType<typeof captureErrors>,
): Promise<ErrorEvidence> {
  await page.evaluate(() => {
    localStorage.setItem("m7b-webkit-recovery", "before-reload");
    localStorage.setItem("goldilocks-simulation-save-v4", "{malformed");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.locator("h1", { hasText: "Goldilocks Engine" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

  await expect
    .poll(
      async () =>
        page.evaluate(() => navigator.serviceWorker.controller !== null),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
  const offlineOperation = errorRecorder.beginOperation(page.url());
  let offlineNavigationError: OfflineNavigationError | null = null;
  await context.setOffline(true);
  try {
    try {
      await page.reload({ waitUntil: "commit" });
    } catch (error) {
      // WebKit 26.5 reports a top-level offline reload as an inspector
      // navigation error even while the installed service worker/cache remain
      // usable. Preserve this concrete limitation in the test artifact and
      // prove the cached shell directly instead of hiding the failed attempt.
      offlineNavigationError = {
        source: "page.reload",
        operation: "offline-reload",
        message: String(error),
        errorType: error instanceof Error ? error.name : "Error",
        targetUrl: offlineOperation.targetUrl,
        pageUrl: page.url(),
      };
    }
    await expect(
      page.locator("h1", { hasText: "Goldilocks Engine" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Jobs", exact: true }),
    ).toBeVisible();
    await expect(
      page.evaluate(() => localStorage.getItem("m7b-webkit-recovery")),
    ).resolves.toBe("before-reload");
    const cacheProof = await page.evaluate(async () => {
      const controller = navigator.serviceWorker.controller !== null;
      const names = await caches.keys();
      const shell = await Promise.all(
        names.map(async (name) =>
          (await caches.open(name)).match(location.href),
        ),
      );
      return {
        controller,
        cacheCount: names.length,
        shellCached: shell.some(Boolean),
      };
    });
    expect(cacheProof.controller).toBe(true);
    expect(cacheProof.shellCached).toBe(true);
  } finally {
    errorRecorder.finishOperation(offlineOperation);
    await context.setOffline(false);
  }
  const evidence = errorRecorder.evidence(
    offlineOperation,
    offlineNavigationError,
  );
  await testInfo.attach("m7b-offline-error-evidence.json", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
  if (evidence.correlatedOfflineError)
    testInfo.annotations.push({
      type: "infrastructure",
      description: JSON.stringify(evidence.correlatedOfflineError),
    });
  return evidence;
}

test.describe("M7B pinned WebKit OIV matrix", () => {
  for (const viewport of [
    { width: 393, height: 742, name: "393x742 normal" },
    { width: 320, height: 693, name: "320x693 boundary" },
  ]) {
    test(`${viewport.name} covers reduced motion, 200% text, interaction, reload/offline, and recovery`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport,
      });
      const page = await context.newPage();
      const errors = captureErrors(page);
      try {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await expect(
          page.locator("h1", { hasText: "Goldilocks Engine" }),
        ).toBeVisible();
        await expect(page.locator(".app-shell")).toHaveClass(/motion-reduced/);
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          )
          .toBe(true);
        await assertNavigation(page, viewport.width);
        const evidence = await assertOfflineRecovery(
          page,
          context,
          test.info(),
          errors,
        );
        expect(evidence.correlationFailure).toBeNull();
        expect(evidence.uncorrelatedErrors).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
});
