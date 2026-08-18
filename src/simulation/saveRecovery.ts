import type { SaveRecoveryStatus } from "./types";

export const SAVE_RECOVERY_BACKUP_KEY =
  "goldilocks-simulation-save-recovery-backup-v1";
export const SAVE_RECOVERY_STATUS_KEY =
  "goldilocks-simulation-save-recovery-status-v1";
export const SAVE_RECOVERY_FORMAT_VERSION = 1 as const;
export const MAX_SAVE_RECOVERY_RAW_LENGTH = 262_144;

export interface SaveRecoveryBackup {
  formatVersion: typeof SAVE_RECOVERY_FORMAT_VERSION;
  sourceKey: string;
  capturedAt: number;
  sourceSchemaVersion: number | null;
  sourceContentVersion: string | null;
  raw: string;
  rawChecksum: string;
  truncated: boolean;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sourceMetadata(value: unknown): {
  schemaVersion: number | null;
  contentVersion: string | null;
} {
  if (typeof value !== "object" || value === null)
    return { schemaVersion: null, contentVersion: null };
  const record = value as Record<string, unknown>;
  return {
    schemaVersion:
      typeof record.schemaVersion === "number" &&
      Number.isSafeInteger(record.schemaVersion)
        ? record.schemaVersion
        : null,
    contentVersion:
      typeof record.contentVersion === "string" ? record.contentVersion : null,
  };
}

export function createSaveRecoveryBackup(
  raw: string,
  value: unknown,
  capturedAt = Date.now(),
  sourceKey = "goldilocks-simulation-save-v4",
): SaveRecoveryBackup {
  const bounded = raw.slice(0, MAX_SAVE_RECOVERY_RAW_LENGTH);
  const metadata = sourceMetadata(value);
  return {
    formatVersion: SAVE_RECOVERY_FORMAT_VERSION,
    sourceKey,
    capturedAt,
    sourceSchemaVersion: metadata.schemaVersion,
    sourceContentVersion: metadata.contentVersion,
    raw: bounded,
    rawChecksum: fnv1a(raw),
    truncated: bounded.length !== raw.length,
  };
}

export function persistSaveRecovery(
  status: SaveRecoveryStatus,
  raw: string | null,
  value: unknown,
  storage: Storage = localStorage,
  capturedAt = Date.now(),
  sourceKey = "goldilocks-simulation-save-v4",
): boolean {
  try {
    if (raw !== null) {
      storage.setItem(
        SAVE_RECOVERY_BACKUP_KEY,
        JSON.stringify(
          createSaveRecoveryBackup(raw, value, capturedAt, sourceKey),
        ),
      );
    }
    storage.setItem(SAVE_RECOVERY_STATUS_KEY, JSON.stringify(status));
    return true;
  } catch {
    return false;
  }
}

export function readSaveRecoveryStatus(
  storage: Storage = localStorage,
): SaveRecoveryStatus | null {
  try {
    const raw = storage.getItem(SAVE_RECOVERY_STATUS_KEY);
    if (raw === null) return null;
    const value = JSON.parse(raw) as unknown;
    if (!isSaveRecoveryStatus(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function clearSaveRecoveryStatus(storage: Storage = localStorage): void {
  try {
    storage.removeItem(SAVE_RECOVERY_STATUS_KEY);
  } catch {
    // A status dismissal must never affect the simulation.
  }
}

export function isSaveRecoveryStatus(
  value: unknown,
): value is SaveRecoveryStatus {
  if (typeof value !== "object" || value === null) return false;
  const status = value as SaveRecoveryStatus;
  return (
    status.formatVersion === SAVE_RECOVERY_FORMAT_VERSION &&
    ["none", "migrated", "recovered", "reset"].includes(status.disposition) &&
    typeof status.reason === "string" &&
    status.reason.length > 0 &&
    Array.isArray(status.preserved) &&
    status.preserved.every((item) => typeof item === "string") &&
    Array.isArray(status.reset) &&
    status.reset.every((item) => typeof item === "string") &&
    typeof status.nextAction === "string" &&
    status.nextAction.length > 0 &&
    typeof status.backupCreated === "boolean"
  );
}
