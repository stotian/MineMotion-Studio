import { useRef, useState } from "react";
import { FolderOpen, Package, X } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import {
  checkInstall,
  compareVersionsDescending,
  type InstallCheck
} from "../../minecraft/install/MinecraftInstall";

interface MinecraftInstallPanelProps {
  open: boolean;
  onClose: () => void;
  /** Reads a chosen version's client jar and registers its block textures. */
  onImportTextures: (file: File) => Promise<number>;
}

/**
 * Points the app at a local Minecraft installation.
 *
 * The app ships no Mojang artwork and cannot lawfully redistribute it, so real
 * block textures come from the user's own copy of the game. Blockbench and
 * similar tools take the same route.
 */
export function MinecraftInstallPanel({
  open,
  onClose,
  onImportTextures
}: MinecraftInstallPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const jarRef = useRef<HTMLInputElement | null>(null);
  const [check, setCheck] = useState<InstallCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const inspectFolder = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // A directory picker yields every file; only their paths are needed here.
    const paths = Array.from(files, (file) =>
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
    );
    setCheck(checkInstall(paths));
    setError("");
    setResult("");
  };

  const importJar = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const count = await onImportTextures(file);
      setResult(t("install.imported", { count }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("install.title")}>
      <div className="modal-panel install-modal">
        <header className="panel-header">
          <h2><Package size={15} /> {t("install.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")}>
            <X size={15} />
          </button>
        </header>

        <section className="inspector-section">
          <p className="empty-note">{t("install.why")}</p>

          <button type="button" onClick={() => folderRef.current?.click()}>
            <FolderOpen size={14} /> {t("install.chooseFolder")}
          </button>
          <input
            ref={folderRef}
            type="file"
            hidden
            // Non-standard but the only way to pick a directory in a browser.
            {...{ webkitdirectory: "", directory: "" }}
            onChange={(event) => inspectFolder(event.target.files)}
          />

          {check ? (
            check.ok ? (
              <>
                <h4>{t("install.versionsFound", { count: check.versions.length })}</h4>
                <ul className="notes-list">
                  {[...check.versions]
                    .sort(compareVersionsDescending)
                    .slice(0, 8)
                    .map((version) => <li key={version}>{version}</li>)}
                </ul>
              </>
            ) : (
              <ul className="notes-list">
                {check.problems.map((problem) => <li key={problem}>{problem}</li>)}
              </ul>
            )
          ) : null}
        </section>

        <section className="inspector-section">
          <h3>{t("install.importTitle")}</h3>
          <p className="empty-note">{t("install.importBody")}</p>
          <button type="button" disabled={busy} onClick={() => jarRef.current?.click()}>
            {busy ? t("install.importing") : t("install.chooseJar")}
          </button>
          <input
            ref={jarRef}
            type="file"
            accept=".jar"
            hidden
            onChange={(event) => importJar(event.target.files)}
          />
          {result ? <p className="empty-note">{result}</p> : null}
          {error ? <p className="error-note">{error}</p> : null}
        </section>

        <div className="inspector-actions">
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}
