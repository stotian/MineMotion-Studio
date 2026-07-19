import packageMetadata from "../../../package.json";
import { compileVfxAuthoringDocument } from "../authoring/VfxAuthoringCompiler";
import { validateVfxPackageAssets } from "./VfxPackageAssetResolver";
import { validateVfxAuthoringDocument } from "../authoring/VfxAuthoringDocument";
import {
  VFX_PACKAGE_EFFECT_PATH,
  VFX_PACKAGE_LIMITS,
  VFX_PACKAGE_MANIFEST_PATH,
  type VfxPackageArchive,
  type VfxPackageArchiveEntry,
  type VfxPackageAssetManifest
} from "./VfxPackageTypes";
import {
  validateVfxPackageManifest,
  validVfxPackagePath
} from "./VfxPackageValidator";

const FORBIDDEN_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".wasm", ".exe",
  ".dll", ".bat", ".cmd", ".ps1", ".sh", ".glsl", ".vert", ".frag", ".wgsl"
]);
const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

export class VfxPackageFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VfxPackageFormatError";
  }
}

function fail(message: string): never {
  throw new VfxPackageFormatError(message);
}

function assertRange(total: number, offset: number, length: number, label: string): void {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > total) fail(`ZIP ${label} is outside the archive.`);
}

function signature(view: DataView, offset: number, expected: number, label: string): void {
  assertRange(view.byteLength, offset, 4, label);
  if (view.getUint32(offset, true) !== expected) fail(`Invalid ZIP ${label}.`);
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail(`${label} is not valid UTF-8.`);
  }
}

