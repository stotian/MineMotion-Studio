import { readFile } from "node:fs/promises";

const REVIEWED_CEILINGS = Object.freeze([
  {
    path: new URL("../src/App.tsx", import.meta.url),
    label: "App.tsx",
    allowedLines: 1900,
    guidance:
      "Extract domain orchestration or explicitly review and update the architecture ceiling."
  },
  {
    path: new URL("../src/ui/timeline/TimelinePanel.tsx", import.meta.url),
    label: "TimelinePanel.tsx",
    allowedLines: 1000,
    guidance:
      "Keep view-only timeline and NLA regions in focused modules before adding more panel commands."
  }
]);

let failed = false;
for (const target of REVIEWED_CEILINGS) {
  const source = await readFile(target.path, "utf8");
  const lines = source.replace(/\r?\n$/, "").split(/\r?\n/).length;
  if (lines > target.allowedLines) {
    failed = true;
    console.error(
      `${target.label} has ${lines} lines, above the reviewed ceiling of ${target.allowedLines}. ` +
        target.guidance
    );
  } else {
    console.log(
      `${target.label} size check passed: ${lines}/${target.allowedLines} lines.`
    );
  }
}

if (failed) process.exitCode = 1;
