import type { VersionedData } from "./SchemaVersion";

export interface MigrationContext {
  sourceName?: string;
  appVersion?: string;
}

export interface MigrationStep<
  TInput extends VersionedData = VersionedData,
  TOutput extends VersionedData = VersionedData
> {
  readonly fromVersion: TInput["schemaVersion"];
  readonly toVersion: TOutput["schemaVersion"];
  migrate(input: TInput, context?: MigrationContext): TOutput;
}

export function assertMigrationStep(step: MigrationStep): void {
  if (!Number.isInteger(step.fromVersion) || !Number.isInteger(step.toVersion)) {
    throw new RangeError("Migration versions must be integers.");
  }
  if (step.toVersion <= step.fromVersion) {
    throw new RangeError("A migration must advance the schema version.");
  }
}
