// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { DetailsSurface, StatusGauge } from "./commandDeck";
import {
  glyphs,
  navigationItems,
  pipelineGlyph,
  workloadGlyph,
} from "./glyphs";

function DetailsHarness() {
  const [item, setItem] = useState<"cleaner" | "model" | null>(null);
  const cleanerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={cleanerRef} type="button" onClick={() => setItem("cleaner")}>
        Basic Cleaner
      </button>
      <button type="button" onClick={() => setItem("model")}>
        Quantized Model
      </button>
      {item ? (
        <DetailsSurface
          title={item === "cleaner" ? "Basic Cleaner" : "Quantized Model"}
          glyph={
            item === "cleaner"
              ? glyphs.pipeline.preparation
              : glyphs.pipeline.model
          }
          onClose={() => setItem(null)}
          returnFocus={item === "cleaner" ? cleanerRef : undefined}
        >
          Live catalogue value: {item === "cleaner" ? "4 GB" : "6 GB"}
        </DetailsSurface>
      ) : null}
    </>
  );
}

describe("emoji command-deck primitives", () => {
  it("reuses central semantic glyphs across navigation, pipeline, and workloads", () => {
    expect(navigationItems.map((item) => item[1])).toEqual([
      glyphs.navigation.build,
      glyphs.navigation.jobs,
      glyphs.navigation.career,
      glyphs.navigation.upgrades,
      glyphs.navigation.inspect,
    ]);
    expect(pipelineGlyph("model", "process")).toBe(glyphs.pipeline.model);
    expect(pipelineGlyph("model", "process")).toBe(
      pipelineGlyph("model", "process"),
    );
    expect(workloadGlyph("interactive-chat")).toBe(glyphs.workload.interactive);
  });

  it("replaces item details, closes with Escape, and restores origin focus", () => {
    render(<DetailsHarness />);
    const cleaner = screen.getByRole("button", { name: "Basic Cleaner" });
    fireEvent.click(cleaner);
    expect(screen.getByLabelText("Basic Cleaner details")).toHaveTextContent(
      "Live catalogue value: 4 GB",
    );

    fireEvent.click(screen.getByRole("button", { name: "Quantized Model" }));
    expect(screen.queryByLabelText("Basic Cleaner details")).toBeNull();
    expect(screen.getByLabelText("Quantized Model details")).toHaveTextContent(
      "Live catalogue value: 6 GB",
    );

    fireEvent.click(cleaner);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByLabelText("Basic Cleaner details")).toBeNull();
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(cleaner).toHaveFocus();
        resolve();
      });
    });
  });

  it("exposes a text label and meter value without relying on color", () => {
    render(
      <StatusGauge
        label="Thermal pressure"
        value={108}
        display="108%"
        tone="failure"
      />,
    );
    expect(screen.getByText("Thermal pressure")).toBeVisible();
    expect(
      screen.getByRole("meter", { name: "Thermal pressure" }),
    ).toHaveAttribute("aria-valuenow", "100");
  });
});
