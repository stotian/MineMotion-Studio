import { describe, expect, it } from "vitest";
import { createBlankVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import { readVfxPackageArchive } from "./VfxPackageArchiveReader";
import { createVfxPackageManifest, writeVfxPackageArchive } from "./VfxPackageArchiveWriter";
import { resolveVfxPackageAsset } from "./VfxPackageAssetResolver";
import type { VfxPackageAssetManifest, VfxPackagePermission } from "./VfxPackageTypes";

const encoder = new TextEncoder();

function json(value: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(value));
}

async function assetArchive(
  assets: VfxPackageAssetManifest[],
  bytes: Array<{ path: string; bytes: Uint8Array }>,
  permissions: VfxPackagePermission[] = []
) {
  const document = createBlankVfxAuthoringDocument("custom.assets", "Asset Package");
  const manifest = createVfxPackageManifest(document, {
    author: "Asset Tests",
    license: "MIT",
    assets,
    permissions
  });
  const result = await writeVfxPackageArchive({ manifest, document, assets: bytes });
  return readVfxPackageArchive(await result.blob.arrayBuffer());
}

describe("VFX package asset resolver", () => {
  it("resolves declared texture, sprite, and thumbnail PNG assets", async () => {
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (character) => character.charCodeAt(0));
    const kinds = ["texture", "sprite", "thumbnail"] as const;
    const assets = kinds.map((kind) => ({ id: kind, path: `assets/${kind}.png`, kind, mimeType: "image/png", byteLength: png.byteLength, width: 1, height: 1 }));
    const archive = await assetArchive(assets, assets.map((asset) => ({ path: asset.path, bytes: png })), ["asset-textures"]);
    for (const kind of kinds) {
      expect(resolveVfxPackageAsset(archive, kind)).toMatchObject({ kind, width: 1, height: 1 });
    }
  });

  it("resolves bounded model, gradient, curve, and localization JSON", async () => {
    const values = [
      ["model", { format: "minemotion-box-model", version: 1, boxes: [{ id: "core", center: [0, 1, 0], size: [1, 2, 1], color: "#33ccff" }] }],
      ["gradient", { format: "minemotion-gradient", version: 1, interpolation: "linear", stops: [{ position: 0, color: "#000000" }, { position: 1, color: "#ffffff" }] }],
      ["curve", { format: "minemotion-curve", version: 1, interpolation: "smooth", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }],
      ["localization", { format: "minemotion-localization", version: 1, locale: "fr-FR", entries: { "custom.assets.name": "Effet" } }]
    ] as const;
    const manifests = values.map(([kind, value]) => ({ id: kind, path: `assets/${kind}.json`, kind, mimeType: "application/json", byteLength: json(value).byteLength } as VfxPackageAssetManifest));
    const archive = await assetArchive(manifests, values.map(([kind, value]) => ({ path: `assets/${kind}.json`, bytes: json(value) })), ["asset-models"]);
    expect(resolveVfxPackageAsset(archive, "model")).toMatchObject({ kind: "model", boxes: [{ id: "core" }] });
    expect(resolveVfxPackageAsset(archive, "gradient")).toMatchObject({ kind: "gradient", interpolation: "linear" });
    expect(resolveVfxPackageAsset(archive, "curve")).toMatchObject({ kind: "curve", interpolation: "smooth" });
    expect(resolveVfxPackageAsset(archive, "localization")).toMatchObject({ kind: "localization", locale: "fr-FR" });
  });

  it("validates audio signatures and returns bounded data URLs", async () => {
    const wav = Uint8Array.from([...encoder.encode("RIFF"), 0, 0, 0, 0, ...encoder.encode("WAVE")]);
    const asset: VfxPackageAssetManifest = { id: "sound", path: "assets/sound.wav", kind: "audio", mimeType: "audio/wav", byteLength: wav.byteLength, license: "CC0-1.0" };
    const archive = await assetArchive([asset], [{ path: asset.path, bytes: wav }], ["asset-audio"]);
    expect(resolveVfxPackageAsset(archive, "sound")).toMatchObject({ kind: "audio", mimeType: "audio/wav", byteLength: 12 });
    await expect(assetArchive([asset], [{ path: asset.path, bytes: new Uint8Array(wav.byteLength) }], ["asset-audio"])).rejects.toThrow("Audio signature");
  });

  it("resolves only closed shader templates and uses a real fallback when unavailable", async () => {
    const value = { format: "minemotion-restricted-shader-template", version: 1, templateId: "pixel-dissolve", parameters: { threshold: 0.5, edgeWidth: 0.1, edgeColor: "#ffcc00" } };
    const bytes = json(value);
    const asset: VfxPackageAssetManifest = { id: "shader", path: "assets/shader.json", kind: "restricted-shader-template", mimeType: "application/json", byteLength: bytes.byteLength };
    const archive = await assetArchive([asset], [{ path: asset.path, bytes }], ["restricted-shader-templates"]);
    expect(resolveVfxPackageAsset(archive, "shader", new Set())).toMatchObject({
      kind: "restricted-shader-template",
      templateId: "pixel-dissolve",
      activeTemplateId: null,
      fallback: "primitive-default-material"
    });
    const unsafe = json({ ...value, source: "void main(){}" });
    await expect(assetArchive([{ ...asset, byteLength: unsafe.byteLength }], [{ path: asset.path, bytes: unsafe }], ["restricted-shader-templates"])).rejects.toThrow("template asset is invalid");
  });

  it("rejects excessive JSON depth, unordered curves, unsafe colors, and unknown assets", async () => {
    const badCurve = json({ format: "minemotion-curve", version: 1, interpolation: "linear", points: [{ x: 0.8, y: 0 }, { x: 0.2, y: 1 }] });
    const asset: VfxPackageAssetManifest = { id: "curve", path: "assets/curve.json", kind: "curve", mimeType: "application/json", byteLength: badCurve.byteLength };
    await expect(assetArchive([asset], [{ path: asset.path, bytes: badCurve }])).rejects.toThrow("unordered");

    let nested: unknown = "leaf";
    for (let index = 0; index < 18; index += 1) nested = [nested];
    const deep = json(nested);
    const deepAsset: VfxPackageAssetManifest = { id: "deep", path: "assets/deep.json", kind: "curve", mimeType: "application/json", byteLength: deep.byteLength };
    await expect(assetArchive([deepAsset], [{ path: deepAsset.path, bytes: deep }])).rejects.toThrow("structural limits");

    const validCurve = json({ format: "minemotion-curve", version: 1, interpolation: "linear", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
    const archive = await assetArchive([{ ...asset, byteLength: validCurve.byteLength }], [{ path: asset.path, bytes: validCurve }]);
    expect(() => resolveVfxPackageAsset(archive, "missing")).toThrow("not declared");
  });
});
