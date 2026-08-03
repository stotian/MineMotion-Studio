export type OnboardingStepId = "welcome" | "template" | "viewport" | "timeline" | "keyframe" | "preview" | "export";
export interface OnboardingStep { id: OnboardingStepId; titleKey: string; bodyKey: string; target?: string; optional: boolean; }
export interface OnboardingState { version: 1; completed: OnboardingStepId[]; dismissed: boolean; lastStep: OnboardingStepId; }
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "welcome", titleKey: "onboarding.step.welcome.title", bodyKey: "onboarding.step.welcome.body", optional: false },
  { id: "template", titleKey: "onboarding.step.template.title", bodyKey: "onboarding.step.template.body", target: "templates", optional: false },
  { id: "viewport", titleKey: "onboarding.step.viewport.title", bodyKey: "onboarding.step.viewport.body", target: ".viewport-shell", optional: false },
  { id: "timeline", titleKey: "onboarding.step.timeline.title", bodyKey: "onboarding.step.timeline.body", target: ".timeline-panel", optional: false },
  { id: "keyframe", titleKey: "onboarding.step.keyframe.title", bodyKey: "onboarding.step.keyframe.body", target: "keyframe", optional: false },
  { id: "preview", titleKey: "onboarding.step.preview.title", bodyKey: "onboarding.step.preview.body", target: "render-preview", optional: true },
  { id: "export", titleKey: "onboarding.step.export.title", bodyKey: "onboarding.step.export.body", target: "export", optional: false }
];
