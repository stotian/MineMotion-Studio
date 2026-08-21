import { useSyncExternalStore } from "react";
import {
  isExperimentalFeatureEnabled,
  subscribeExperimentalFeatures,
  type ExperimentalFeatureId
} from "./FeatureFlags";

/** Reactively read an experimental flag; re-renders when it is toggled. */
export function useExperimentalFeature(id: ExperimentalFeatureId): boolean {
  return useSyncExternalStore(
    subscribeExperimentalFeatures,
    () => isExperimentalFeatureEnabled(id),
    () => false
  );
}
