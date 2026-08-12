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
   * Build's selected-stage drawer needs one next-placement cue. Upgrades is
   * the durable catalogue, so preserving the purchase order there lets a
   * just-bought item remain at its stable card position.
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
      const paidOwned =
        Number(right.owned && right.module.purchaseCost > 0) -
        Number(left.owned && left.module.purchaseCost > 0);
      if (paidOwned !== 0) return paidOwned;
      const compatibility =
        Number(right.compatibleWithSelectedStage) -
        Number(left.compatibleWithSelectedStage);
      if (compatibility !== 0) return compatibility;
      // Build's selected-stage drawer promotes an unplaced owned module ahead
      // of already-equipped alternatives, so the next placement stays visible
      // without opening the full list. Upgrades keeps its stable catalogue
      // ordering because it has no selected pipeline stage.
      if (prioritizeUnplacedOwned) {
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
