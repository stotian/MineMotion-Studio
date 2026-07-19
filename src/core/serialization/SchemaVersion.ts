export const CURRENT_PROJECT_SCHEMA_VERSION = 10 as const;

export type ProjectSchemaVersion = typeof CURRENT_PROJECT_SCHEMA_VERSION;

export interface VersionedData {
  schemaVersion: number;
}

export function isCurrentProjectSchemaVersion(
  value: unknown
): value is ProjectSchemaVersion {
  return value === CURRENT_PROJECT_SCHEMA_VERSION;
}
