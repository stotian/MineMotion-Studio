import type { AssetType } from "./AssetRecord";

export const ASSET_IMPORT_LIMITS = Object.freeze({
  maxFilesPerDrop: 512,
  maxFileBytes: 256 * 1024 * 1024,
  maxTotalBytes: 1024 * 1024 * 1024,
  maxImagePixels: 67_108_864,
  maxArchiveEntries: 20_000
});

export interface AssetImportCandidate {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface AssetImportReportEntry {
  name: string;
  status: "accepted" | "rejected" | "unsupported" | "duplicate";
  assetType?: AssetType;
  message: string;
}

export interface AssetImportReport {
  accepted: AssetImportReportEntry[];
  rejected: AssetImportReportEntry[];
  totalBytes: number;
  truncated: boolean;
}

const EXTENSION_TYPES: Readonly<Record<string, AssetType>> = {
  obj: "objModel",
  gltf: "gltfModel",
  glb: "gltfModel",
  bbmodel: "blockbenchModel",
  wav: "audio",
  mp3: "audio",
  ogg: "audio",
  flac: "audio",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  zip: "resourcePack",
  minemotion: "projectTemplate",
  json: "preset"
};

export function classifyAssetCandidate(candidate: AssetImportCandidate): AssetType | null {
  const extension = candidate.name.split(".").pop()?.toLocaleLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? (candidate.type?.startsWith("image/") ? "image" : candidate.type?.startsWith("audio/") ? "audio" : null);
}

export function validateAssetImportBatch(
  candidates: readonly AssetImportCandidate[],
  existingHashes: ReadonlyMap<string, string> = new Map()
): AssetImportReport {
  const accepted: AssetImportReportEntry[] = [];
  const rejected: AssetImportReportEntry[] = [];
  let totalBytes = 0;
  const limited = candidates.slice(0, ASSET_IMPORT_LIMITS.maxFilesPerDrop);
  for (const candidate of limited) {
    totalBytes += Math.max(0, candidate.size);
    const assetType = classifyAssetCandidate(candidate);
    if (!assetType) {
      rejected.push({ name: candidate.name, status: "unsupported", message: "Unsupported file type." });
      continue;
    }
    if (candidate.size > ASSET_IMPORT_LIMITS.maxFileBytes) {
      rejected.push({ name: candidate.name, status: "rejected", assetType, message: "File exceeds the per-file safety limit." });
      continue;
    }
    if (totalBytes > ASSET_IMPORT_LIMITS.maxTotalBytes) {
      rejected.push({ name: candidate.name, status: "rejected", assetType, message: "Import batch exceeds the total safety limit." });
      continue;
    }
    const duplicateId = existingHashes.get(`${candidate.name}:${candidate.size}`);
    if (duplicateId) {
      rejected.push({ name: candidate.name, status: "duplicate", assetType, message: `Possible duplicate of ${duplicateId}.` });
      continue;
    }
    accepted.push({ name: candidate.name, status: "accepted", assetType, message: "Ready to import." });
  }
  return { accepted, rejected, totalBytes, truncated: candidates.length > limited.length };
}

export function readPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (!width || !height || width * height > ASSET_IMPORT_LIMITS.maxImagePixels) return null;
  return { width, height };
}
