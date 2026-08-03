export type BetaSeverity = "P0" | "P1" | "P2" | "P3";
export interface BetaIssueDecision { id: string; severity: BetaSeverity; status: "fixed" | "deferred" | "blocked-external"; summary: string; rationale: string; }
export const BETA_ISSUE_DECISIONS: BetaIssueDecision[] = [
  { id: "BETA-EXT-001", severity: "P2", status: "blocked-external", summary: "Native installer smoke tests are not available in the current environment.", rationale: "No platform support or stable release is claimed until CI artifacts are manually tested." },
  { id: "BETA-EXT-002", severity: "P2", status: "blocked-external", summary: "Remote GitHub write and tag publication are unavailable.", rationale: "Local commits and reproducible bundles are retained; publication requires authorized credentials." },
  { id: "BETA-P2-003", severity: "P2", status: "deferred", summary: "Shortcut remapping is not implemented.", rationale: "The fixed searchable shortcut MVP is documented and conflicts are tested." }
];
export function openReleaseBlockingIssues(): BetaIssueDecision[] { return BETA_ISSUE_DECISIONS.filter((issue) => (issue.severity === "P0" || issue.severity === "P1") && issue.status !== "fixed"); }
