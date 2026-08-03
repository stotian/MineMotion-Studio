export function createSimpleHash(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function createAssetHash(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `fnv1a-${createSimpleHash(bytes)}`;
}

export function groupDuplicateAssets<T extends { id: string; hash: string; sizeBytes: number }>(
  records: readonly T[]
): T[][] {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    if (!record.hash) continue;
    const key = `${record.hash}:${record.sizeBytes}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
