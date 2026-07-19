/* global Buffer, URL, console, fetch, process */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const base = new URL(
  process.argv[2] ?? "https://fabian20ro.github.io/goldlocks-engine/",
);
const dist = process.argv[3] ?? "dist";
const scope = new URL("./", base).pathname;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function localFile(pathname) {
  if (pathname === scope) return join(dist, "index.html");
  if (!pathname.startsWith(scope))
    throw new Error(`Path escapes expected scope: ${pathname}`);
  return join(dist, pathname.slice(scope.length));
}

async function comparedPath(pathname) {
  const local = await readFile(localFile(pathname));
  const response = await fetch(new URL(pathname.slice(scope.length), base));
  if (!response.ok)
    throw new Error(`Public ${pathname} returned HTTP ${response.status}`);
  const remote = Buffer.from(await response.arrayBuffer());
  const localDigest = sha256(local);
  const remoteDigest = sha256(remote);
  if (localDigest !== remoteDigest)
    throw new Error(
      `Public mismatch for ${pathname}: ${localDigest} != ${remoteDigest}`,
    );
  return { pathname, sha256: localDigest };
}

const manifest = JSON.parse(
  await readFile(join(dist, "asset-manifest.json"), "utf8"),
);
if (
  !Array.isArray(manifest) ||
  manifest.some((entry) => typeof entry !== "string")
)
  throw new Error("Local asset manifest is not a string array");

const fixedPaths = [
  scope,
  `${scope}manifest.webmanifest`,
  `${scope}icon.svg`,
  `${scope}build-info.json`,
  `${scope}asset-manifest.json`,
  `${scope}sw.js`,
];
const paths = [...new Set([...fixedPaths, ...manifest])].sort();
const compared = await Promise.all(paths.map(comparedPath));
const buildInfo = JSON.parse(
  await readFile(join(dist, "build-info.json"), "utf8"),
);

console.log(
  JSON.stringify(
    {
      base: base.toString(),
      buildInfo,
      files: compared,
    },
    null,
    2,
  ),
);
