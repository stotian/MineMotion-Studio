import { describe, expect, it } from "vitest";
import { deriveVfxAuthoringDocumentFromBuiltin } from "../authoring/VfxAuthoringDocument";
import { builtinVfxPresetCatalog } from "../library/BuiltinVfxPresetCatalog";
import { readVfxPackageArchive } from "./VfxPackageArchiveReader";
import { createVfxPackageManifest, canonicalVfxPackageJson, writeVfxPackageArchive } from "./VfxPackageArchiveWriter";
import { resolveVfxPackagePresentation } from "./VfxPackageLocalization";

async function fixture() {
  const source = builtinVfxPresetCatalog.get("combatSparks");
  if (!source) throw new Error("Missing combatSparks fixture.");
  const document = deriveVfxAuthoringDocumentFromBuiltin(source);
  const encoder = new TextEncoder();
  const localizationAssets = [
    {
      id: "locale.en",
      path: "locales/en.json",
      locale: "en",
      displayName: "Localized Sparks",
      description: "Localized description"
    },
    {
      id: "locale.fr-fr",
      path: "locales/fr-FR.json",
      locale: "fr-FR",
      displayName: "Étincelles localisées",
      description: "Description localisée"
    }
  ];
  const assets = localizationAssets.map((asset) => {
    const bytes = encoder.encode(canonicalVfxPackageJson({
      format: "minemotion-localization",
      version: 1,
      locale: asset.locale,
      entries: {
        "package.displayName": asset.displayName,
        "package.description": asset.description,
        "unrelated.application.key": "Must stay isolated"
      }
    }));
    return { ...asset, bytes };
  });
  const manifest = createVfxPackageManifest(document, {
    id: "custom.localized-sparks",
    displayName: "Manifest Sparks",
    description: "Manifest description",
    author: "Localization Tests",
    license: "MIT",
    assets: assets.map((asset) => ({
      id: asset.id,
      path: asset.path,
      kind: "localization",
      mimeType: "application/json",
      byteLength: asset.bytes.byteLength
    }))
  });
  const written = await writeVfxPackageArchive({
    manifest,
    document,
    assets: assets.map((asset) => ({ path: asset.path, bytes: asset.bytes }))
  });
  return readVfxPackageArchive(await written.blob.arrayBuffer());
}

describe("VFX package localization", () => {
  it("selects exact or language-compatible bounded package presentation", async () => {
    const archive = await fixture();
    expect(resolveVfxPackagePresentation(archive, "fr-FR")).toEqual({
      displayName: "Étincelles localisées",
      description: "Description localisée",
      locale: "fr-FR"
    });
    expect(resolveVfxPackagePresentation(archive, "fr").locale).toBe("fr-FR");
    expect(resolveVfxPackagePresentation(archive, "en-US").displayName).toBe("Localized Sparks");
  });

  it("falls back to immutable manifest content for unsupported locales", async () => {
    const archive = await fixture();
    const before = JSON.stringify(archive);
    expect(resolveVfxPackagePresentation(archive, "de-DE")).toEqual({
      displayName: "Manifest Sparks",
      description: "Manifest description",
      locale: null
    });
    expect(JSON.stringify(archive)).toBe(before);
  });
});
