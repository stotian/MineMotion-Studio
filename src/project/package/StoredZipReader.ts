const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_FILE_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 4096;

export interface StoredZipEntry { filename: string; data: Uint8Array; }

export function looksLikeStoredZip(data: Uint8Array): boolean {
  return data.length >= 4 && new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true) === LOCAL_FILE_HEADER;
}

export function readStoredZip(data: Uint8Array): StoredZipEntry[] {
  if (data.byteLength > MAX_ARCHIVE_BYTES) throw new Error("Package archive exceeds the 256 MiB safety limit.");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const entries: StoredZipEntry[] = [];
  const names = new Set<string>();
  let offset = 0;
  let total = 0;

  while (offset + 4 <= data.length) {
    const signature = view.getUint32(offset, true);
    if (signature === CENTRAL_FILE_HEADER || signature === END_OF_CENTRAL_DIRECTORY) break;
    if (signature !== LOCAL_FILE_HEADER) throw new Error(`Invalid ZIP local header at byte ${offset}.`);
    if (entries.length >= MAX_ENTRIES) throw new Error("Package contains too many ZIP entries.");
    if (offset + 30 > data.length) throw new Error("Truncated ZIP local header.");

    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const expectedCrc = view.getUint32(offset + 14, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    if ((flags & 0x0008) !== 0) throw new Error("ZIP data descriptors are not supported.");
    if ((flags & 0x0001) !== 0) throw new Error("Encrypted ZIP entries are not supported.");
    if (method !== 0) throw new Error("Only bounded stored ZIP entries are supported.");
    if (compressedSize !== uncompressedSize) throw new Error("Stored ZIP entry size mismatch.");
    if (uncompressedSize > MAX_ENTRY_BYTES) throw new Error("ZIP entry exceeds the 64 MiB safety limit.");

    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > data.length) throw new Error("Truncated ZIP entry payload.");
    const filename = decoder.decode(data.subarray(nameStart, nameStart + nameLength));
    validateFilename(filename);
    if (names.has(filename)) throw new Error(`Duplicate ZIP entry: ${filename}.`);
    names.add(filename);

    const payload = data.slice(dataStart, dataEnd);
    if (crc32(payload) !== expectedCrc) throw new Error(`ZIP integrity check failed for ${filename}.`);
    total += payload.byteLength;
    if (total > MAX_TOTAL_BYTES) throw new Error("Extracted package data exceeds the 256 MiB safety limit.");
    entries.push({ filename, data: payload });
    offset = dataEnd;
  }
  if (entries.length === 0) throw new Error("ZIP package contains no readable entries.");
  validateCentralDirectory(data, view, offset, entries.length);
  return entries;
}

function validateCentralDirectory(data: Uint8Array, view: DataView, expectedOffset: number, expectedEntries: number): void {
  const minimumEnd = 22;
  const searchStart = Math.max(0, data.length - (0xffff + minimumEnd));
  let endOffset = -1;
  for (let offset = data.length - minimumEnd; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) { endOffset = offset; break; }
  }
  if (endOffset < 0) throw new Error("ZIP end-of-central-directory record is missing.");
  if (endOffset + minimumEnd > data.length) throw new Error("Truncated ZIP end-of-central-directory record.");
  const diskNumber = view.getUint16(endOffset + 4, true);
  const centralDisk = view.getUint16(endOffset + 6, true);
  const diskEntries = view.getUint16(endOffset + 8, true);
  const totalEntries = view.getUint16(endOffset + 10, true);
  const centralSize = view.getUint32(endOffset + 12, true);
  const centralOffset = view.getUint32(endOffset + 16, true);
  const commentLength = view.getUint16(endOffset + 20, true);
  if (endOffset + minimumEnd + commentLength !== data.length) throw new Error("ZIP archive contains trailing or truncated data.");
  if (diskNumber !== 0 || centralDisk !== 0 || diskEntries !== totalEntries) throw new Error("Multi-disk ZIP archives are not supported.");
  if (totalEntries !== expectedEntries) throw new Error("ZIP central-directory entry count does not match local entries.");
  if (centralOffset !== expectedOffset || centralOffset + centralSize !== endOffset) throw new Error("ZIP central-directory bounds are inconsistent.");
  let offset = centralOffset;
  let count = 0;
  while (offset < endOffset) {
    if (offset + 46 > endOffset || view.getUint32(offset, true) !== CENTRAL_FILE_HEADER) throw new Error("Invalid ZIP central-directory record.");
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentSize = view.getUint16(offset + 32, true);
    const next = offset + 46 + nameLength + extraLength + commentSize;
    if (next > endOffset) throw new Error("Truncated ZIP central-directory entry.");
    count += 1;
    offset = next;
  }
  if (offset !== endOffset || count !== expectedEntries) throw new Error("ZIP central directory is inconsistent.");
}

function validateFilename(filename: string): void {
  if (!filename || filename.length > 512 || filename.includes("\\") || filename.startsWith("/") || /^[A-Za-z]:/.test(filename)) {
    throw new Error("ZIP entry path is invalid.");
  }
  const parts = filename.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error(`Unsafe ZIP entry path: ${filename}.`);
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
