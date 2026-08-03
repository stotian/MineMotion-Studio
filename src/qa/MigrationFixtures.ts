import { createInitialProject } from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import type { MineMotionProject } from "../project/ProjectFile";
export interface MigrationFixture { schemaVersion: number; name: string; raw: string; }
export function createHistoricalMigrationFixtures(): MigrationFixture[] {
  return Array.from({ length: 10 }, (_, index) => {
    const schemaVersion = index + 1;
    const project = createInitialProject();
    const source = JSON.parse(ProjectSerializer.serialize(project)) as Record<string, unknown>;
    source.schemaVersion = schemaVersion;
    source.projectName = `Migration fixture schema ${schemaVersion}`;
    if (schemaVersion < 10) delete source.simulations;
    if (schemaVersion < 9) delete source.production;
    if (schemaVersion < 8) delete source.lighting;
    if (schemaVersion < 7) { delete source.ffmpegSettings; delete source.renderQueue; }
    if (schemaVersion < 3) delete source.assetLibrary;
    return { schemaVersion, name: `schema-${schemaVersion}`, raw: JSON.stringify(source) };
  });
}
export function runMigrationMatrix(fixtures = createHistoricalMigrationFixtures()): MineMotionProject[] {
  return fixtures.map((fixture) => {
    const migrated = ProjectSerializer.parse(fixture.raw);
    if (migrated.schemaVersion !== 10) throw new Error(`${fixture.name} did not migrate to schema 10.`);
    return migrated;
  });
}
