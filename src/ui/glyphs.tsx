/* eslint-disable react-refresh/only-export-components -- semantic registry intentionally co-locates stable tokens and its renderer */
import type { ReactNode } from "react";

export const glyphs = {
  resource: {
    money: "💵",
    time: "⏱️",
    compute: "⚙️",
    memory: "🧠",
    reputation: "★",
    savings: "🏦",
    electricity: "⚡",
    evidence: "🔎",
  },
  pipeline: {
    input: "📥",
    preparation: "🧹",
    model: "🧠",
    evaluation: "🧪",
    output: "📤",
    empty: "◇",
    bypass: "↷",
  },
  status: {
    active: "●",
    queued: "▥",
    passed: "✓",
    paused: "Ⅱ",
    locked: "🔒",
    owned: "✓",
    equipped: "◆",
    warning: "⚠️",
    failure: "✕",
    directCause: "━",
    contributing: "┄",
    hypothesis: "┈",
    unknown: "?",
  },
  navigation: {
    build: "🛠️",
    jobs: "📋",
    career: "🌙",
    upgrades: "⬆️",
    inspect: "🔬",
    research: "🧭",
  },
  career: {
    freelance: "💼",
    competition: "🏆",
    product: "📦",
    maintenance: "🔧",
  },
  equipment: {
    rig: "🖥️",
    module: "🧩",
    expansion: "↔️",
  },
  workload: {
    interactive: "💬",
    batch: "🗂️",
    document: "📄",
    training: "🏆",
  },
} as const;

export type Glyph =
  | (typeof glyphs.resource)[keyof typeof glyphs.resource]
  | (typeof glyphs.pipeline)[keyof typeof glyphs.pipeline]
  | (typeof glyphs.status)[keyof typeof glyphs.status]
  | (typeof glyphs.navigation)[keyof typeof glyphs.navigation]
  | (typeof glyphs.career)[keyof typeof glyphs.career]
  | (typeof glyphs.equipment)[keyof typeof glyphs.equipment];

export function DecorativeGlyph({ children }: { children: ReactNode }) {
  return (
    <span className="semantic-glyph" aria-hidden="true">
      {children}
    </span>
  );
}

export const navigationItems = [
  ["build", glyphs.navigation.build, "Build"],
  ["jobs", glyphs.navigation.jobs, "Jobs"],
  ["career", glyphs.navigation.career, "Career"],
  ["upgrades", glyphs.navigation.upgrades, "Upgrades"],
  ["inspect", glyphs.navigation.inspect, "Inspect"],
  ["research", glyphs.navigation.research, "Research"],
] as const;

export function pipelineGlyph(role: string, slotType: string): Glyph {
  if (slotType === "source") return glyphs.pipeline.input;
  if (slotType === "sink") return glyphs.pipeline.output;
  if (role === "preparation") return glyphs.pipeline.preparation;
  if (role === "model") return glyphs.pipeline.model;
  if (role === "evaluation") return glyphs.pipeline.evaluation;
  return glyphs.equipment.module;
}

export function careerGlyph(route: string): Glyph {
  if (route === "freelance") return glyphs.career.freelance;
  if (route === "competition") return glyphs.career.competition;
  if (route === "product") return glyphs.career.product;
  return glyphs.career.maintenance;
}

export function workloadGlyph(id: string): string {
  if (id.includes("chat") || id.includes("support"))
    return glyphs.workload.interactive;
  if (id.includes("document") || id.includes("summary"))
    return glyphs.workload.document;
  if (id.includes("competition") || id.includes("training"))
    return glyphs.workload.training;
  return glyphs.workload.batch;
}
