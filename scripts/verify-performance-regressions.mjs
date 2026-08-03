import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const ASSETS_DIR = join(DIST_DIR, "assets");
const INDEX_PATH = join(DIST_DIR, "index.html");
const THRESHOLDS = Object.freeze(JSON.parse(await readFile(
  new URL("../src/performance/performance-regression-thresholds.json", import.meta.url),
  "utf8"
)));

const indexHtml = await readFile(INDEX_PATH, "utf8");
const entryMatch = indexHtml.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/i)
  ?? indexHtml.match(/<script[^>]+src=["']([^"']+\.js)["'][^>]+type=["']module["']/i);
if (!entryMatch) {
  throw new Error("Unable to identify the production entry JavaScript from dist/index.html.");
}

const files = await listFiles(ASSETS_DIR, ASSETS_DIR);
const javascript = files.filter((file) => file.path.endsWith(".js"));
const normalizedEntry = entryMatch[1].replace(/^\/?assets\//, "");
const entry = javascript.find((file) => file.path === normalizedEntry);
if (!entry) {
  throw new Error(`Production entry asset not found: ${normalizedEntry}`);
}

const workers = javascript.filter((file) => /worker/i.test(file.path));
if (workers.length === 0) {
  throw new Error("Expected the Phase 20 world decode worker in the production build.");
}

const measurements = {
  mainJavascriptBytes: entry.bytes,
  totalJavascriptBytes: sum(javascript.map((file) => file.bytes)),
  workerJavascriptBytes: sum(workers.map((file) => file.bytes))
};

let failed = false;
for (const [metric, measured] of Object.entries(measurements)) {
  const maximum = THRESHOLDS[metric];
  if (measured > maximum) {
    failed = true;
    console.error(`${metric}: ${measured} bytes exceeds ${maximum} bytes.`);
  } else {
    console.log(`${metric}: ${measured}/${maximum} bytes.`);
  }
}

if (failed) {
  console.error(
    "Performance regression threshold exceeded. Split or remove justified work; do not raise the threshold without recorded measurements."
  );
  process.exitCode = 1;
}

async function listFiles(root, current) {
  const entries = await readdir(current, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      output.push(...await listFiles(root, path));
    } else if (entry.isFile()) {
      output.push({
        path: relative(root, path).replaceAll("\\", "/"),
        bytes: (await stat(path)).size
      });
    }
  }
  return output;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
