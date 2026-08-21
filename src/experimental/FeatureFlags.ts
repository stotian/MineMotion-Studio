export type ExperimentalFeatureId =
  | "procedural-crowds"
  | "build-sequencer"
  | "isometric-turntable";
const STORAGE_PREFIX = "minemotion.experimental.";

/** Every experimental feature, with the order shown in settings. */
export const EXPERIMENTAL_FEATURE_IDS: readonly ExperimentalFeatureId[] = [
  "build-sequencer",
  "isometric-turntable",
  "procedural-crowds"
];

const listeners = new Set<() => void>();

export function isExperimentalFeatureEnabled(id: ExperimentalFeatureId): boolean {
  if (typeof window === "undefined") return false;
  const requested = new URLSearchParams(window.location.search).getAll("feature");
  return requested.includes(id) || window.localStorage.getItem(`${STORAGE_PREFIX}${id}`) === "enabled";
}

export function setExperimentalFeatureEnabled(id: ExperimentalFeatureId, enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, "enabled");
  else window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  for (const listener of listeners) listener();
}

/** Subscribe to enable/disable changes (for React's useSyncExternalStore). */
export function subscribeExperimentalFeatures(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
