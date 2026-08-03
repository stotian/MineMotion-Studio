import { readFile } from "node:fs/promises";
const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
const tauri = JSON.parse(await readFile(new URL("../../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const cargo = await readFile(new URL("../../src-tauri/Cargo.toml", import.meta.url), "utf8");
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "";
const errors = [];
if (packageJson.version !== tauri.version || packageJson.version !== cargoVersion) errors.push(`Version mismatch: package=${packageJson.version}, tauri=${tauri.version}, cargo=${cargoVersion}`);
if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(packageJson.version)) errors.push("Invalid semantic version.");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Release inputs agree on version ${packageJson.version}.`);
