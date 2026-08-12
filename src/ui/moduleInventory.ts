import { getSlot, modules } from "../simulation/catalog";
import type {
  ModuleSpec,
  SimulationState,
  SlotType,
} from "../simulation/types";

/**
 * Build and Upgrades show the same durable module catalogue.  Keep its live
 * ownership, affordability, and selected-slot compatibility in one small
 * selector instead of allowing the two views to drift.
 */
export type ModuleInventorySectionId = "owned" | "available" | "locked";

export interface ModuleInventoryEntry {
  module: ModuleSpec;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  compatibleWithSelectedStage: boolean;
  requirement: string;
}

export interface ModuleInventorySection {
  id: ModuleInventorySectionId;
  label: string;
  entries: readonly ModuleInventoryEntry[];
}

export interface ModuleInventoryOptions {
  /**
   * Build's selected-stage drawer needs an unplaced next-placement cue after
   * its installed module and other compatible choices. Upgrades is the
   * durable catalogue, so its paid-owned handoff remains first there.
   */
  prioritizeUnplacedOwned?: boolean;
}

const sectionOrder: readonly ModuleInventorySectionId[] = [
  "owned",
  "available",
  "locked",
];

const sectionLabels: Record<ModuleInventorySectionId, string> = {
  owned: "Owned",
  available: "Affordable / available",
  locked: "Locked",
};

function selectedSlotType(
  state: SimulationState,
  selectedStageId: string | null,
): SlotType | null {
  const selected = state.slots.find((slot) => slot.slotId === selectedStageId);
  return selected ? getSlot(selected.slotId).type : null;
}

function installedIn(
  state: SimulationState,
  moduleId: string,
): readonly string[] {
  return state.slots
    .filter((slot) => slot.moduleId === moduleId)
    .map((slot) => getSlot(slot.slotId).name);
}

function requirementFor({
  module,
  owned,
  equippedIn,
  compatibleWithSelectedStage,
  selectedStageName,
  affordable,
  money,
}: {
  module: ModuleSpec;
  owned: boolean;
  equippedIn: readonly string[];
  compatibleWithSelectedStage: boolean;
  selectedStageName: string | null;
  affordable: boolean;
  money: number;
}): string {
  if (owned) {
    const installed =
      equippedIn.length > 0 ? `Equipped in ${equippedIn.join(", ")}. ` : "";
    if (selectedStageName)
      return `${installed}Owned · ${compatibleWithSelectedStage ? "compatible with" : "not compatible with"} ${selectedStageName}.`;
    return `${installed}Owned and ready to place.`;
  }

  if (affordable)
    return `Available now for $${module.purchaseCost.toFixed(2)} in Upgrades.`;

  return `Need $${Math.max(0, module.purchaseCost - money).toFixed(2)} more for $${module.purchaseCost.toFixed(2)}.`;
}

/**
 * Current catalogue sections for the two proven consumers: Build's selected
 * stage and Upgrades' compact store.  Passing no stage keeps every item
 * available for comparison while Build passes its actively selected slot.
 */
export function selectModuleInventory(
  state: SimulationState,
  selectedStageId: string | null = null,
  { prioritizeUnplacedOwned = false }: ModuleInventoryOptions = {},
): readonly ModuleInventorySection[] {
  const slotType = selectedSlotType(state, selectedStageId);
  const selectedBuildContext = selectedStageId !== null && slotType !== null;
  const selectedStageModuleId = selectedStageId
    ? state.slots.find((slot) => slot.slotId === selectedStageId)?.moduleId
    : null;
  const selectedStageName = selectedStageId
    ? getSlot(selectedStageId).name
    : null;
  const buckets: Record<ModuleInventorySectionId, ModuleInventoryEntry[]> = {
    owned: [],
    available: [],
    locked: [],
  };
  const ownershipOrder = new Map(
    state.ownedModuleIds.map((moduleId, index) => [moduleId, index]),
  );

  for (const module of modules) {
    const owned = state.ownedModuleIds.includes(module.id);
    const equippedIn = installedIn(state, module.id);
    const affordable = !owned && state.resources.money >= module.purchaseCost;
    const compatibleWithSelectedStage =
      slotType === null || module.slotTypes.includes(slotType);
    const entry: ModuleInventoryEntry = {
      module,
      owned,
      equipped: equippedIn.length > 0,
      affordable,
      compatibleWithSelectedStage,
      requirement: requirementFor({
        module,
        owned,
        equippedIn,
        compatibleWithSelectedStage,
        selectedStageName,
        affordable,
        money: state.resources.money,
      }),
    };
    buckets[owned ? "owned" : affordable ? "available" : "locked"].push(entry);
  }

  return sectionOrder.map((id) => ({
    id,
    label: sectionLabels[id],
    entries: buckets[id].sort((left, right) => {
      const selectedStageModule =
        Number(right.module.id === selectedStageModuleId) -
        Number(left.module.id === selectedStageModuleId);
      if (selectedStageModule !== 0) return selectedStageModule;
      const compatibility =
        Number(right.compatibleWithSelectedStage) -
        Number(left.compatibleWithSelectedStage);
      // The selected Build stage is a placement decision: show every
      // compatible owned choice before unrelated paid process upgrades. The
      // paid-owned handoff remains the preferred compact order in Upgrades,
      // where no stage is selected.
      if (selectedBuildContext && compatibility !== 0) return compatibility;
      if (selectedBuildContext && prioritizeUnplacedOwned) {
        const needsPlacement = Number(!right.equipped) - Number(!left.equipped);
        if (needsPlacement !== 0) return needsPlacement;
        if (left.owned && !left.equipped && !right.equipped)
          return (
            (ownershipOrder.get(right.module.id) ?? -1) -
            (ownershipOrder.get(left.module.id) ?? -1)
          );
      }
      const paidOwned =
        Number(right.owned && right.module.purchaseCost > 0) -
        Number(left.owned && left.module.purchaseCost > 0);
      if (paidOwned !== 0) return paidOwned;
      if (!selectedBuildContext && compatibility !== 0) return compatibility;
      // Outside a selected Build stage, retain the stable catalogue ordering;
      // an explicit caller can still promote an unplaced owned item after the
      // paid-owned Upgrades handoff.
      if (!selectedBuildContext && prioritizeUnplacedOwned) {
        const needsPlacement = Number(!right.equipped) - Number(!left.equipped);
        if (needsPlacement !== 0) return needsPlacement;
        if (left.owned && !left.equipped && !right.equipped)
          return (
            (ownershipOrder.get(right.module.id) ?? -1) -
            (ownershipOrder.get(left.module.id) ?? -1)
          );
      }
      const equipped = Number(right.equipped) - Number(left.equipped);
      if (equipped !== 0) return equipped;
      return (
        left.module.purchaseCost - right.module.purchaseCost ||
        left.module.name.localeCompare(right.module.name)
      );
    }),
  }));
}

export function moduleInventoryDefaultEntries(
  section: ModuleInventorySection,
  limit = 3,
): readonly ModuleInventoryEntry[] {
  return section.entries.slice(0, limit);
}
