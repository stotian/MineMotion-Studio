import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = process.argv[2];
if (!path) { console.error("Usage: node scripts/validate-extension-package.mjs <minemotion-extension.json>"); process.exit(2); }
const raw = await readFile(resolve(path), "utf8");
if (Buffer.byteLength(raw) > 5 * 1024 * 1024) throw new Error("Manifest exceeds 5 MiB.");
const manifest = JSON.parse(raw);
const errors = [];
if (!["content-pack", "logic-plugin"].includes(manifest.kind)) errors.push("kind must be content-pack or logic-plugin");
if (!/^[a-z0-9][a-z0-9._-]{2,80}$/.test(manifest.id ?? "")) errors.push("id is invalid");
if (!/^\d+\.\d+\.\d+/.test(manifest.version ?? "")) errors.push("version must be semantic");
if (manifest.apiVersion !== "1.0") errors.push("apiVersion must be 1.0");
const serialized = JSON.stringify(manifest);
for (const capability of ["filesystem.unrestricted", "process.execute", "environment.read", "secrets.read", "native.eval"]) if (serialized.includes(capability)) errors.push(`prohibited capability: ${capability}`);
if (manifest.kind === "content-pack" && ("entry" in manifest || "script" in manifest || "code" in manifest)) errors.push("content packs cannot contain executable entry fields");
if (manifest.entry && (/^(?:[a-z]:|[/\\])|\.\./i.test(manifest.entry))) errors.push("entry path is unsafe");
if (errors.length) { console.error(errors.map((error) => `- ${error}`).join("\n")); process.exit(1); }
console.log(`${manifest.id}@${manifest.version}: valid ${manifest.kind}`);
