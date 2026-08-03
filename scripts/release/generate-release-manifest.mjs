import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
const artifactsDir = resolve(process.argv[2] ?? "release-artifacts");
const outputPath = resolve(process.argv[3] ?? join(artifactsDir, "release-manifest.json"));
const files = (await readdir(artifactsDir, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name !== basename(outputPath) && entry.name !== "SHA256SUMS.txt").map((entry) => entry.name).sort();
const artifacts = [];
for (const name of files) { const data = await readFile(join(artifactsDir, name)); artifacts.push({ name, bytes: data.byteLength, sha256: createHash("sha256").update(data).digest("hex") }); }
const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), channel: process.env.MINEMOTION_RELEASE_CHANNEL ?? "development", commit: process.env.GITHUB_SHA ?? "local", artifacts };
await writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n");
await writeFile(join(artifactsDir, "SHA256SUMS.txt"), artifacts.map((artifact) => `${artifact.sha256}  ${artifact.name}`).join("\n") + "\n");
console.log(`Release manifest generated for ${artifacts.length} artifacts.`);
