import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, root), "utf8");

describe("D-044 verification profiles", () => {
  it("keeps the verifier shell valid and names both profiles", () => {
    const script = read("scripts/verify");
    expect(script).toContain("PROFILE=${VERIFY_PROFILE:-full-release}");
    expect(script).toContain("--profile=development");
    expect(script).toContain("--profile=full-release");
    expect(script).toContain("m7b-commercial-gate=blocked");
    expect(script).toContain("verification=development-candidate");
    execFileSync("sh", ["-n", new URL("scripts/verify", root).pathname]);
  });

  it("keeps full-release as the default and retains every M7B lane", () => {
    const script = read("scripts/verify");
    expect(script).toContain("PROFILE=${VERIFY_PROFILE:-full-release}");
    expect(script).toContain('if [ "$PROFILE" = "development" ]; then');
    expect(script).toContain("run_m7b_lane webkit-browser");
    expect(script).toContain("run_m7b_lane native-accessibility");
    expect(script).toContain("run_m7b_lane mobile-performance");
    expect(script).toContain('if [ "$M7B_BLOCKED" -ne 0 ]; then');
  });
});
