import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  dependencies?: Readonly<Record<string, string>>;
  devDependencies?: Readonly<Record<string, string>>;
}

interface PackageLock {
  packages?: Readonly<
    Record<
      string,
      {
        dev?: boolean;
      }
    >
  >;
}

function readManifest(): PackageManifest {
  return JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  ) as PackageManifest;
}

function readLock(): PackageLock {
  return JSON.parse(
    readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8"),
  ) as PackageLock;
}

describe("production dependency boundary", () => {
  it("keeps browser runtime packages separate from Vite build tooling", () => {
    const manifest = readManifest();
    const runtimeDependencies = manifest.dependencies ?? {};
    const buildDependencies = manifest.devDependencies ?? {};

    expect(runtimeDependencies).toMatchObject({
      react: "19.0.0",
      "react-dom": "19.0.0",
    });
    for (const packageName of ["vite", "@vitejs/plugin-react"]) {
      expect(runtimeDependencies).not.toHaveProperty(packageName);
      expect(buildDependencies).toHaveProperty(packageName);
    }

    const packages = readLock().packages;
    expect(packages?.["node_modules/vite"]?.dev).toBe(true);
    expect(packages?.["node_modules/@vitejs/plugin-react"]?.dev).toBe(true);
  });

  it("uses Vite only in build configuration, not the browser entrypoint", () => {
    const browserEntry = readFileSync(
      new URL("../main.tsx", import.meta.url),
      "utf8",
    );
    const buildConfig = readFileSync(
      new URL("../../vite.config.ts", import.meta.url),
      "utf8",
    );

    expect(browserEntry).toContain('from "react"');
    expect(browserEntry).toContain('from "react-dom/client"');
    expect(browserEntry).not.toMatch(/(?:vite|@vitejs\/plugin-react)/);
    expect(buildConfig).toContain('from "vite"');
    expect(buildConfig).toContain('from "@vitejs/plugin-react"');
  });
});
