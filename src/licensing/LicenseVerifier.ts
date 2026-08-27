import type {
  LicenseClaims,
  LicenseValidationContext,
  LicenseValidationResult,
  SignedLicenseCertificate,
  TrustedLicenseKey
} from "./LicenseTypes";
import { LICENSE_PRODUCT_ID } from "./LicenseTypes";

export async function verifyLicenseCertificate(
  certificate: unknown,
  trustedKeys: readonly TrustedLicenseKey[],
  context: LicenseValidationContext
): Promise<LicenseValidationResult> {
  if (trustedKeys.length === 0) return { valid: false, reason: "UNCONFIGURED" };
  if (!isCertificate(certificate)) return { valid: false, reason: "MALFORMED" };
  const key = trustedKeys.find((candidate) => candidate.keyId === certificate.signature.keyId);
  if (!key) return { valid: false, reason: "UNKNOWN_KEY" };

  try {
    const verified = await crypto.subtle.verify(
      "Ed25519",
      await crypto.subtle.importKey("raw", toArrayBuffer(base64UrlToBytes(key.publicKey)), "Ed25519", false, ["verify"]),
      toArrayBuffer(base64UrlToBytes(certificate.signature.value)),
      new TextEncoder().encode(canonicalize({ format: certificate.format, claims: certificate.claims }))
    );
    if (!verified) return { valid: false, reason: "INVALID_SIGNATURE" };
  } catch {
    return { valid: false, reason: "INVALID_SIGNATURE" };
  }

  const claims = certificate.claims;
  if (!isClaims(claims)) return { valid: false, reason: "MALFORMED" };
  if (claims.productId !== LICENSE_PRODUCT_ID) return { valid: false, reason: "WRONG_PRODUCT" };
  const issuedAt = Date.parse(claims.issuedAt);
  const expiresAt = claims.expiresAt === null ? null : Date.parse(claims.expiresAt);
  if (!Number.isFinite(issuedAt) || (expiresAt !== null && !Number.isFinite(expiresAt))) return { valid: false, reason: "MALFORMED" };
  if (context.now.getTime() < issuedAt) return { valid: false, reason: "NOT_YET_VALID" };
  if (expiresAt !== null && context.now.getTime() > expiresAt) return { valid: false, reason: "EXPIRED" };
  if (!isVersionAllowed(context.applicationVersion, claims.minVersion, claims.maxVersion)) return { valid: false, reason: "VERSION_NOT_ALLOWED" };
  if (claims.installationIdHash !== null && claims.installationIdHash !== context.installationIdHash) {
    return { valid: false, reason: "DEVICE_NOT_ALLOWED" };
  }
  return { valid: true, claims };
}

export function hasLicensedFeature(claims: LicenseClaims, feature: string): boolean {
  return claims.features.includes(feature as never);
}

/** Stable JSON serialization required before a server signs a certificate. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
}

export function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value.");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const decoded = atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function isCertificate(value: unknown): value is SignedLicenseCertificate {
  if (!isRecord(value) || value.format !== 1 || !isRecord(value.claims) || !isRecord(value.signature)) return false;
  return value.signature.algorithm === "Ed25519" && typeof value.signature.keyId === "string" && typeof value.signature.value === "string";
}

function isClaims(value: unknown): value is LicenseClaims {
  if (!isRecord(value)) return false;
  return typeof value.licenseId === "string" && value.productId === LICENSE_PRODUCT_ID && isEdition(value.edition)
    && typeof value.customerId === "string" && typeof value.issuedAt === "string"
    && (typeof value.expiresAt === "string" || value.expiresAt === null)
    && Array.isArray(value.features) && value.features.every((feature) => typeof feature === "string")
    && typeof value.maxDevices === "number" && Number.isInteger(value.maxDevices) && value.maxDevices >= 1 && typeof value.minVersion === "string"
    && (typeof value.maxVersion === "string" || value.maxVersion === null)
    && (typeof value.installationIdHash === "string" || value.installationIdHash === null)
    && typeof value.nonce === "string";
}

function isEdition(value: unknown): boolean {
  return value === "FREE" || value === "TRIAL" || value === "PREMIUM" || value === "PRO" || value === "ENTERPRISE";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function isVersionAllowed(version: string, minimum: string, maximum: string | null): boolean {
  return compareVersions(version, minimum) >= 0 && (maximum === null || compareVersions(version, maximum) <= 0);
}

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.split(".").map((part) => /^\d+$/.test(part) ? Number(part) : NaN);
  const leftParts = parse(left);
  const rightParts = parse(right);
  if (leftParts.some(Number.isNaN) || rightParts.some(Number.isNaN)) return -1;
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
