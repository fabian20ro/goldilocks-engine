import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const BUILD_INFO_MODULE = "virtual:goldilocks-build-info";
const RESOLVED_BUILD_INFO_MODULE = `\0${BUILD_INFO_MODULE}`;
const DEPLOYMENT_INPUTS = [
  "index.html",
  "package.json",
  "package-lock.json",
  "public",
  "src",
  "vite.config.ts",
] as const;

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

function hashDirectory(
  hash: ReturnType<typeof createHash>,
  root: string,
  directory: string,
): void {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  )) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      hashDirectory(hash, root, path);
      continue;
    }
    if (!entry.isFile()) continue;
    hash.update(relative(root, path));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
}

function createDeploymentVersion(root: string, base: string): string {
  const hash = createHash("sha256");
  hash.update("goldilocks-pwa-deployment-v1\0");
  hash.update(normalizeBase(base));
  hash.update("\0");
  hash.update(process.env.GOLDILOCKS_BUILD_MARKER ?? "");
  hash.update("\0");

  for (const input of DEPLOYMENT_INPUTS) {
    const path = resolve(root, input);
    const metadata = statSync(path);
    if (metadata.isDirectory()) hashDirectory(hash, root, path);
    else {
      hash.update(input);
      hash.update("\0");
      hash.update(readFileSync(path));
      hash.update("\0");
    }
  }

  return hash.digest("hex").slice(0, 20);
}

function pwaDeploymentArtifacts(): Plugin {
  let base = "/";
  let buildId = "";
  let serviceWorkerTemplate = "";

  return {
    name: "pwa-deployment-artifacts",
    configResolved(config) {
      base = normalizeBase(config.base);
      buildId = createDeploymentVersion(config.root, base);
      serviceWorkerTemplate = readFileSync(
        resolve(config.root, "src/pwa/service-worker.template.js"),
        "utf8",
      );
    },
    resolveId(id) {
      return id === BUILD_INFO_MODULE ? RESOLVED_BUILD_INFO_MODULE : null;
    },
    load(id) {
      if (id !== RESOLVED_BUILD_INFO_MODULE) return null;
      return `export const APP_VERSION = ${JSON.stringify(buildId)};`;
    },
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .sort()
        .map((file) => `${base}${file}`);
      const cacheName = `goldilocks-shell:${base}:${buildId}`;
      this.emitFile({
        type: "asset",
        fileName: "asset-manifest.json",
        source: JSON.stringify(assets),
      });
      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: JSON.stringify({
          version: buildId,
          scope: base,
          cacheName,
        }),
      });
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: serviceWorkerTemplate
          .replaceAll("__GOLDILOCKS_BUILD_ID__", buildId)
          .replaceAll(
            "__GOLDILOCKS_EXPECTED_ASSETS_JSON__",
            JSON.stringify(assets),
          ),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pwaDeploymentArtifacts()],
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
