import { describe, expect, it } from "vitest";
import { createEffectInstance } from "../effects/EffectRegistry";
import {
  PROJECT_AUTOSAVE_BACKUP_KEY,
  PROJECT_AUTOSAVE_KEY,
  hasProjectAutosave,
  loadProjectAutosave,
  saveProjectAutosave,
  type ProjectAutosaveStorage
} from "./ProjectAutosave";
import { createInitialProject } from "./ProjectStore";

class MemoryStorage implements ProjectAutosaveStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class FailingPrimaryStorage extends MemoryStorage {
  failNextPrimaryWrite = false;

  override setItem(key: string, value: string): void {
    if (key === PROJECT_AUTOSAVE_KEY && this.failNextPrimaryWrite) {
      this.failNextPrimaryWrite = false;
      throw new Error("simulated quota failure");
    }
    super.setItem(key, value);
  }
}

describe("ProjectAutosave", () => {
  it("round-trips schema 10 native VFX through the primary autosave", () => {
    const storage = new MemoryStorage();
    const project = {
      ...createInitialProject(),
      effects: {
        instances: [
          {
            ...createEffectInstance("glowBurst", {
              id: "effect_autosave_vfx",
              startFrame: 20
            }),
            durationFrames: 18
          }
        ]
      }
    };

    saveProjectAutosave(storage, project);
    const loaded = loadProjectAutosave(storage);

    expect(hasProjectAutosave(storage)).toBe(true);
    expect(loaded?.source).toBe("primary");
    expect(loaded?.project.schemaVersion).toBe(10);
    expect(loaded?.project.effects.instances[0].nativeVfx).toMatchObject({
      id: "effect_autosave_vfx",
      definitionId: "glowBurst",
      startFrame: 20,
      durationFrames: 18
    });
  });

  it("retains the previous payload and recovers it when the primary is corrupt", () => {
    const storage = new MemoryStorage();
    const first = createInitialProject();
    first.projectName = "Recoverable project";
    first.projectSettings.projectName = "Recoverable project";
    saveProjectAutosave(storage, first);

    const second = createInitialProject();
    second.projectName = "New primary";
    second.projectSettings.projectName = "New primary";
    saveProjectAutosave(storage, second);
    expect(storage.getItem(PROJECT_AUTOSAVE_BACKUP_KEY)).not.toBeNull();

    storage.setItem(PROJECT_AUTOSAVE_KEY, "{ corrupt json");
    const loaded = loadProjectAutosave(storage);
    expect(loaded?.source).toBe("backup");
    expect(loaded?.project.projectName).toBe("Recoverable project");
    expect(storage.getItem(PROJECT_AUTOSAVE_KEY)).toBe("{ corrupt json");
  });

  it("does not delete corrupt primary or backup payloads", () => {
    const storage = new MemoryStorage();
    storage.setItem(PROJECT_AUTOSAVE_KEY, "bad-primary");
    storage.setItem(PROJECT_AUTOSAVE_BACKUP_KEY, "bad-backup");

    expect(() => loadProjectAutosave(storage)).toThrow(/recovery failed/i);
    expect(storage.getItem(PROJECT_AUTOSAVE_KEY)).toBe("bad-primary");
    expect(storage.getItem(PROJECT_AUTOSAVE_BACKUP_KEY)).toBe("bad-backup");
  });

  it("migrates a pre-schema-10 primary autosave in place without rewriting it", () => {
    const storage = new MemoryStorage();
    const project = createInitialProject();
    const legacyRaw = JSON.stringify({ ...project, schemaVersion: 9 });
    storage.setItem(PROJECT_AUTOSAVE_KEY, legacyRaw);

    const loaded = loadProjectAutosave(storage);
    expect(loaded?.project.schemaVersion).toBe(10);
    expect(storage.getItem(PROJECT_AUTOSAVE_KEY)).toBe(legacyRaw);
  });

  it("rolls back the primary payload when a replacement write fails", () => {
    const storage = new FailingPrimaryStorage();
    const first = createInitialProject();
    first.projectName = "Stable autosave";
    first.projectSettings.projectName = "Stable autosave";
    saveProjectAutosave(storage, first);
    const stableRaw = storage.getItem(PROJECT_AUTOSAVE_KEY);

    const second = createInitialProject();
    second.projectName = "Failed replacement";
    second.projectSettings.projectName = "Failed replacement";
    storage.failNextPrimaryWrite = true;

    expect(() => saveProjectAutosave(storage, second)).toThrow(
      /simulated quota failure/i
    );
    expect(storage.getItem(PROJECT_AUTOSAVE_KEY)).toBe(stableRaw);
    expect(storage.getItem(PROJECT_AUTOSAVE_BACKUP_KEY)).toBe(stableRaw);
  });
});
