import { Plug } from "lucide-react";
import type { RegisteredPlugin } from "../../plugins/PluginRegistry";
import { useLocalization } from "../../localization/LocalizationContext";

interface PluginManagerPanelProps {
  open: boolean;
  plugins: RegisteredPlugin[];
  onClose: () => void;
  onTogglePlugin: (pluginId: string, enabled: boolean) => void;
}

export function PluginManagerPanel({
  open,
  plugins,
  onClose,
  onTogglePlugin
}: PluginManagerPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel plugin-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("plugins.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Plug size={18} />
            {t("plugins.title")}
          </h2>
          <button type="button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
        <p className="warning-note">
          {t("plugins.securityNotice")}
        </p>
        <div className="plugin-list">
          {plugins.map((plugin) => (
            <article key={plugin.manifest.id} className="plugin-row">
              <div>
                <strong>{plugin.manifest.name}</strong>
                <span>{plugin.manifest.description}</span>
                <small>
                  {plugin.manifest.id} - v{plugin.manifest.version} -{" "}
                  {plugin.manifest.builtin ? t("plugins.builtin") : t("plugins.externalManifest")}
                </small>
              </div>
              <div className="plugin-meta">
                <span>{plugin.manifest.permissions.join(", ")}</span>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={plugin.enabled}
                    onChange={(event) =>
                      onTogglePlugin(plugin.manifest.id, event.target.checked)
                    }
                  />
                  {t("common.enabled")}
                </label>
              </div>
              {plugin.validationErrors.length > 0 && (
                <ul className="notes-list">
                  {plugin.validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
