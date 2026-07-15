import { hardware } from "./catalog";
import { nextRandom, normalizeSeed } from "./rng";

export type FundingPath =
  | "competition-first"
  | "product-first"
  | "creator-first";
export type PrototypeEnding =
  | "credible-specialist"
  | "sustainable-product"
  | "visible-builder";

export interface PrototypeResult {
  path: FundingPath;
  ending: PrototypeEnding;
  money: number;
  time: number;
  capability: number;
  reliability: number;
  reputation: number;
  reach: number;
  supportLoad: number;
  researchOutcome: "success" | "useful-failure";
  hardwareId: string;
}

const allocations: Record<
  FundingPath,
  { competition: number; product: number; creator: number; maintenance: number }
> = {
  "competition-first": {
    competition: 0.5,
    product: 0.14,
    creator: 0.08,
    maintenance: 0.28,
  },
  "product-first": {
    competition: 0.08,
    product: 0.5,
    creator: 0.12,
    maintenance: 0.3,
  },
  "creator-first": {
    competition: 0.09,
    product: 0.22,
    creator: 0.41,
    maintenance: 0.28,
  },
};

export const prototypeContent = {
  competition: { id: "local-benchmark-cup", privateShift: 0.18, prize: 680 },
  product: { id: "document-helper", revenuePerReliability: 0.32 },
  creatorEvent: {
    id: "weekend-demo-coverage",
    attention: 42,
    supportPerReach: 0.2,
  },
  researchProject: {
    id: "efficient-context-study",
    cost: 140,
    failedWorkValue: 3,
  },
  endings: [
    "credible-specialist",
    "sustainable-product",
    "visible-builder",
  ] as const,
};

export function simulateFundingPath(
  path: FundingPath,
  seed = 41,
): PrototypeResult {
  const allocation = allocations[path];
  let rng = normalizeSeed(seed);
  let money = 760;
  let time = 112;
  let capability = 22;
  let reliability = 48;
  let reputation = 0;
  let reach = 0;
  let supportLoad = 0;
  let researchOutcome: PrototypeResult["researchOutcome"] = "useful-failure";
  let hardwareId = "bedroom-cpu";

  for (let day = 1; day <= 28; day += 1) {
    time -= 2.8;
    capability +=
      allocation.competition * 0.42 +
      allocation.product * 0.23 +
      allocation.maintenance * 0.18;
    reliability +=
      allocation.maintenance * 0.5 +
      allocation.product * 0.16 -
      allocation.creator * 0.08;
    reputation += allocation.competition * 0.55 + allocation.creator * 0.38;
    money +=
      allocation.product *
        reliability *
        prototypeContent.product.revenuePerReliability -
      4.2;

    if (day === 8) {
      reach +=
        allocation.creator * prototypeContent.creatorEvent.attention * 2.3;
      supportLoad += reach * prototypeContent.creatorEvent.supportPerReach;
      reliability -= supportLoad * 0.045;
      money += reach * 0.7;
    }
    if (day === 14) {
      const sample = nextRandom(rng);
      rng = sample.state;
      money -= prototypeContent.researchProject.cost;
      if (sample.value + allocation.competition > 0.55) {
        researchOutcome = "success";
        capability += 8;
      } else {
        capability += prototypeContent.researchProject.failedWorkValue;
        reliability += 2.5;
      }
    }
    if (day === 21 && path === "competition-first") {
      const privateScore =
        capability + reliability * 0.28 - allocation.competition * 8;
      if (privateScore >= 35) money += prototypeContent.competition.prize;
      reputation += privateScore * 0.18;
    }
  }

  if (money > 1450) hardwareId = "workstation-gpu";
  else if (money > 720) hardwareId = "used-gpu";
  const ending: PrototypeEnding =
    path === "competition-first"
      ? "credible-specialist"
      : path === "product-first"
        ? "sustainable-product"
        : "visible-builder";
  return {
    path,
    ending,
    money: Number(Math.max(0, money).toFixed(1)),
    time: Number(Math.max(0, time).toFixed(1)),
    capability: Number(capability.toFixed(1)),
    reliability: Number(Math.max(0, reliability).toFixed(1)),
    reputation: Number(reputation.toFixed(1)),
    reach: Number(reach.toFixed(1)),
    supportLoad: Number(supportLoad.toFixed(1)),
    researchOutcome,
    hardwareId,
  };
}

export function validatePrototype(seed = 41) {
  const results = (Object.keys(allocations) as FundingPath[]).map((path) =>
    simulateFundingPath(path, seed),
  );
  const byPath = Object.fromEntries(
    results.map((result) => [result.path, result]),
  ) as Record<FundingPath, PrototypeResult>;
  const viable = results.every(
    (result) => result.money > 0 && result.time > 0 && result.reliability > 35,
  );
  const noDominantStrategy =
    byPath["competition-first"].reputation >
      byPath["product-first"].reputation &&
    byPath["product-first"].money > byPath["creator-first"].money &&
    byPath["creator-first"].reach > byPath["competition-first"].reach;
  const upgradeTradeoffs = hardware.slice(1).every((upgrade, index) => {
    const prior = hardware[index];
    return Boolean(
      prior &&
        upgrade.compute > prior.compute &&
        upgrade.watts > prior.watts &&
        upgrade.purchaseCost > prior.purchaseCost,
    );
  });
  return { viable, noDominantStrategy, upgradeTradeoffs, results };
}
