import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "docs");
const files = (await readdir(docsDir)).filter((name) => name.endsWith(".md"));
const errors = [];
for (const name of files) {
  const path = join(docsDir, name);
  const text = await readFile(path, "utf8");
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (!target || /^(https?:|mailto:|#)/i.test(target)) continue;
    const filePart = decodeURIComponent(target.split("#")[0]);
    const resolved = normalize(join(dirname(path), filePart));
    if (!resolved.startsWith(root)) { errors.push(`${name}: path escapes repository: ${target}`); continue; }
    try { if (!(await stat(resolved)).isFile()) errors.push(`${name}: not a file: ${target}`); } catch { errors.push(`${name}: missing link: ${target}`); }
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Documentation link validation passed: ${files.length} Markdown files.`);