function findEocd(bytes: Uint8Array, view: DataView): number {
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4b || bytes[offset + 2] !== 0x05 || bytes[offset + 3] !== 0x06) continue;
    assertRange(bytes.length, offset, 22, "end of central directory");
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + 22 + commentLength === bytes.length) return offset;
  }
  return fail("The file is not a valid ZIP archive.");
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function inflateRawBounded(
  compressed: Uint8Array,
  expectedSize: number
): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") fail("This runtime cannot decompress deflated VFX packages.");
  const stream = new Blob([compressed.slice()]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > expectedSize || total > VFX_PACKAGE_LIMITS.entryBytes) {
        await reader.cancel();
        fail("ZIP entry expands beyond its declared or supported size.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function forbiddenPath(path: string): boolean {
  const lower = path.toLowerCase();
  return [...FORBIDDEN_EXTENSIONS].some((extension) => lower.endsWith(extension));
}

async function readEntries(buffer: ArrayBuffer): Promise<VfxPackageArchiveEntry[]> {
  if (buffer.byteLength > VFX_PACKAGE_LIMITS.archiveBytes) fail("VFX package exceeds the 32 MB archive limit.");
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocd = findEocd(bytes, view);
  const disk = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== entryCount) fail("Multi-disk ZIP packages are not supported.");
  if (entryCount > VFX_PACKAGE_LIMITS.entries) fail(`VFX package has too many entries (${entryCount}).`);
  assertRange(bytes.length, centralOffset, centralSize, "central directory");
  if (centralOffset + centralSize > eocd) fail("ZIP central directory overlaps the end record.");

  const entries: VfxPackageArchiveEntry[] = [];
  const paths = new Set<string>();
  const localRanges: Array<{ start: number; end: number }> = [];
  let totalUncompressed = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    signature(view, offset, 0x02014b50, "central directory entry");
    assertRange(bytes.length, offset, 46, "central directory entry");
    const madeBy = view.getUint16(offset + 4, true) >>> 8;
    const flags = view.getUint16(offset + 8, true);
    const compression = view.getUint16(offset + 10, true);
    const checksum = view.getUint32(offset + 16, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const externalAttributes = view.getUint32(offset + 38, true);
    const localOffset = view.getUint32(offset + 42, true);
    if (flags & 0x1) fail("Encrypted ZIP entries are not supported.");
    if ((flags & ~(0x8 | 0x800)) !== 0) fail("ZIP entry uses unsupported flags.");
    if (compression !== 0 && compression !== 8) fail(`Unsupported ZIP compression method ${compression}.`);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) fail("ZIP64 VFX packages are not supported.");
    if (nameLength === 0 || nameLength > VFX_PACKAGE_LIMITS.pathBytes) fail("ZIP entry path length is invalid.");
    assertRange(bytes.length, offset + 46, nameLength + extraLength + commentLength, "central directory variable data");
    const path = decodeUtf8(bytes.subarray(offset + 46, offset + 46 + nameLength), "ZIP entry path");
    offset += 46 + nameLength + extraLength + commentLength;
    if (madeBy === 3 && ((externalAttributes >>> 16) & 0xf000) === 0xa000) fail(`Symbolic links are not supported: ${path}.`);
    if (path.endsWith("/")) fail(`Explicit ZIP directory entries are not supported: ${path}.`);
    if (!validVfxPackagePath(path)) fail(`Unsafe VFX package path: ${path}.`);
    if (forbiddenPath(path)) fail(`Executable or unrestricted shader content is forbidden: ${path}.`);
    const folded = path.toLocaleLowerCase("en-US");
    if (paths.has(folded)) fail(`Duplicate VFX package path: ${path}.`);
    paths.add(folded);
    if (compressedSize > VFX_PACKAGE_LIMITS.entryBytes || uncompressedSize > VFX_PACKAGE_LIMITS.entryBytes) fail(`ZIP entry exceeds the 16 MB limit: ${path}.`);
    if (compressedSize === 0 && uncompressedSize > 0) fail(`ZIP entry has an invalid compression ratio: ${path}.`);
    if (uncompressedSize > 1024 * 1024 && uncompressedSize > compressedSize * VFX_PACKAGE_LIMITS.compressionRatio) fail(`ZIP entry compression ratio is unsafe: ${path}.`);
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > VFX_PACKAGE_LIMITS.totalUncompressedBytes) fail("VFX package expands beyond the 64 MB limit.");

    signature(view, localOffset, 0x04034b50, "local file header");
    assertRange(bytes.length, localOffset, 30, "local file header");
    const localFlags = view.getUint16(localOffset + 6, true);
    const localCompression = view.getUint16(localOffset + 8, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    assertRange(bytes.length, localOffset + 30, localNameLength + localExtraLength, "local file metadata");
    const localPath = decodeUtf8(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength), "ZIP local entry path");
    if (localPath !== path || localFlags !== flags || localCompression !== compression) fail(`ZIP local/central metadata mismatch for ${path}.`);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    assertRange(bytes.length, dataOffset, compressedSize, `entry data for ${path}`);
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    if (localOffset >= centralOffset || dataOffset + compressedSize > centralOffset) fail(`ZIP entry overlaps the central directory: ${path}.`);
    const localRange = { start: localOffset, end: dataOffset + compressedSize };
    if (localRanges.some((range) => localRange.start < range.end && localRange.end > range.start)) fail(`ZIP local entries overlap: ${path}.`);
    localRanges.push(localRange);
    let output: Uint8Array;
    try {
      output = compression === 0 ? compressed : await inflateRawBounded(compressed, uncompressedSize);
    } catch (error) {
      if (error instanceof VfxPackageFormatError) throw error;
      return fail(`Could not decompress VFX package entry: ${path}.`);
    }
    if (output.byteLength !== uncompressedSize) fail(`ZIP entry size mismatch for ${path}.`);
    if (crc32(output) !== checksum) fail(`ZIP entry checksum mismatch for ${path}.`);
    entries.push(Object.freeze({ path, bytes: output, compressedSize, uncompressedSize }));
  }
  if (offset !== centralOffset + centralSize) fail("ZIP central directory size is inconsistent.");
  return entries;
}

