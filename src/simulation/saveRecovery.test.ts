import { describe, expect, it } from "vitest";
import {
  createSaveRecoveryBackup,
  isSaveRecoveryStatus,
  MAX_SAVE_RECOVERY_RAW_LENGTH,
  persistSaveRecovery,
  readSaveRecoveryStatus,
  SAVE_RECOVERY_BACKUP_KEY,
  SAVE_RECOVERY_STATUS_KEY,
} from "./saveRecovery";
import type { SaveRecoveryStatus } from "./types";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  [name: string]: unknown;
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("D-046 bounded recovery backup", () => {
  it("keeps one versioned bounded raw backup with provenance and checksum", () => {
    const raw = "x".repeat(MAX_SAVE_RECOVERY_RAW_LENGTH + 20);
    const backup = createSaveRecoveryBackup(
      raw,
      { schemaVersion: 8, contentVersion: "future" },
      123,
      "legacy-key",
    );
    expect(backup.formatVersion).toBe(1);
    expect(backup.sourceKey).toBe("legacy-key");
    expect(backup.sourceSchemaVersion).toBe(8);
    expect(backup.sourceContentVersion).toBe("future");
    expect(backup.raw).toHaveLength(MAX_SAVE_RECOVERY_RAW_LENGTH);
    expect(backup.truncated).toBe(true);
    expect(backup.rawChecksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it("writes status and backup transactionally enough for reload inspection", () => {
    const storage = new MemoryStorage();
    const status: SaveRecoveryStatus = {
      formatVersion: 1,
      disposition: "reset",
      reason: "future-schema",
      preserved: [],
      reset: ["unsupported future save fields"],
      nextAction: "Retry after a compatible update.",
      backupCreated: true,
    };
    expect(
      persistSaveRecovery(
        status,
        '{"schemaVersion":8}',
        { schemaVersion: 8, contentVersion: "future" },
        storage,
        456,
        "goldilocks-simulation-save-v4",
      ),
    ).toBe(true);
    expect(isSaveRecoveryStatus(readSaveRecoveryStatus(storage))).toBe(true);
    expect(readSaveRecoveryStatus(storage)).toEqual(status);
    expect(storage.getItem(SAVE_RECOVERY_STATUS_KEY)).not.toBeNull();
    expect(storage.getItem(SAVE_RECOVERY_BACKUP_KEY)).toContain(
      '"capturedAt":456',
    );
  });
});
