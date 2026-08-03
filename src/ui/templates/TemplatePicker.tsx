import { LayoutTemplate } from "lucide-react";
import { useMemo, useState } from "react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { templateRegistry } from "../../templates/TemplateRegistry";
import { CustomTemplateStore } from "../../templates/CustomTemplateStore";
import { createCustomTemplateMetadata, exportCustomTemplate, importCustomTemplate } from "../../templates/TemplatePackage";
import type { ProjectTemplate } from "../../templates/TemplateTypes";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";

const TEMPLATE_KEYS = {
  "empty-scene": "templates.emptyScene",
  "flat-minecraft-world": "templates.flatWorld",
  "character-animation-test": "templates.characterAnimation",
  "cinematic-camera-test": "templates.cinematicCamera",
  "sunset-showcase": "templates.sunset",
  "nether-mood": "templates.nether",
  "dialogue-scene": "templates.dialogue",
  "fight-scene": "templates.fight",
  "horror-scene": "templates.horror",
  "chase-scene": "templates.chase",
  "boss-battle": "templates.boss",
  "trailer-scene": "templates.trailer",
  "thumbnail-scene": "templates.thumbnail",
  "vertical-short": "templates.vertical"
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
  currentProject: MineMotionProject;
  onClose: () => void;
  onCreateFromTemplate: (templateId: string) => void;
}

export function TemplatePicker({
  open,
  templates,
  currentProject,
  onClose,
  onCreateFromTemplate
}: TemplatePickerProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [customRevision, setCustomRevision] = useState(0);
  const [customName, setCustomName] = useState("");
  const store = useMemo(() => new CustomTemplateStore(window.localStorage), []);
  const visibleTemplates = useMemo(() => {
    const merged = new Map(templates.map((template) => [template.id, template]));
    for (const template of store.list()) { templateRegistry.register(template); merged.set(template.id, template); }
    return [...merged.values()];
  }, [templates, store, customRevision]);
  const saveCurrentTemplate = () => {
    const name = customName.trim() || currentProject.projectName || t("templates.customDefaultName");
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project"}`;
    const metadata = createCustomTemplateMetadata(id, name, t("templates.customDescription"));
    const raw = exportCustomTemplate(metadata, currentProject);
    const template = store.save(raw); templateRegistry.register(template); setCustomName(""); setCustomRevision((value) => value + 1);
  };
  const importTemplate = async (file: File) => {
    const raw = await file.text(); const imported = importCustomTemplate(raw); store.save(raw); templateRegistry.register(imported.template); setCustomRevision((value) => value + 1);
  };
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
          {visibleTemplates.map((template) => {
            const keyPrefix = TEMPLATE_KEYS[template.id as keyof typeof TEMPLATE_KEYS];
            return (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => onCreateFromTemplate(template.id)}
            >
              <strong>{keyPrefix ? t(`${keyPrefix}.name` as TranslationKey) : template.name}</strong>
              <small>{t(CATEGORY_KEYS[template.category])} · {template.preview.aspectRatio}</small>
              <span>{keyPrefix ? t(`${keyPrefix}.description` as TranslationKey) : template.description}</span>
              <span className="template-card__meta">{t("templates.dependencies", { count: template.dependencies.length })} · {t("templates.estimatedSize", { size: Math.max(1, Math.ceil(template.estimatedSizeBytes / 1024)) })}</span>
              <span className="template-card__license">{template.license}</span>
            </button>
            );
          })}
        </div>
        <div className="template-custom-actions">
          <label>
            {t("templates.customName")}
            <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder={currentProject.projectName} />
          </label>
          <button type="button" onClick={saveCurrentTemplate}>{t("templates.saveCustom")}</button>
          <label className="button-like">
            {t("templates.importCustom")}
            <input type="file" accept=".json,.minemotion-template" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importTemplate(file); event.currentTarget.value = ""; }} />
          </label>
        </div>
      </section>
    </div>
  );
}
