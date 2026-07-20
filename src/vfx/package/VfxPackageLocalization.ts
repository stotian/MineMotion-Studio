import { resolveVfxPackageAsset } from "./VfxPackageAssetResolver";
import type { VfxPackageArchive } from "./VfxPackageTypes";

export const VFX_PACKAGE_PRESENTATION_KEYS = Object.freeze({
  displayName: "package.displayName",
  description: "package.description"
} as const);

export interface VfxPackagePresentation {
  displayName: string;
  description: string;
  locale: string | null;
}

function localeRank(candidate: string, requested: string): number {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedRequested = requested.toLowerCase();
  if (normalizedCandidate === normalizedRequested) return 0;
  const requestedLanguage = normalizedRequested.split("-")[0];
  const candidateLanguage = normalizedCandidate.split("-")[0];
  if (candidateLanguage !== requestedLanguage) return Number.POSITIVE_INFINITY;
  return normalizedCandidate === requestedLanguage ? 1 : 2;
}

/**
 * Resolves only the two package-owned presentation fields. Localization
 * assets are already schema-validated, bounded JSON; no package code or
 * arbitrary application translation key can be executed or overridden.
 */
export function resolveVfxPackagePresentation(
  archive: VfxPackageArchive,
  requestedLocale: string
): VfxPackagePresentation {
  const candidates = archive.manifest.assets
    .filter((asset) => asset.kind === "localization")
    .map((asset) => resolveVfxPackageAsset(archive, asset.id))
    .filter((asset) => asset.kind === "localization")
    .map((asset) => ({ asset, rank: localeRank(asset.locale, requestedLocale) }))
    .filter((candidate) => Number.isFinite(candidate.rank))
    .sort((left, right) => left.rank - right.rank || left.asset.id.localeCompare(right.asset.id));
  const selected = candidates[0]?.asset;
  if (!selected) {
    return Object.freeze({
      displayName: archive.manifest.displayName,
      description: archive.manifest.description,
      locale: null
    });
  }
  return Object.freeze({
    displayName: selected.entries[VFX_PACKAGE_PRESENTATION_KEYS.displayName] ?? archive.manifest.displayName,
    description: selected.entries[VFX_PACKAGE_PRESENTATION_KEYS.description] ?? archive.manifest.description,
    locale: selected.locale
  });
}
