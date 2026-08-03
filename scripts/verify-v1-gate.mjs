import { readFile } from "node:fs/promises";
const evidence = JSON.parse(await readFile(new URL("../distribution/v1-release-evidence.json", import.meta.url), "utf8"));
const errors = [];
const ids = new Set();
for (const gate of evidence.gates ?? []) {
  if (ids.has(gate.id)) errors.push(`Duplicate gate ${gate.id}`); ids.add(gate.id);
  if (gate.status === "pass" && !(gate.evidence?.length)) errors.push(`${gate.id}: passing gate lacks evidence`);
  if (gate.status !== "pass" && !gate.blocker) errors.push(`${gate.id}: non-passing gate lacks blocker`);
}
const pending = (evidence.gates ?? []).filter((gate) => gate.status !== "pass");
if (evidence.status === "V1_COMPLETE" && pending.length) errors.push("V1_COMPLETE is forbidden while gates are pending.");
if (errors.length) { console.error(errors.join("\n")); process.exit(2); }
if (pending.length) {
  console.error(`V1 release gate blocked: ${(evidence.gates ?? []).length - pending.length}/${(evidence.gates ?? []).length} gates pass.`);
  for (const gate of pending) console.error(`- ${gate.id}: ${gate.blocker}`);
  process.exit(1);
}
console.log(`V1_COMPLETE: all ${(evidence.gates ?? []).length} gates pass for ${evidence.targetVersion}.`);
