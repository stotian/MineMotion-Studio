export type ExperimentalFeatureId = "procedural-crowds";
const STORAGE_PREFIX = "minemotion.experimental.";
export function isExperimentalFeatureEnabled(id: ExperimentalFeatureId): boolean {
  if (typeof window === "undefined") return false;
  const requested = new URLSearchParams(window.location.search).getAll("feature");
  return requested.includes(id) || window.localStorage.getItem(`${STORAGE_PREFIX}${id}`) === "enabled";
}
export function setExperimentalFeatureEnabled(id: ExperimentalFeatureId, enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, "enabled");
  else window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
}
