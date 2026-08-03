import type { AssetLibraryData, AssetRecord } from "./AssetRecord";
import { normalizeAssetRecord } from "./AssetCatalog";

export interface RelinkCandidate {
  displayPath: string;
  name: string;
  sizeBytes: number;
  hash?: string;
  lastModified?: number;
}

export interface RelinkMatch {
  assetId: string;
  confidence: "exact-hash" | "name-and-size" | "name-only";
  candidate: RelinkCandidate;
}

export function findRelinkMatches(record: AssetRecord, candidates: readonly RelinkCandidate[]): RelinkMatch[] {
  return candidates
    .map((candidate): RelinkMatch | null => {
      if (candidate.hash && record.hash && candidate.hash === record.hash) {
        return { assetId: record.id, confidence: "exact-hash", candidate };
      }
      if (candidate.name === record.name && candidate.sizeBytes === record.sizeBytes) {
        return { assetId: record.id, confidence: "name-and-size", candidate };
      }
      if (candidate.name === record.name) {
        return { assetId: record.id, confidence: "name-only", candidate };
      }
      return null;
    })
    .filter((match): match is RelinkMatch => match !== null)
    .sort((left, right) => rank(left.confidence) - rank(right.confidence));
}

export function applyRelink(
  library: AssetLibraryData,
  assetId: string,
  candidate: RelinkCandidate,
  checkedAt = new Date().toISOString()
): AssetLibraryData {
  return {
    ...library,
    warnings: library.warnings.filter((warning) => !warning.includes(assetId)),
    records: library.records.map((record) => {
      if (record.id !== assetId) return record;
      return normalizeAssetRecord({
        ...record,
        sourcePath: candidate.displayPath,
        sizeBytes: candidate.sizeBytes,
        hash: candidate.hash ?? record.hash,
        missing: false,
        source: {
          ...record.source,
          kind: "file",
          displayPath: candidate.displayPath,
          lastModified: candidate.lastModified
        },
        integrity: {
          status: candidate.hash && record.hash && candidate.hash !== record.hash ? "corrupt" : "verified",
          checkedAt,
          expectedHash: record.hash,
          message: candidate.hash && record.hash && candidate.hash !== record.hash
            ? "Relinked file does not match the expected content hash."
            : undefined
        }
      });
    })
  };
}

function rank(confidence: RelinkMatch["confidence"]): number {
  return confidence === "exact-hash" ? 0 : confidence === "name-and-size" ? 1 : 2;
}
