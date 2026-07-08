import { Plug } from "lucide-react";
import type { RegisteredPlugin } from "../../plugins/PluginRegistry";

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
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel plugin-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Plugin manager"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Plug size={18} />
            Plugin Manager
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="warning-note">
          External plugin JavaScript execution is disabled in Phase 1.5. Built-in
          plugins are bundled TypeScript modules; external manifests should not
          be executed without a future sandbox.
        </p>
        <div className="plugin-list">
          {plugins.map((plugin) => (
            <article key={plugin.manifest.id} className="plugin-row">
              <div>
                <strong>{plugin.manifest.name}</strong>
                <span>{plugin.manifest.description}</span>
                <small>
                  {plugin.manifest.id} - v{plugin.manifest.version} -{" "}
                  {plugin.manifest.builtin ? "built-in" : "external manifest"}
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
                  Enabled
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

