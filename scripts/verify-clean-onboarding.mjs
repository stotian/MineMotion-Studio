import { readFile, stat } from "node:fs/promises";
const required = [
  "README.md", "docs/INSTALL.md", "docs/QUICK_START.md", "docs/USER_GUIDE.md", "docs/TROUBLESHOOTING.md",
  "src/ui/onboarding/FirstLaunchExperience.tsx", "src/templates/ProductionTemplates.ts", "scripts/validate-templates.mjs"
];
const errors = [];
for (const path of required) { try { if (!(await stat(new URL(`../${path}`, import.meta.url))).isFile()) errors.push(`Missing ${path}`); } catch { errors.push(`Missing ${path}`); } }
const install = await readFile(new URL("../docs/INSTALL.md", import.meta.url), "utf8");
const quick = await readFile(new URL("../docs/QUICK_START.md", import.meta.url), "utf8");
if (!/Node\.js|npm/i.test(install)) errors.push("INSTALL.md does not state Node/npm prerequisites.");
for (const term of ["template", "camera", "keyframe", "export"]) if (!quick.toLowerCase().includes(term)) errors.push(`QUICK_START.md misses ${term}.`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Clean-machine onboarding documentation gate passed.");
