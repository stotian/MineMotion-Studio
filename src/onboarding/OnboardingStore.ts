import { ONBOARDING_STEPS, type OnboardingState, type OnboardingStepId } from "./OnboardingTypes";
const KEY = "minemotion.onboarding.v1";
const DEFAULT_STATE: OnboardingState = { version: 1, completed: [], dismissed: false, lastStep: "welcome" };
export interface OnboardingStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function loadOnboarding(storage: OnboardingStorage): OnboardingState {
  try {
    const source = JSON.parse(storage.getItem(KEY) ?? "null") as Partial<OnboardingState> | null;
    if (!source) return { ...DEFAULT_STATE };
    const known = new Set(ONBOARDING_STEPS.map((step) => step.id));
    const completed = Array.isArray(source.completed) ? source.completed.filter((id): id is OnboardingStepId => known.has(id as OnboardingStepId)) : [];
    const lastStep = known.has(source.lastStep as OnboardingStepId) ? source.lastStep as OnboardingStepId : "welcome";
    return { version: 1, completed: [...new Set(completed)], dismissed: source.dismissed === true, lastStep };
  } catch { return { ...DEFAULT_STATE }; }
}
export function saveOnboarding(storage: OnboardingStorage, state: OnboardingState): void { storage.setItem(KEY, JSON.stringify(state)); }
export function completeOnboardingStep(storage: OnboardingStorage, state: OnboardingState, id: OnboardingStepId): OnboardingState {
  const next = { ...state, completed: [...new Set([...state.completed, id])], lastStep: id };
  saveOnboarding(storage, next); return next;
}
export function resetOnboarding(storage: OnboardingStorage): OnboardingState { saveOnboarding(storage, DEFAULT_STATE); return { ...DEFAULT_STATE }; }
