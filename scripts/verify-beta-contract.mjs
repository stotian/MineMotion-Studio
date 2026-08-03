import { readFile, stat } from "node:fs/promises";
const required = ["docs/FEATURE_TRUTH_MATRIX.md", "docs/PUBLIC_BETA_QA.md", "docs/RELEASE_DECISIONS.md", "distribution/smoke-matrix.json", "src/qa/FeatureTruthMatrix.ts", "src/qa/MigrationFixtures.ts", "src/qa/GoldenProjectCatalog.ts"];
const errors = [];
for (const path of required) { try { if (!(await stat(new URL(`../${path}`, import.meta.url))).isFile()) errors.push(`Missing ${path}`); } catch { errors.push(`Missing ${path}`); } }
const smoke = JSON.parse(await readFile(new URL("../distribution/smoke-matrix.json", import.meta.url), "utf8"));
if ((smoke.results?.length ?? 0) > 0 && smoke.results.some((result) => result.status !== "pass" && result.claimed === true)) errors.push("Failed smoke result cannot be claimed.");
const docs = await readFile(new URL("../docs/FEATURE_TRUTH_MATRIX.md", import.meta.url), "utf8");
for (const status of ["Working", "Partial", "Experimental", "Blocked validation", "Planned"]) if (!docs.includes(status)) errors.push(`Feature truth docs miss status ${status}.`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Public beta truth/QA contract passed; installer results remain unclaimed until populated.");
