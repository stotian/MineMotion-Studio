import { HelpCircle } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  onLoadSampleScene: () => void;
}

export function HelpPanel({ open, onClose, onLoadSampleScene }: HelpPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("help.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <HelpCircle size={18} />
            {t("help.quickStart")}
          </h2>
          <button type="button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
        <div className="help-content">
          <button
            type="button"
            className="primary-action"
            onClick={onLoadSampleScene}
          >
            {t("help.loadSampleScene")}
          </button>
          <ul>
            <li>{t("help.orbit")}</li>
            <li>{t("help.select")}</li>
            <li>{t("help.transforms")}</li>
            <li>{t("help.keyframes")}</li>
            <li>{t("help.effects")}</li>
            <li>{t("help.postProcessing")}</li>
            <li>{t("help.renderPreview")}</li>
            <li>{t("help.sfx")}</li>
            <li>{t("help.play")}</li>
            <li>{t("help.worldImport")}</li>
            <li>{t("help.save")}</li>
          </ul>
          <h3>{t("help.shortcuts")}</h3>
          <ul>
            <li>{t("help.shortcut.commands")}</li>
            <li>{t("help.shortcut.save")}</li>
            <li>{t("help.shortcut.undo")}</li>
            <li>{t("help.shortcut.duplicate")}</li>
            <li>{t("help.shortcut.delete")}</li>
            <li>{t("help.shortcut.play")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
