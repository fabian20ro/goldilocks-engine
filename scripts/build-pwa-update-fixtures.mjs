import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vite = resolve(root, "node_modules/vite/bin/vite.js");
const outputRoot = resolve(root, ".cache/pwa-update");
const deployments = [
  { name: "root-a", base: "/", marker: "pwa-update-a" },
  { name: "root-b", base: "/", marker: "pwa-update-b" },
  {
    name: "pages-a",
    base: "/goldlocks-engine/",
    marker: "pwa-update-a",
  },
  {
    name: "pages-b",
    base: "/goldlocks-engine/",
    marker: "pwa-update-b",
  },
];

for (const deployment of deployments) {
  const result = spawnSync(
    process.execPath,
    [
      vite,
      "build",
      "--base",
      deployment.base,
      "--outDir",
      resolve(outputRoot, deployment.name),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        GOLDLOCKS_BUILD_MARKER: deployment.marker,
      },
      stdio: "inherit",
    },
  );
  if (result.status !== 0)
    throw new Error(`Fixture build failed for ${deployment.name}`);
}
