import {
  ResourcePackFormatError,
  ResourcePackValidationError
} from "./ResourcePackErrors";
import { normalizeResourcePath, ResourcePackScanner } from "./ResourcePackScanner";
import type {
  ResourcePackAsset,
  ResourcePackEntry,
  ResourcePackSourceKind
} from "./ResourcePackTypes";

const MAX_ENTRY_COUNT = 8192;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;

export class ResourcePackImporter {
  static async importZip(file: File): Promise<ResourcePackAsset> {
    const entries = await readZipEntries(await file.arrayBuffer());
    return ResourcePackImporter.importEntries(file.name, "zip", entries);
  }

  static async importFolder(files: FileList | File[]): Promise<ResourcePackAsset> {
    const list = Array.from(files);
    if (list.length === 0) {
      throw new ResourcePackValidationError("Choose a resource pack folder first.");
    }
    const entries = await Promise.all(
      list.map(async (file) => ({
        path: file.webkitRelativePath || file.name,
        bytes: new Uint8Array(await file.arrayBuffer())
      }))
    );
    const firstPath = entries[0]?.path.replace(/\\/g, "/") ?? "resource-pack";
    const name = firstPath.includes("/") ? firstPath.split("/")[0] : "Resource Pack";
    return ResourcePackImporter.importEntries(name, "folder", entries);
  }

  static importEntries(
    name: string,
    sourceKind: ResourcePackSourceKind,
    entries: ResourcePackEntry[]
  ): ResourcePackAsset {
    const scan = ResourcePackScanner.scan(entries);
    const id = createPackId(name);
    return {
      id,
      name: name.replace(/\.zip$/i, "") || "Resource Pack",
      sourceKind,
      metadata: scan.metadata,
      textures: scan.textures.map((texture, index) => ({
        id: `${id}_texture_${index.toString(36)}`,
        path: texture.path,
        blockName: texture.blockName,
        mimeType: "image/png",
        dataUrl: `data:image/png;base64,${encodeBase64(texture.bytes)}`,
        byteLength: texture.bytes.byteLength,
        animated: texture.animated
      })),
      importedAt: new Date().toISOString(),
      warnings: scan.warnings
    };
  }
}

export async function readZipEntries(buffer: ArrayBuffer): Promise<ResourcePackEntry[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  if (entryCount > MAX_ENTRY_COUNT) {
    throw new ResourcePackFormatError(`ZIP has too many entries (${entryCount}).`);
  }

  const entries: ResourcePackEntry[] = [];
  let totalUncompressed = 0;
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    assertSignature(view, offset, 0x02014b50, "central directory entry");
    const flags = view.getUint16(offset + 8, true);
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    if (flags & 0x1) {
      throw new ResourcePackFormatError("Encrypted ZIP entries are not supported.");
    }
    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      throw new ResourcePackFormatError("ZIP64 resource packs are not supported yet.");
    }

    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const path = normalizeResourcePath(new TextDecoder().decode(nameBytes));
    offset += 46 + nameLength + extraLength + commentLength;

    if (!path || path.endsWith("/")) continue;
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new ResourcePackFormatError("ZIP expands beyond the 512 MB import limit.");
    }

    assertSignature(view, localHeaderOffset, 0x04034b50, "local file header");
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const output =
      compression === 0
        ? compressed
        : compression === 8
          ? await inflateRaw(compressed)
          : null;

    if (!output) {
      throw new ResourcePackFormatError(
        `Unsupported ZIP compression method ${compression} for ${path}.`
      );
    }
    if (uncompressedSize !== 0 && output.byteLength !== uncompressedSize) {
      throw new ResourcePackFormatError(`ZIP entry size mismatch for ${path}.`);
    }
    entries.push({ path, bytes: output });
  }

  return entries;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimumOffset = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  throw new ResourcePackFormatError("The file is not a valid ZIP archive.");
}

function assertSignature(
  view: DataView,
  offset: number,
  expected: number,
  label: string
): void {
  if (offset < 0 || offset + 4 > view.byteLength) {
    throw new ResourcePackFormatError(`ZIP ${label} is outside the archive.`);
  }
  if (view.getUint32(offset, true) !== expected) {
    throw new ResourcePackFormatError(`Invalid ZIP ${label}.`);
  }
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new ResourcePackFormatError(
      "This runtime cannot decompress deflated ZIP resource packs."
    );
  }
  const source = new Blob([compressed.slice()]).stream();
  const decompressed = source.pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(decompressed).arrayBuffer());
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const value = (a << 16) | (b << 8) | c;
    output += alphabet[(value >> 18) & 63];
    output += alphabet[(value >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(value >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? alphabet[value & 63] : "=";
  }
  return output;
}

function createPackId(name: string): string {
  const slug = name
    .replace(/\.zip$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "pack";
  return `resource_pack_${slug}_${Date.now().toString(36)}`;
}
