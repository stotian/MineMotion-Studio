import { describe, expect, it } from "vitest";
import { evaluateReleaseGate } from "./ReleaseGate";
import { validateV1PublicContracts, V1_PUBLIC_CONTRACTS } from "./PublicContracts";
describe("Phase 35 release gate", () => {
  it("freezes public v1 contracts", () => { expect(validateV1PublicContracts()).toEqual([]); expect(V1_PUBLIC_CONTRACTS.frozenFor).toBe("1.0.0"); });
  it("refuses V1_COMPLETE while any gate is blocked", () => {
    const report = evaluateReleaseGate("1.0.0", [
      { id: "source", category: "engineering", status: "pass", evidence: ["commit"] },
      { id: "installer", category: "distribution", status: "blocked", evidence: [], blocker: "not tested" }
    ]);
    expect(report.status).toBe("V1_BLOCKED");
  });
});
