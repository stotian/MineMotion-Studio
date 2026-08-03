import { execFileSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".ultra-build");

const reviewedLineCeilings = Object.freeze({
  "src/ultra/UltraTypes.ts": 750,
  "src/ultra/UltraDefaults.ts": 900,
  "src/ultra/UltraDomainValidation.ts": 750,
  "src/ultra/UltraSerializer.ts": 560,
  "src/ultra/performance/UltraPerformanceEngine.ts": 500,
  "src/ultra/directing/UltraDirectingEngine.ts": 400,
  "src/ultra/entities/UltraEntityEngine.ts": 450,
  "src/ultra/world/UltraWorldEngine.ts": 450,
  "src/ultra/rendering/UltraRenderingEngine.ts": 450,
  "src/ui/production/UltraStudioSection.tsx": 300
});

for (const [relativePath, ceiling] of Object.entries(reviewedLineCeilings)) {
  const source = await readFile(path.join(root, relativePath), "utf8");
  const lines = source.replace(/\r?\n$/, "").split(/\r?\n/).length;
  if (lines > ceiling) {
    throw new Error(`${relativePath} has ${lines} lines, above the reviewed Ultra ceiling of ${ceiling}.`);
  }
}

await rm(outDir, { recursive: true, force: true });
try {
  execFileSync("tsc", ["-p", "tsconfig.ultra.json"], { cwd: root, stdio: "inherit" });
  await writeFile(path.join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }));
  const require = createRequire(import.meta.url);
  const { runUltraAcceptance } = require(path.join(outDir, "ultra", "UltraAcceptance.js"));
  const result = runUltraAcceptance();
  if (result.phaseCount !== 565) throw new Error(`Expected 565 Ultra phases, received ${result.phaseCount}.`);
  if (result.phaseTests !== 565) throw new Error(`Expected one phase test for every Ultra phase, received ${result.phaseTests}.`);
  if (result.foundationTests !== 52) throw new Error(`Expected 52 dedicated foundation tests for phases 84-135, received ${result.foundationTests}.`);
  if (result.phaseContractAssertions < result.phaseCount) throw new Error(`Ultra phase contracts reported only ${result.phaseContractAssertions} assertions.`);
  console.log(`Ultra acceptance passed: ${result.phaseCount} phases, ${result.phaseTests} phase tests, ${result.foundationTests} dedicated foundation tests, ${result.assertions} top-level assertions, ${result.phaseContractAssertions} phase-contract assertions, ${result.serializedBytes} bytes.`);
} finally {
  await rm(outDir, { recursive: true, force: true });
}
