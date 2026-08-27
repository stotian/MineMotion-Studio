import type { TrustedLicenseKey } from "./LicenseTypes";

/**
 * Production keys are public and may be shipped with the app. Add a key only
 * after the licensing service has generated and protected its private half.
 */
export const LICENSE_PUBLIC_KEYS: readonly TrustedLicenseKey[] = Object.freeze([]);
