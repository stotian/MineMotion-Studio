import { hashStringToUint32 } from "../random/DeterministicRandom";

export interface IdEntropy {
  now(): number;
  randomToken(): string;
}

const DEFAULT_ID_ENTROPY: IdEntropy = {
  now: () => Date.now(),
  randomToken: () => {
    const uuid = globalThis.crypto?.randomUUID?.();
    return uuid ?? Math.random().toString(36).slice(2);
  }
};

export function normalizeIdPrefix(prefix: string): string {
  const normalized = prefix
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!/[a-zA-Z0-9]/.test(normalized)) {
    throw new RangeError("An ID prefix must contain at least one letter or number.");
  }

  return normalized;
}

export function createId(
  prefix: string,
  entropy: IdEntropy = DEFAULT_ID_ENTROPY
): string {
  const time = Math.max(0, Math.floor(entropy.now())).toString(36);
  const random = entropy
    .randomToken()
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase()
    .slice(0, 12);

  return `${normalizeIdPrefix(prefix)}_${time}_${random || "0"}`;
}

/** Produces stable content IDs. It is not suitable for secrets or random effects. */
export function createDeterministicId(prefix: string, seed: string): string {
  return `${normalizeIdPrefix(prefix)}_${hashStringToUint32(seed).toString(36)}`;
}
