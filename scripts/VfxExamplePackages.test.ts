import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readVfxPackageArchive } from "../src/vfx/package/VfxPackageArchiveReader";
import {
  createVfxPackageManifest,
  writeVfxPackageArchive
} from "../src/vfx/package/VfxPackageArchiveWriter";
import type { VfxAuthoringDocument } from "../src/vfx/authoring/VfxAuthoringTypes";

const EXAMPLES = [
  {
    source: "ember-ring.effect.json",
    id: "minemotion.examples.ember-ring",
    version: "1.0.0",
    author: "MineMotion Studio",
    license: "CC0-1.0"
  },
  {
    source: "soul-portal.effect.json",
    id: "minemotion.examples.soul-portal",
    version: "1.0.0",
    author: "MineMotion Studio",
    license: "CC0-1.0"
  }
] as const;

const root = resolve(process.cwd(), "examples", "vfx");
const outputDirectory = resolve(root, "packages");
const update = process.env.UPDATE_VFX_EXAMPLES === "1";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("shipped safe VFX example packages", () => {
  it("are deterministic, reader-valid, and synchronized with declarative sources", async () => {
    mkdirSync(outputDirectory, { recursive: true });
    const checksums: Record<string, string> = {};
    for (const example of EXAMPLES) {
      const document = JSON.parse(
        readFileSync(resolve(root, "sources", example.source), "utf8")
      ) as VfxAuthoringDocument;
      const manifest = createVfxPackageManifest(document, {
        id: example.id,
        packageVersion: example.version,
        author: example.author,
        license: example.license
      });
      const result = await writeVfxPackageArchive({ manifest, document });
      const bytes = new Uint8Array(await result.blob.arrayBuffer());
      const outputPath = resolve(outputDirectory, result.filename);
      if (update) writeFileSync(outputPath, bytes);
      const committed = readFileSync(outputPath);
      expect(Buffer.compare(committed, Buffer.from(bytes)), result.filename).toBe(0);
      const archiveBuffer = committed.buffer.slice(
        committed.byteOffset,
        committed.byteOffset + committed.byteLength
      ) as ArrayBuffer;
      const archive = await readVfxPackageArchive(archiveBuffer);
      expect(archive.manifest.id).toBe(example.id);
      expect(archive.document).toEqual(document);
      checksums[result.filename] = sha256(bytes);
    }
    const checksumText = `${JSON.stringify(checksums, null, 2)}\n`;
    const checksumPath = resolve(root, "checksums.json");
    if (update) writeFileSync(checksumPath, checksumText, "utf8");
    expect(readFileSync(checksumPath, "utf8")).toBe(checksumText);
  });
});
