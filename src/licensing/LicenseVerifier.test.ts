import { describe, expect, it } from "vitest";
import { canonicalize, verifyLicenseCertificate } from "./LicenseVerifier";
import type { LicenseClaims, SignedLicenseCertificate } from "./LicenseTypes";

const claims: LicenseClaims = {
  licenseId: "lic_01HZY0",
  productId: "minemotion-studio",
  edition: "PRO",
  customerId: "customer_pseudonymous",
  issuedAt: "2026-08-01T00:00:00.000Z",
  expiresAt: null,
  features: ["basic-editor", "high-resolution-export"],
  maxDevices: 2,
  minVersion: "0.8.0",
  maxVersion: null,
  installationIdHash: "installation_hash",
  nonce: "unique_certificate_nonce"
};

describe("verifyLicenseCertificate", () => {
  it("accepts a certificate signed by a trusted Ed25519 key", async () => {
    const signed = await signedCertificate(claims);
    const result = await verifyLicenseCertificate(signed.certificate, [signed.key], context());
    expect(result.valid).toBe(true);
  });

  it("rejects a changed entitlement after signing", async () => {
    const signed = await signedCertificate(claims);
    const result = await verifyLicenseCertificate({
      ...signed.certificate,
      claims: { ...claims, features: ["basic-editor", "commercial-use"] }
    }, [signed.key], context());
    expect(result).toEqual({ valid: false, reason: "INVALID_SIGNATURE" });
  });

  it("rejects an expired signed certificate", async () => {
    const signed = await signedCertificate({ ...claims, expiresAt: "2026-08-10T00:00:00.000Z" });
    const result = await verifyLicenseCertificate(signed.certificate, [signed.key], context());
    expect(result).toEqual({ valid: false, reason: "EXPIRED" });
  });

  it("rejects a certificate bound to another installation", async () => {
    const signed = await signedCertificate(claims);
    const result = await verifyLicenseCertificate(signed.certificate, [signed.key], {
      ...context(), installationIdHash: "other_installation"
    });
    expect(result).toEqual({ valid: false, reason: "DEVICE_NOT_ALLOWED" });
  });

  it("uses canonical key ordering before verifying a signature", () => {
    expect(canonicalize({ z: 1, a: { b: true, a: false } })).toBe('{"a":{"a":false,"b":true},"z":1}');
  });
});

async function signedCertificate(nextClaims: LicenseClaims) {
  const pair = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const signature = await crypto.subtle.sign("Ed25519", pair.privateKey, new TextEncoder().encode(canonicalize({ format: 1, claims: nextClaims })));
  const publicKey = await crypto.subtle.exportKey("raw", pair.publicKey);
  const certificate: SignedLicenseCertificate = {
    format: 1,
    claims: nextClaims,
    signature: { algorithm: "Ed25519", keyId: "test-2026", value: bytesToBase64Url(signature) }
  };
  return { certificate, key: { algorithm: "Ed25519" as const, keyId: "test-2026", publicKey: bytesToBase64Url(publicKey) } };
}

function context() {
  return { applicationVersion: "0.8.2", installationIdHash: "installation_hash", now: new Date("2026-08-20T00:00:00.000Z") };
}

function bytesToBase64Url(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
