export const LICENSE_PRODUCT_ID = "minemotion-studio" as const;

export type LicenseEdition = "FREE" | "TRIAL" | "PREMIUM" | "PRO" | "ENTERPRISE";
export type LicensedFeature =
  | "basic-editor"
  | "watermark-free-export"
  | "high-resolution-export"
  | "production-workspaces"
  | "commercial-use"
  | "team-seats"
  | "priority-support";

export interface LicenseClaims {
  licenseId: string;
  productId: typeof LICENSE_PRODUCT_ID;
  edition: LicenseEdition;
  customerId: string;
  issuedAt: string;
  expiresAt: string | null;
  features: readonly LicensedFeature[];
  maxDevices: number;
  minVersion: string;
  maxVersion: string | null;
  installationIdHash: string | null;
  nonce: string;
}

export interface SignedLicenseCertificate {
  format: 1;
  claims: LicenseClaims;
  signature: {
    algorithm: "Ed25519";
    keyId: string;
    value: string;
  };
}

export interface TrustedLicenseKey {
  keyId: string;
  algorithm: "Ed25519";
  /** Ed25519 raw public key, base64url encoded. Never place a private key here. */
  publicKey: string;
}

export interface LicenseValidationContext {
  applicationVersion: string;
  installationIdHash: string;
  now: Date;
}

export type LicenseValidationFailure =
  | "UNCONFIGURED"
  | "MALFORMED"
  | "UNKNOWN_KEY"
  | "INVALID_SIGNATURE"
  | "WRONG_PRODUCT"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "VERSION_NOT_ALLOWED"
  | "DEVICE_NOT_ALLOWED";

export type LicenseValidationResult =
  | { valid: true; claims: LicenseClaims }
  | { valid: false; reason: LicenseValidationFailure };

export interface OfflineLease {
  leaseId: string;
  licenseId: string;
  installationIdHash: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
}
