import { execFileSync } from "node:child_process";
import { access, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".director-build");
const require = createRequire(import.meta.url);
// Run the local TypeScript compiler through Node so the script is portable:
// spawning the bare "tsc" name fails on Windows where the binary is tsc.cmd.
const tscBin = require.resolve("typescript/bin/tsc");
await rm(outDir, { recursive: true, force: true });
try {
  execFileSync(process.execPath, [tscBin, "-p", "tsconfig.director.json"], { cwd: root, stdio: "inherit" });
  await writeFile(path.join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }));
  const { runDirectorAcceptance } = require(path.join(outDir, "production", "director", "DirectorAcceptance.js"));
  const { DIRECTOR_FEATURE_PHASES } = require(path.join(outDir, "production", "director", "DirectorFeatureRegistry.js"));
  for (const feature of DIRECTOR_FEATURE_PHASES) {
    await access(path.join(root, feature.sourceOwner));
  }
  const result = runDirectorAcceptance();
  if (result.features !== DIRECTOR_FEATURE_PHASES.length) throw new Error(`Expected ${DIRECTOR_FEATURE_PHASES.length} real Director phases, received ${result.features}.`);
  if (result.shotRecipes !== 14) throw new Error(`Expected 14 shot recipes, received ${result.shotRecipes}.`);
  if (result.assertions < 603) throw new Error(`Expected at least 603 Director assertions, received ${result.assertions}.`);
  console.log(`Director acceptance passed: ${result.features} functional phases, ${result.shotRecipes} shot recipes, ${result.generatedShots} generated sequence shots, ${result.animatedCameraTracks} animated camera tracks, ${result.assertions} assertions.`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
