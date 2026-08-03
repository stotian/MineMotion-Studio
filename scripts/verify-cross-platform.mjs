import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
const support = JSON.parse(await readFile(new URL("../distribution/platform-support.json", import.meta.url), "utf8"));
const smoke = JSON.parse(await readFile(new URL("../distribution/smoke-matrix.json", import.meta.url), "utf8"));
const updater = JSON.parse(await readFile(new URL("../distribution/updater-policy.json", import.meta.url), "utf8"));
const config = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const errors = [];
for (const entry of support.platforms ?? []) {
  if (entry.supportClaimed && entry.status !== "supported") errors.push(`${entry.id}: support claimed before validation`);
  if (!entry.minimum || !(entry.targets?.length)) errors.push(`${entry.id}: incomplete platform contract`);
}
if ((smoke.tests?.length ?? 0) < 8) errors.push("Smoke matrix is incomplete.");
if (updater.enabled !== false) errors.push("Updater must remain disabled until signed update infrastructure is validated.");
const extensions = new Set((config.bundle?.fileAssociations ?? []).flatMap((entry) => entry.ext ?? []));
for (const extension of ["minemotion", "minemotion-vfx"]) if (!extensions.has(extension)) errors.push(`Missing file association ${extension}`);
const sourceRoots = ["src", "scripts"];
for (const root of sourceRoots) {
  for (const name of await readdir(new URL(`../${root}/`, import.meta.url), { recursive: true })) {
    if (!/\.(ts|tsx|mjs)$/.test(name) || /\.test\.(ts|tsx)$/.test(name)) continue;
    const path = join(root, name); const text = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    if (/C:\\\\Users\\\\(?!you\\)|\/Users\/(?!you\/)[^/]+\/|\/home\/(?!user\/)[^/]+\//.test(text)) errors.push(`${path}: hard-coded user path`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Cross-platform contract passed: ${support.platforms.length} unclaimed platform targets, updater disabled, ${smoke.tests.length} smoke tests.`);
