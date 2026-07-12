export const DETERMINISTIC_SEED_NAMESPACE = "minemotion-seed-v1" as const;

export type DeterministicSeedPart = string | number;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const UINT32_MAX = 0xffffffff;
const UINT32_RANGE = 0x1_0000_0000;
const MULBERRY_INCREMENT = 0x6d2b79f5;

/**
 * Stable 32-bit FNV-1a-style hash over JavaScript UTF-16 code units.
 *
 * This is intentionally the same loop previously embedded in
 * createDeterministicId. It is a compatibility/determinism primitive, not a
 * cryptographic hash.
 */
export function hashStringToUint32(value: string): number {
  if (typeof value !== "string") {
    throw new TypeError("Deterministic hash input must be a string.");
  }

  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function encodeSeedPart(part: DeterministicSeedPart): string {
  if (typeof part === "string") {
    return `s${part.length}:${part}`;
  }
  if (!Number.isSafeInteger(part) || part < 0) {
    throw new RangeError(
      "Numeric deterministic seed parts must be non-negative safe integers."
    );
  }
  return `i${Object.is(part, -0) ? 0 : part};`;
}

/**
 * Combines typed seed coordinates without delimiter ambiguity.
 *
 * The namespace and encoding are versioned because changing either would
 * intentionally change all downstream VFX samples.
 */
export function deriveSeed(
  ...parts: readonly DeterministicSeedPart[]
): number {
  const encoded = parts.map(encodeSeedPart).join("|");
  return hashStringToUint32(`${DETERMINISTIC_SEED_NAMESPACE}|${encoded}`);
}

function assertUint32(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError(`${label} must be an unsigned 32-bit integer.`);
  }
}

/**
 * Returns one counter-addressed Mulberry32 sample.
 *
 * There is no mutable generator state: the same seed/index pair always returns
 * the same number regardless of which other samples were requested first.
 */
export function randomUint32(seed: number, sampleIndex: number): number {
  assertUint32(seed, "Deterministic random seed");
  assertUint32(sampleIndex, "Deterministic random sample index");

  let value =
    (seed + Math.imul((sampleIndex + 1) >>> 0, MULBERRY_INCREMENT)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return (value ^ (value >>> 14)) >>> 0;
}

/** Returns one exact deterministic sample in the half-open range [0, 1). */
export function randomFloat01(seed: number, sampleIndex: number): number {
  return randomUint32(seed, sampleIndex) / UINT32_RANGE;
}
