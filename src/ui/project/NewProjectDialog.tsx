import { useState } from "react";
import { FilePlus2, X } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import {
  DEFAULT_MINECRAFT_VERSION,
  DEFAULT_MOD_LOADER,
  MINECRAFT_VERSIONS,
  MOD_LOADERS,
  loaderSupportsVersion,
  type ModLoaderId
} from "../../minecraft/MinecraftVersions";

export interface NewProjectChoice {
  name: string;
  minecraftVersion: string;
  modLoader: ModLoaderId;
}

interface NewProjectDialogProps {
  open: boolean;
  defaultName: string;
  onClose: () => void;
  onCreate: (choice: NewProjectChoice) => void;
}

/**
 * Asks what a new project targets.
 *
 * The loader decides which mod jars are valid to import, and the version
 * decides which block catalogue applies, so both are chosen up front rather
 * than discovered when an import fails.
 */
export function NewProjectDialog({
  open,
  defaultName,
  onClose,
  onCreate
}: NewProjectDialogProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [name, setName] = useState(defaultName);
  const [version, setVersion] = useState(DEFAULT_MINECRAFT_VERSION);
  const [loader, setLoader] = useState<ModLoaderId>(DEFAULT_MOD_LOADER);

  if (!open) return null;

  // A loader without builds for the chosen version must not be selectable.
  const availableLoaders = MOD_LOADERS.filter((entry) =>
    loaderSupportsVersion(entry.id, version)
  );
  const effectiveLoader = availableLoaders.some((entry) => entry.id === loader)
    ? loader
    : DEFAULT_MOD_LOADER;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("newProject.title")}>
      <div className="modal-panel new-project-modal">
        <header className="panel-header">
          <h2><FilePlus2 size={15} /> {t("newProject.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")}>
            <X size={15} />
          </button>
        </header>

        <section className="inspector-section">
          <label>
            {t("newProject.name")}
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            {t("newProject.version")}
            <select value={version} onChange={(event) => setVersion(event.target.value)}>
              {MINECRAFT_VERSIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.codename ? `${entry.label} — ${entry.codename}` : entry.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("newProject.loader")}
            <select
              value={effectiveLoader}
              onChange={(event) => setLoader(event.target.value as ModLoaderId)}
            >
              {availableLoaders.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.label}</option>
              ))}
            </select>
          </label>

          <p className="empty-note">
            {effectiveLoader === "vanilla"
              ? t("newProject.vanillaNote")
              : t("newProject.loaderNote", {
                  loader: MOD_LOADERS.find((entry) => entry.id === effectiveLoader)?.label ?? ""
                })}
          </p>
        </section>

        <div className="inspector-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() =>
              onCreate({
                name: name.trim() || defaultName,
                minecraftVersion: version,
                modLoader: effectiveLoader
              })
            }
          >
            {t("newProject.create")}
          </button>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}
