export type VfxParameterValue = string | number | boolean;

export const MAX_VFX_PARAMETER_ID_LENGTH = 128;
export const MAX_VFX_PARAMETER_STRING_LENGTH = 4_096;

const SAFE_VFX_HEX_COLOR_PATTERN =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const SAFE_VFX_NAMED_COLOR_PATTERN = /^[a-z]{1,64}$/i;

export function isSafeVfxColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (SAFE_VFX_HEX_COLOR_PATTERN.test(value) ||
      SAFE_VFX_NAMED_COLOR_PATTERN.test(value))
  );
}

export function isVfxParameterValue(value: unknown): value is VfxParameterValue {
  return (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
