import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void (async () => {
      const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
      const workerUrl = new URL("sw.js", baseUrl);
      await navigator.serviceWorker.register(workerUrl, {
        scope: baseUrl.pathname,
      });
      await navigator.serviceWorker.ready;
      const hasScopedController = () =>
        navigator.serviceWorker.controller !== null &&
        new URL(navigator.serviceWorker.controller.scriptURL).pathname ===
          workerUrl.pathname;
      if (!hasScopedController()) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(
            () => reject(new Error("Service worker control timed out")),
            10_000,
          );
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (hasScopedController()) {
              window.clearTimeout(timeout);
              resolve();
            }
          });
        });
      }
      const cache = await caches.open(
        `goldilocks-shell:${baseUrl.pathname}:v4`,
      );
      const cachedUrls = await cache.keys();
      if (!cachedUrls.length) throw new Error("Offline cache is empty");
      document.documentElement.dataset.offlineReady = "true";
    })().catch(() => {
      document.documentElement.dataset.offlineReady = "false";
    });
  });
}
