import { useRef, useState } from "react";
import { FilePlus2, Plug, ShieldAlert, Trash2 } from "lucide-react";
import type { ExtensionLogEntry } from "../../plugins/ExtensionTypes";
import type { ManagedExtension } from "../../plugins/ExtensionManager";
import { useLocalization } from "../../localization/LocalizationContext";

interface PluginManagerPanelProps {
  open: boolean;
  extensions: ManagedExtension[];
  logs: ExtensionLogEntry[];
  safeMode: boolean;
  onClose: () => void;
  onInstallFile: (file: File) => Promise<void>;
  onToggleExtension: (id: string, enabled: boolean) => void;
  onTrustExtension: (id: string, trusted: boolean) => void;
  onUninstallExtension: (id: string) => void;
  onSafeModeChange: (enabled: boolean) => void;
}

export function PluginManagerPanel({
  open,
  extensions,
  logs,
  safeMode,
  onClose,
  onInstallFile,
  onToggleExtension,
  onTrustExtension,
  onUninstallExtension,
  onSafeModeChange
}: PluginManagerPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [installError, setInstallError] = useState("");
  if (!open) return null;

  const install = async (file: File | undefined) => {
    if (!file) return;
    try { setInstallError(""); await onInstallFile(file); }
    catch (error) { setInstallError(error instanceof Error ? error.message : String(error)); }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel plugin-modal" role="dialog" aria-modal="true" aria-label={t("plugins.ariaLabel")} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2><Plug size={18} />{t("plugins.title")}</h2>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>
        <p className="warning-note">{t("plugins.securityNotice")}</p>
        <div className="plugin-manager-toolbar">
          <button type="button" onClick={() => inputRef.current?.click()}><FilePlus2 size={14} />{t("plugins.installLocal")}</button>
          <label className="checkbox-label"><input type="checkbox" checked={safeMode} onChange={(event) => onSafeModeChange(event.target.checked)} /><ShieldAlert size={14} />{t("plugins.safeMode")}</label>
          <input ref={inputRef} className="hidden-input" type="file" accept=".json,application/json" onChange={(event) => void install(event.target.files?.[0])} />
        </div>
        {installError && <p className="error-note">{installError}</p>}
        <div className="plugin-list">
          {extensions.map((extension) => (
            <article key={extension.id} className="plugin-row">
              <div>
                <strong>{extension.name}</strong>
                <span>{extension.kind === "content-pack" ? t("plugins.contentPack") : t("plugins.logicPlugin")}</span>
                <small>{extension.id}{" · v"}{extension.version}{" · "}{extension.builtin ? t("plugins.builtin") : t("plugins.local")}</small>
              </div>
              <div className="plugin-meta">
                <span>{[...extension.permissions, ...extension.capabilities].join(", ") || t("plugins.noPermissions")}</span>
                {!extension.builtin && extension.kind === "logic-plugin" && <label className="checkbox-label"><input type="checkbox" checked={extension.trusted} onChange={(event) => onTrustExtension(extension.id, event.target.checked)} />{t("plugins.trusted")}</label>}
                <label className="checkbox-label"><input type="checkbox" checked={extension.enabled} disabled={safeMode && !extension.builtin} onChange={(event) => onToggleExtension(extension.id, event.target.checked)} />{t("common.enabled")}</label>
                {!extension.builtin && <button type="button" title={t("plugins.uninstall")} onClick={() => onUninstallExtension(extension.id)}><Trash2 size={14} /></button>}
              </div>
              {extension.validationErrors.length > 0 && <ul className="notes-list">{extension.validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
              {extension.compatibilityWarnings.length > 0 && <ul className="notes-list">{extension.compatibilityWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
            </article>
          ))}
        </div>
        <details className="plugin-log"><summary>{t("plugins.logs")} ({logs.length})</summary>{logs.slice(-50).reverse().map((entry) => <p key={entry.id} className={entry.level === "error" ? "error-note" : entry.level === "warning" ? "warning-note" : "empty-note"}><strong>{entry.extensionId}</strong> — {entry.message}</p>)}</details>
      </section>
    </div>
  );
}
