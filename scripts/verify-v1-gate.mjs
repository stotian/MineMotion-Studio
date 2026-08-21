import { readFile } from "node:fs/promises";

const GATE_STATUSES = new Set(["pass", "blocked", "not-run"]);
const LEDGER_STATUSES = new Set(["V1_COMPLETE", "V1_BLOCKED"]);

const evidence = JSON.parse(await readFile(new URL("../distribution/v1-release-evidence.json", import.meta.url), "utf8"));
const errors = [];

if (!LEDGER_STATUSES.has(evidence.status)) errors.push(`Unknown ledger status: ${JSON.stringify(evidence.status)}`);
if (!Array.isArray(evidence.gates) || evidence.gates.length === 0) errors.push("Ledger has no gates array.");

const gates = Array.isArray(evidence.gates) ? evidence.gates : [];
const ids = new Set();
for (const gate of gates) {
  const id = typeof gate.id === "string" && gate.id ? gate.id : null;
  if (!id) { errors.push("Gate is missing a string id."); continue; }
  if (ids.has(id)) errors.push(`Duplicate gate ${id}`);
  ids.add(id);
  if (!GATE_STATUSES.has(gate.status)) errors.push(`${id}: unknown gate status ${JSON.stringify(gate.status)}`);
  if (gate.status === "pass") {
    if (!Array.isArray(gate.evidence) || gate.evidence.length === 0) errors.push(`${id}: passing gate lacks evidence`);
  } else if (typeof gate.blocker !== "string" || !gate.blocker.trim()) {
    errors.push(`${id}: non-passing gate lacks blocker`);
  }
}

const pending = gates.filter((gate) => gate.status !== "pass");
// The declared ledger status must match the gate reality so a stale header
// cannot claim completion or hide it.
if (pending.length > 0 && evidence.status !== "V1_BLOCKED") errors.push("Gates are pending but ledger status is not V1_BLOCKED.");
if (pending.length === 0 && evidence.status !== "V1_COMPLETE") errors.push("All gates pass but ledger status is not V1_COMPLETE.");

if (errors.length) { console.error(errors.join("\n")); process.exit(2); }
if (pending.length) {
  console.error(`V1 release gate blocked: ${gates.length - pending.length}/${gates.length} gates pass.`);
  for (const gate of pending) console.error(`- ${gate.id}: ${gate.blocker}`);
  process.exit(1);
}
console.log(`V1_COMPLETE: all ${gates.length} gates pass for ${evidence.targetVersion}.`);
