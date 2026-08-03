export type ReleaseGateStatus = "pass" | "blocked" | "fail" | "not-run";
export interface ReleaseGateEvidence {
  id: string;
  category: "workflow" | "engineering" | "security" | "quality" | "distribution" | "publication";
  status: ReleaseGateStatus;
  evidence: string[];
  blocker?: string;
}
export interface ReleaseGateReport { targetVersion: string; status: "V1_COMPLETE" | "V1_BLOCKED"; passed: number; total: number; gates: ReleaseGateEvidence[]; }
export function evaluateReleaseGate(targetVersion: string, gates: ReleaseGateEvidence[]): ReleaseGateReport {
  const ids = new Set<string>();
  for (const gate of gates) {
    if (ids.has(gate.id)) throw new Error(`Duplicate release gate ${gate.id}.`);
    ids.add(gate.id);
    if (gate.status === "pass" && gate.evidence.length === 0) throw new Error(`Passing gate ${gate.id} has no evidence.`);
    if (gate.status !== "pass" && !gate.blocker) throw new Error(`Non-passing gate ${gate.id} requires a blocker.`);
  }
  const passed = gates.filter((gate) => gate.status === "pass").length;
  return { targetVersion, status: passed === gates.length ? "V1_COMPLETE" : "V1_BLOCKED", passed, total: gates.length, gates };
}
