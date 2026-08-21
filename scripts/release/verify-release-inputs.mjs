import { readFile } from "node:fs/promises";
const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
const packageLock = JSON.parse(await readFile(new URL("../../package-lock.json", import.meta.url), "utf8"));
const tauri = JSON.parse(await readFile(new URL("../../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const cargo = await readFile(new URL("../../src-tauri/Cargo.toml", import.meta.url), "utf8");
const cargoLock = await readFile(new URL("../../src-tauri/Cargo.lock", import.meta.url), "utf8");
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "";
// The Cargo.lock entry for the app crate must track the same release version so
// a bump cannot leave the locked build behind (docs/VERSIONING.md).
const cargoLockVersion = cargoLock.match(/name\s*=\s*"minemotion-studio"\s*\nversion\s*=\s*"([^"]+)"/)?.[1] ?? "";
const lockRootVersion = packageLock.packages?.[""]?.version ?? "";
const version = packageJson.version;
const errors = [];
// Every version surface required by docs/VERSIONING.md must agree in one commit.
const surfaces = {
  "package-lock.version": packageLock.version,
  "package-lock.packages['']": lockRootVersion,
  "tauri.conf.json": tauri.version,
  "Cargo.toml": cargoVersion,
  "Cargo.lock": cargoLockVersion
};
for (const [name, value] of Object.entries(surfaces)) {
  if (value !== version) errors.push(`Version mismatch: package.json=${version}, ${name}=${value || "<missing>"}`);
}
if (!/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(version)) errors.push("Invalid semantic version.");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Release inputs agree on version ${version} across package, lockfiles, Tauri and Cargo.`);
