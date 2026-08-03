import { PackageReader } from "../project/package/PackageReader";
export type CorruptionKind = "truncated" | "crc-byte-flip" | "invalid-header" | "oversized-index";
export interface CorruptionResult { kind: CorruptionKind; rejected: boolean; message: string; }
export function createCorruptPackage(source: Uint8Array, kind: CorruptionKind): Uint8Array {
  if (kind === "truncated") return source.slice(0, Math.max(0, source.length - Math.min(32, source.length)));
  const copy = source.slice();
  if (kind === "invalid-header") { if (copy.length > 0) copy[0] ^= 0xff; return copy; }
  if (kind === "crc-byte-flip") { if (copy.length > 48) copy[Math.floor(copy.length / 2)] ^= 0x5a; return copy; }
  const marker = new TextEncoder().encode('"assets"');
  const index = findSubarray(copy, marker);
  if (index >= 0) copy[index] = 0x21;
  return copy;
}
export function evaluateCorruption(source: Uint8Array, kinds: CorruptionKind[] = ["truncated", "crc-byte-flip", "invalid-header", "oversized-index"]): CorruptionResult[] {
  return kinds.map((kind) => {
    try { PackageReader.parseBytes(createCorruptPackage(source, kind)); return { kind, rejected: false, message: "accepted" }; }
    catch (error) { return { kind, rejected: true, message: error instanceof Error ? error.message : String(error) }; }
  });
}
function findSubarray(source: Uint8Array, target: Uint8Array): number {
  outer: for (let index = 0; index <= source.length - target.length; index += 1) {
    for (let offset = 0; offset < target.length; offset += 1) if (source[index + offset] !== target[offset]) continue outer;
    return index;
  }
  return -1;
}
