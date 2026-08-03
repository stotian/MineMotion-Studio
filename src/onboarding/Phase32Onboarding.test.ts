import { describe, expect, it } from "vitest";
import { completeOnboardingStep, loadOnboarding, resetOnboarding } from "./OnboardingStore";
import { ONBOARDING_STEPS } from "./OnboardingTypes";
import { searchContextualHelp } from "./ContextualHelp";
import { SHORTCUT_CUSTOMIZATION_STATUS, SHORTCUT_REFERENCE } from "./ShortcutReference";

describe("Phase 32 onboarding", () => {
  it("persists and sanitizes onboarding progress", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const initial = resetOnboarding(storage);
    const next = completeOnboardingStep(storage, initial, "template");
    expect(loadOnboarding(storage).completed).toContain("template");
    expect(next.version).toBe(1);
  });
  it("covers the complete basic workflow", () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual(["welcome", "template", "viewport", "timeline", "keyframe", "preview", "export"]);
    expect(searchContextualHelp("chunk")[0]?.id).toBe("world");
  });
  it("documents the honest shortcut MVP", () => {
    expect(SHORTCUT_CUSTOMIZATION_STATUS).toBe("documented-mvp");
    expect(SHORTCUT_REFERENCE.some((entry) => entry.id === "save")).toBe(true);
  });
});
