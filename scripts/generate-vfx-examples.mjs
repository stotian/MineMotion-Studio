import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "--config",
    "scripts/vitest.examples.config.ts"
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      UPDATE_VFX_EXAMPLES: process.argv.includes("--verify") ? "0" : "1"
    },
    stdio: "inherit"
  }
);

process.exitCode = result.status ?? 1;
