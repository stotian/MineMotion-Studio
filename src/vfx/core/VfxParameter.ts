export type VfxParameterValue = string | number | boolean;

export function isVfxParameterValue(value: unknown): value is VfxParameterValue {
  return (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
