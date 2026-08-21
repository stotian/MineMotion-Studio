import { describe, expect, it } from "vitest";
import { createHistoricalMigrationFixtures } from "../qa/MigrationFixtures";
import { ProjectSerializer } from "./ProjectSerializer";
import { createMineMotionPackageData } from "./package/MineMotionPackage";
import { PackageReader } from "./package/PackageReader";
import {
  loadProjectAutosave,
  saveProjectAutosave,
  type ProjectAutosaveStorage
} from "./ProjectAutosave";

// Compatibility contract (AGENTS.md rule 1): every historical `.mmsproj` schema
// must migrate to the current schema 10 and stay usable. The existing beta QA
// only checks that migration does not throw; this suite hardens the contract by
// proving the migrated project is complete, converged and portable.

const fixtures = createHistoricalMigrationFixtures();

// Top-level fields that schema 10 requires, some of which the historical
// fixtures deliberately omit for their era. Migration must reconstitute them.
const REQUIRED_SCHEMA_10_FIELDS = [
  "lighting",
  "assetLibrary",
  "effects",
  "ffmpegSettings",
  "renderQueue",
  "production",
  "simulations",
  "animation"
] as const;

describe("Historical project migration round-trip", () => {
  it("covers every schema from 1 to 10", () => {
    expect(fixtures.map((fixture) => fixture.schemaVersion)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  for (const fixture of fixtures) {
    describe(`schema ${fixture.schemaVersion}`, () => {
      it("migrates to schema 10 with every required field reconstituted", () => {
        const migrated = ProjectSerializer.parse(fixture.raw);
        expect(migrated.schemaVersion).toBe(10);
        for (const field of REQUIRED_SCHEMA_10_FIELDS) {
          expect(migrated[field], `missing ${field}`).toBeDefined();
        }
      });

      it("reaches a stable fixed point (re-serialize is idempotent)", () => {
        const migrated = ProjectSerializer.parse(fixture.raw);
        const once = ProjectSerializer.serialize(migrated);
        const twice = ProjectSerializer.serialize(ProjectSerializer.parse(once));
        expect(twice).toBe(once);
      });

      it("stays portable through package and autosave after migration", () => {
        const migrated = ProjectSerializer.parse(fixture.raw);

        const fromPackage = PackageReader.parse(JSON.stringify(createMineMotionPackageData(migrated)));
        expect(fromPackage.schemaVersion).toBe(10);
        expect(fromPackage.projectName).toBe(migrated.projectName);

        const storage = createMemoryStorage();
        saveProjectAutosave(storage, migrated);
        const restored = loadProjectAutosave(storage);
        expect(restored?.project.schemaVersion).toBe(10);
        expect(restored?.project.projectName).toBe(migrated.projectName);
      });
    });
  }
});

function createMemoryStorage(): ProjectAutosaveStorage & Pick<Storage, "removeItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    }
  };
}
