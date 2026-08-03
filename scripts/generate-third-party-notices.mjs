import { readFile, writeFile } from "node:fs/promises";
const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
const direct = new Set([...Object.keys(lock.packages?.[""]?.dependencies ?? {}), ...Object.keys(lock.packages?.[""]?.devDependencies ?? {})]);
const rows = [];
for (const name of [...direct].sort()) {
  const record = lock.packages?.[`node_modules/${name}`];
  if (!record) continue;
  rows.push(`| ${name} | ${record.version ?? "unknown"} | ${record.license ?? "See package metadata"} |`);
}
const text = `# Third-party notices\n\nThis source tree depends directly on the packages below. Their licenses remain their own; consult each installed package for complete license text and transitive notices.\n\n| Package | Locked version | License |\n|---|---:|---|\n${rows.join("\n")}\n\nMineMotion Studio does not bundle Mojang or Microsoft game assets. User-supplied Minecraft content remains subject to its own terms.\n`;
await writeFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), text);
console.log(`Generated notices for ${rows.length} direct packages.`);
