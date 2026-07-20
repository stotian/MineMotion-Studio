import { readFile } from "node:fs/promises";

const APP_PATH = new URL("../src/App.tsx", import.meta.url);
const ALLOWED_LINES = 2839;
const source = await readFile(APP_PATH, "utf8");
const lines = source.replace(/\r?\n$/, "").split(/\r?\n/).length;

if (lines > ALLOWED_LINES) {
  console.error(
    `App.tsx has ${lines} lines, above the reviewed ceiling of ${ALLOWED_LINES}. ` +
    "Extract domain orchestration or explicitly review and update the architecture ceiling."
  );
  process.exitCode = 1;
} else {
  console.log(`App.tsx size check passed: ${lines}/${ALLOWED_LINES} lines.`);
}
