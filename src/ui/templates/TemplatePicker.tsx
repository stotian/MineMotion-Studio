import { LayoutTemplate } from "lucide-react";
import type { ProjectTemplate } from "../../templates/TemplateTypes";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";

const TEMPLATE_KEYS = {
  "empty-scene": "templates.emptyScene",
  "flat-minecraft-world": "templates.flatWorld",
  "character-animation-test": "templates.characterAnimation",
  "cinematic-camera-test": "templates.cinematicCamera",
  "sunset-showcase": "templates.sunset",
  "nether-mood": "templates.nether"
} as const;

const CATEGORY_KEYS = {
  starter: "templates.category.starter",
  animation: "templates.category.animation",
  cinematic: "templates.category.cinematic",
  mood: "templates.category.mood"
} as const satisfies Record<ProjectTemplate["category"], TranslationKey>;

interface TemplatePickerProps {
  open: boolean;
  templates: ProjectTemplate[];
  onClose: () => void;
  onCreateFromTemplate: (templateId: string) => void;
}

export function TemplatePicker({
  open,
  templates,
  onClose,
  onCreateFromTemplate
}: TemplatePickerProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel template-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("templates.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <LayoutTemplate size={18} />
            {t("templates.title")}
          </h2>
          <button type="button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
        <div className="template-grid">
          {templates.map((template) => {
            const keyPrefix = TEMPLATE_KEYS[template.id as keyof typeof TEMPLATE_KEYS];
            return (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => onCreateFromTemplate(template.id)}
            >
              <strong>{keyPrefix ? t(`${keyPrefix}.name` as TranslationKey) : template.name}</strong>
              <small>{t(CATEGORY_KEYS[template.category])}</small>
              <span>{keyPrefix ? t(`${keyPrefix}.description` as TranslationKey) : template.description}</span>
            </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
