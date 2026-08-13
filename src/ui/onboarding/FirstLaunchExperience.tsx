import { useMemo, useState } from "react";
import { BookOpen, FolderOpen, LayoutTemplate, LifeBuoy, Sparkles } from "lucide-react";
import type { ProjectTemplate } from "../../templates/TemplateTypes";
import type { RecentProjectEntry } from "../../settings/SettingsTypes";
import { ONBOARDING_STEPS } from "../../onboarding/OnboardingTypes";
import { completeOnboardingStep, loadOnboarding, saveOnboarding } from "../../onboarding/OnboardingStore";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";

export interface FirstLaunchExperienceProps {
  templates: ProjectTemplate[];
  recentProjects: RecentProjectEntry[];
  recoveryAvailable: boolean;
  onCreateTemplate: (id: string) => void;
  onOpenProject: () => void;
  onOpenTemplates: () => void;
  onRestoreRecovery: () => void;
  onOpenHelp: () => void;
}
export function FirstLaunchExperience(props: FirstLaunchExperienceProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const initial = useMemo(() => loadOnboarding(window.localStorage), []);
  const [state, setState] = useState(initial);
  const [stepIndex, setStepIndex] = useState(Math.max(0, ONBOARDING_STEPS.findIndex((step) => step.id === initial.lastStep)));
  const [open, setOpen] = useState(!initial.dismissed);
  if (!open) return null;
  const featured = props.templates.filter((template) => ["dialogue-scene", "fight-scene", "vertical-short"].includes(template.id));
  const step = ONBOARDING_STEPS[stepIndex];
  const dismiss = () => {
    const nextState = { ...state, dismissed: true };
    saveOnboarding(window.localStorage, nextState);
    setState(nextState);
    setOpen(false);
  };
  const next = () => {
    const completed = completeOnboardingStep(window.localStorage, state, step.id);
    setState(completed);
    setStepIndex((value) => Math.min(ONBOARDING_STEPS.length - 1, value + 1));
  };
  return (
    <div className="modal-backdrop first-launch-backdrop" role="presentation">
      <section className="modal-panel first-launch-modal" role="dialog" aria-modal="true" aria-labelledby="first-launch-title">
        <div className="modal-header"><h2 id="first-launch-title"><Sparkles size={18} />{t("onboarding.welcome")}</h2><button type="button" onClick={dismiss}>{t("onboarding.skip")}</button></div>
        <div className="first-launch-grid">
          <section><h3>{t("onboarding.start")}</h3><div className="first-launch-actions">
            {featured.map((template) => <button key={template.id} type="button" onClick={() => { props.onCreateTemplate(template.id); dismiss(); }}><LayoutTemplate size={16} /><strong>{template.name}</strong><span>{template.preview.summary}</span></button>)}
            <button type="button" onClick={() => { props.onOpenTemplates(); dismiss(); }}><LayoutTemplate size={16} />{t("onboarding.allTemplates")}</button>
            <button type="button" onClick={() => { props.onOpenProject(); dismiss(); }}><FolderOpen size={16} />{t("onboarding.openProject")}</button>
            {props.recoveryAvailable && <button type="button" onClick={() => { props.onRestoreRecovery(); dismiss(); }}><LifeBuoy size={16} />{t("onboarding.restore")}</button>}
            <button type="button" onClick={() => { props.onOpenHelp(); dismiss(); }}><BookOpen size={16} />{t("onboarding.help")}</button>
          </div></section>
          <section><h3>{t(step.titleKey as TranslationKey)}</h3><p>{t(step.bodyKey as TranslationKey)}</p><progress value={stepIndex + 1} max={ONBOARDING_STEPS.length} /><p>{t("onboarding.progress", { current: stepIndex + 1, total: ONBOARDING_STEPS.length })}</p><button type="button" className="primary-action" onClick={next}>{stepIndex === ONBOARDING_STEPS.length - 1 ? t("onboarding.finish") : t("onboarding.next")}</button></section>
          {props.recentProjects.length > 0 && <section><h3>{t("onboarding.recent")}</h3><ul>{props.recentProjects.slice(0, 5).map((entry) => <li key={entry.id}><strong>{entry.name}</strong><span>{new Date(entry.savedAt).toLocaleDateString()}</span></li>)}</ul></section>}
        </div>
      </section>
    </div>
  );
}
