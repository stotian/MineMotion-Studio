import { assertMigrationStep } from "./Migration";
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  isCurrentProjectSchemaVersion
} from "./SchemaVersion";
import { invalidResult, validResult } from "./ValidationResult";

describe("serialization contracts", () => {
  it("exposes schema 10 as the runtime source of truth", () => {
    expect(CURRENT_PROJECT_SCHEMA_VERSION).toBe(10);
    expect(isCurrentProjectSchemaVersion(10)).toBe(true);
    expect(isCurrentProjectSchemaVersion(9)).toBe(false);
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
