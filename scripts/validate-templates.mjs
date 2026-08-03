import { readFile, readdir } from "node:fs/promises";
const required = ["empty-scene","dialogue-scene","fight-scene","horror-scene","chase-scene","boss-battle","trailer-scene","thumbnail-scene","vertical-short"];
const source = await readFile(new URL("../src/templates/ProductionTemplates.ts", import.meta.url), "utf8");
const registry = await readFile(new URL("../src/templates/TemplateRegistry.ts", import.meta.url), "utf8");
const emptySource = await readFile(new URL("../src/templates/templates/EmptySceneTemplate.ts", import.meta.url), "utf8");
const errors = [];
for (const id of required) if (!(source.includes(`id: \"${id}\"`) || registry.includes(id) || emptySource.includes(`id: \"${id}\"`))) errors.push(`Missing required template ${id}`);
for (const forbidden of [/textures\.minecraft\.net/i,/assets\.mojang\.com/i,/minecraft\.net\/skin/i]) if (forbidden.test(source)) errors.push(`Forbidden proprietary asset reference: ${forbidden}`);
for (const file of await readdir(new URL("../src/templates/templates/", import.meta.url))) {
  const text = await readFile(new URL(`../src/templates/templates/${file}`, import.meta.url), "utf8");
  if (!text.includes("license:") || !text.includes("attribution:")) errors.push(`${file} lacks legal metadata`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Template validation passed: ${required.length} production templates, no proprietary asset references.`);