function parseJson(entry: VfxPackageArchiveEntry, label: string): unknown {
  try {
    return JSON.parse(decodeUtf8(entry.bytes, label));
  } catch (error) {
    if (error instanceof VfxPackageFormatError) throw error;
    return fail(`${label} is not valid JSON.`);
  }
}

function compareSemver(left: string, right: string): number {
  const a = left.split("-")[0].split(".").map(Number);
  const b = right.split("-")[0].split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

function inspectPng(entry: VfxPackageArchiveEntry, asset: VfxPackageAssetManifest): void {
  const bytes = entry.bytes;
  const signatureBytes = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || !signatureBytes.every((value, index) => bytes[index] === value)) fail(`PNG signature is invalid: ${asset.path}.`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8, false) !== 13 || decodeUtf8(bytes.subarray(12, 16), "PNG chunk type") !== "IHDR" || crc32(bytes.subarray(12, 29)) !== view.getUint32(29, false)) fail(`PNG IHDR is invalid: ${asset.path}.`);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (width !== asset.width || height !== asset.height || width < 1 || height < 1 || width > VFX_PACKAGE_LIMITS.imageDimension || height > VFX_PACKAGE_LIMITS.imageDimension) fail(`PNG dimensions do not match the bounded manifest: ${asset.path}.`);
}

export async function readVfxPackageArchive(buffer: ArrayBuffer): Promise<VfxPackageArchive> {
  const entries = await readEntries(buffer);
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const manifestEntry = byPath.get(VFX_PACKAGE_MANIFEST_PATH);
  const effectEntry = byPath.get(VFX_PACKAGE_EFFECT_PATH);
  if (!manifestEntry || !effectEntry) fail("VFX package requires manifest.json and effect.json.");
  const manifestValidation = validateVfxPackageManifest(parseJson(manifestEntry, "VFX package manifest"));
  if (!manifestValidation.ok) fail(manifestValidation.errors.map((entry) => `${entry.path}: ${entry.message}`).join(" "));
  const manifest = manifestValidation.value;
  if (compareSemver(packageMetadata.version, manifest.minStudioVersion) < 0) fail(`VFX package requires MineMotion Studio ${manifest.minStudioVersion} or newer.`);
  const documentValidation = validateVfxAuthoringDocument(parseJson(effectEntry, "VFX authoring document"));
  if (!documentValidation.ok) fail(documentValidation.errors.map((entry) => `${entry.path}: ${entry.message}`).join(" "));
  if (documentValidation.value.id !== manifest.effect.documentId) fail("Manifest effect document ID does not match effect.json.");
  const compilation = compileVfxAuthoringDocument(documentValidation.value);
  if (!compilation.ok) fail(`VFX authoring document exceeds runtime validation or budgets. ${compilation.errors.map((entry) => entry.message).join(" ")}`);

  const declared = new Set([VFX_PACKAGE_MANIFEST_PATH, VFX_PACKAGE_EFFECT_PATH]);
  for (const asset of manifest.assets) {
    const entry = byPath.get(asset.path);
    if (!entry) fail(`Declared VFX asset is missing: ${asset.path}.`);
    if (entry.uncompressedSize !== asset.byteLength) fail(`VFX asset byte length mismatch: ${asset.path}.`);
    if (asset.kind === "texture" || asset.kind === "sprite" || asset.kind === "thumbnail") inspectPng(entry, asset);
    declared.add(asset.path);
  }
  for (const entry of entries) if (!declared.has(entry.path)) fail(`VFX package contains an undeclared file: ${entry.path}.`);
  const archive = Object.freeze({ manifest, document: documentValidation.value, entries: Object.freeze(entries) });
  try {
    validateVfxPackageAssets(archive);
  } catch (error) {
    fail(error instanceof Error ? error.message : "VFX package asset validation failed.");
  }
  return archive;
}
