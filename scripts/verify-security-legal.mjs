import { readFile, readdir, stat } from "node:fs/promises";
const errors = [];
const updater = JSON.parse(await readFile(new URL("../distribution/updater-policy.json", import.meta.url), "utf8"));
if (updater.enabled !== false) errors.push("Automatic updater must remain disabled until its signed infrastructure passes review.");
const defaultSettings = await readFile(new URL("../src/settings/DefaultSettings.ts", import.meta.url), "utf8");
if (!/allowExperimentalPlugins:\s*false/.test(defaultSettings)) errors.push("Experimental plugins are not disabled by default.");
const worldPolicy = await readFile(new URL("../src/minecraft/staging/WorldSceneOverrides.ts", import.meta.url), "utf8");
if (!/access:\s*"read-only"/.test(worldPolicy) || !/filesystemWritesAllowed:\s*false/.test(worldPolicy)) errors.push("World source policy is not read-only.");
const forbiddenAssetPatterns = [/textures\.minecraft\.net/i, /assets\.mojang\.com/i, /sessionserver\.mojang\.com/i];
for (const root of ["src", "examples", "packages/minemotion-plugin-sdk/examples"]) {
  const rootUrl = new URL(`../${root}/`, import.meta.url);
  try { await stat(rootUrl); } catch { continue; }
  for (const name of await readdir(rootUrl, { recursive: true })) {
    if (!/\.(ts|tsx|js|json|md)$/i.test(name)) continue;
    const path = `${root}/${name}`;
    const text = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    for (const pattern of forbiddenAssetPatterns) if (pattern.test(text)) errors.push(`${path}: forbidden proprietary asset host ${pattern}`);
    if (/ghp_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) errors.push(`${path}: secret/private key pattern`);
  }
}
for (const required of ["LICENSE", "SECURITY.md", "THIRD_PARTY_NOTICES.md", "docs/SIGNING_NOTARIZATION.md", "docs/OPTIONAL_DEPENDENCIES.md"]) {
  try { if (!(await stat(new URL(`../${required}`, import.meta.url))).isFile()) errors.push(`Missing ${required}`); } catch { errors.push(`Missing ${required}`); }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Security/legal source gate passed: safe defaults, read-only worlds, notices present, no forbidden asset hosts or secret patterns.");
