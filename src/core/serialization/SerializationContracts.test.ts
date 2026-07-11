import { assertMigrationStep } from "./Migration";
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  isCurrentProjectSchemaVersion
} from "./SchemaVersion";
import { invalidResult, validResult } from "./ValidationResult";

describe("serialization contracts", () => {
  it("exposes schema 9 as the runtime source of truth", () => {
    expect(CURRENT_PROJECT_SCHEMA_VERSION).toBe(9);
    expect(isCurrentProjectSchemaVersion(9)).toBe(true);
    expect(isCurrentProjectSchemaVersion(8)).toBe(false);
  });

  it("validates migration direction", () => {
    expect(() =>
      assertMigrationStep({
        fromVersion: 2,
        toVersion: 1,
        migrate: (input) => input
      })
    ).toThrow("advance");
  });

  it("creates discriminated validation results", () => {
    expect(validResult("ok").ok).toBe(true);
    expect(
      invalidResult([{ code: "bad", message: "Bad data", severity: "error" }]).ok
    ).toBe(false);
  });
});
