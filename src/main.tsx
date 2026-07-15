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
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(
            () => reject(new Error("Service worker control timed out")),
            10_000,
          );
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              window.clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
        });
      }
      const cache = await caches.open("goldilocks-shell-v2");
      const cachedUrls = await cache.keys();
      if (!cachedUrls.length) throw new Error("Offline cache is empty");
      document.documentElement.dataset.offlineReady = "true";
    })().catch(() => {
      document.documentElement.dataset.offlineReady = "false";
    });
  });
}
