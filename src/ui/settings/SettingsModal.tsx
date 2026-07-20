import { Settings } from "lucide-react";
import type { AppSettings } from "../../settings/AppSettings";
import type { ProjectSettings } from "../../project/ProjectFile";
import type { SkyPresetId } from "../../renderer/SkySystem";
import { SKY_PRESETS } from "../../renderer/SkySystem";
import { useLocalization } from "../../localization/LocalizationContext";
import type { AppLanguagePreference } from "../../localization/LocalizationTypes";

interface SettingsModalProps {
  open: boolean;
  appSettings: AppSettings;
  projectSettings: ProjectSettings;
  onClose: () => void;
  onAppSettingsChange: (settings: AppSettings) => void;
  onProjectSettingsChange: (settings: ProjectSettings) => void;
}

export function SettingsModal({
  open,
  appSettings,
  projectSettings,
  onClose,
  onAppSettingsChange,
  onProjectSettingsChange
}: SettingsModalProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.title")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Settings size={18} />
            {t("settings.title")}
          </h2>
          <button type="button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
        <div className="settings-grid">
          <section>
            <h3>{t("settings.app")}</h3>
            <label>
              {t("settings.language")}
              <select
                value={appSettings.general.language}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    general: {
                      ...appSettings.general,
                      language: event.target.value as AppLanguagePreference
                    }
                  })
                }
              >
                <option value="system">{t("settings.language.system")}</option>
                <option value="en">{t("settings.language.english")}</option>
                <option value="fr">{t("settings.language.french")}</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appSettings.general.autosaveEnabled}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    general: {
                      ...appSettings.general,
                      autosaveEnabled: event.target.checked
                    }
                  })
                }
              />
              {t("settings.autosaveEnabled")}
            </label>
            <NumberSetting
              label={t("settings.autosaveInterval")}
              value={appSettings.general.autosaveIntervalSeconds}
              min={5}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  general: {
                    ...appSettings.general,
                    autosaveIntervalSeconds: value
                  }
                })
              }
            />
            <NumberSetting
              label={t("settings.defaultFps")}
              value={appSettings.general.defaultFps}
              min={1}
              max={120}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  general: {
                    ...appSettings.general,
                    defaultFps: value
                  }
                })
              }
            />
            <NumberSetting
              label={t("settings.defaultDuration")}
              value={appSettings.general.defaultProjectDurationFrames}
              min={1}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  general: {
                    ...appSettings.general,
                    defaultProjectDurationFrames: value
                  }
                })
              }
            />
            <TextSetting
              label={t("settings.defaultNamePattern")}
              value={appSettings.general.defaultProjectNamePattern}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  general: {
                    ...appSettings.general,
                    defaultProjectNamePattern: value
                  }
                })
              }
            />
          </section>

          <section>
            <h3>{t("settings.viewport")}</h3>
            <ColorSetting
              label={t("settings.backgroundColor")}
              value={appSettings.viewport.backgroundColor}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  viewport: {
                    ...appSettings.viewport,
                    backgroundColor: value
                  }
                })
              }
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appSettings.viewport.gridEnabled}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    viewport: {
                      ...appSettings.viewport,
                      gridEnabled: event.target.checked
                    }
                  })
                }
              />
              {t("settings.showGrid")}
            </label>
            <NumberSetting
              label={t("settings.gridSize")}
              value={appSettings.viewport.gridSize}
              min={8}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  viewport: {
                    ...appSettings.viewport,
                    gridSize: value
                  }
                })
              }
            />
            <NumberSetting
              label={t("settings.orbitSpeed")}
              value={appSettings.viewport.orbitSpeed}
              min={0.1}
              step={0.1}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  viewport: {
                    ...appSettings.viewport,
                    orbitSpeed: value
                  }
                })
              }
            />
            <label>
              {t("settings.renderQuality")}
              <select
                value={appSettings.viewport.renderQuality}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    viewport: {
                      ...appSettings.viewport,
                      renderQuality: event.target.value as AppSettings["viewport"]["renderQuality"]
                    }
                  })
                }
              >
                <option value="low">{t("common.low")}</option>
                <option value="medium">{t("common.medium")}</option>
                <option value="high">{t("common.high")}</option>
              </select>
            </label>
          </section>

          <section>
            <h3>{t("settings.editor")}</h3>
            <label>
              {t("settings.theme")}
              <select
                value={appSettings.editor.theme}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    editor: {
                      ...appSettings.editor,
                      theme: event.target.value as AppSettings["editor"]["theme"]
                    }
                  })
                }
              >
                <option value="dark">{t("settings.theme.dark")}</option>
                <option value="light">{t("settings.theme.lightPlaceholder")}</option>
              </select>
            </label>
            <NumberSetting
              label={t("settings.uiScale")}
              value={appSettings.editor.uiScale}
              min={0.8}
              max={1.4}
              step={0.05}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  editor: {
                    ...appSettings.editor,
                    uiScale: value
                  }
                })
              }
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appSettings.editor.snapToGrid}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    editor: {
                      ...appSettings.editor,
                      snapToGrid: event.target.checked
                    }
                  })
                }
              />
              {t("settings.snapToGrid")}
            </label>
            <NumberSetting
              label={t("settings.transformStep")}
              value={appSettings.editor.transformStep}
              min={0.01}
              step={0.01}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  editor: {
                    ...appSettings.editor,
                    transformStep: value
                  }
                })
              }
            />
            <NumberSetting
              label={t("settings.rotationStep")}
              value={appSettings.editor.rotationStepDegrees}
              min={1}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  editor: {
                    ...appSettings.editor,
                    rotationStepDegrees: value
                  }
                })
              }
            />
          </section>

          <section>
            <h3>{t("settings.minecraft")}</h3>
            <label>
              {t("settings.defaultSky")}
              <select
                value={appSettings.minecraft.defaultSkyPreset}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    minecraft: {
                      ...appSettings.minecraft,
                      defaultSkyPreset: event.target.value as SkyPresetId
                    }
                  })
                }
              >
                {Object.values(SKY_PRESETS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("settings.blockPaletteStyle")}
              <select
                value={appSettings.minecraft.defaultBlockPaletteStyle}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    minecraft: {
                      ...appSettings.minecraft,
                      defaultBlockPaletteStyle: event.target.value as AppSettings["minecraft"]["defaultBlockPaletteStyle"]
                    }
                  })
                }
              >
                <option value="classic">{t("settings.palette.classic")}</option>
                <option value="muted">{t("settings.palette.muted")}</option>
                <option value="nether">{t("settings.palette.nether")}</option>
              </select>
            </label>
            <NumberSetting
              label={t("settings.defaultTerrainSize")}
              value={appSettings.minecraft.defaultTerrainSize}
              min={8}
              max={64}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  minecraft: {
                    ...appSettings.minecraft,
                    defaultTerrainSize: value
                  }
                })
              }
            />
            <TextSetting
              label={t("settings.resourcePackPath")}
              value={appSettings.minecraft.resourcePackPath}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  minecraft: {
                    ...appSettings.minecraft,
                    resourcePackPath: value
                  }
                })
              }
            />
          </section>

          <section>
            <h3>{t("settings.project")}</h3>
            <TextSetting
              label={t("settings.projectName")}
              value={projectSettings.projectName}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  projectName: value
                })
              }
            />
            <NumberSetting
              label={t("settings.fps")}
              value={projectSettings.fps}
              min={1}
              max={120}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  fps: value
                })
              }
            />
            <NumberSetting
              label={t("settings.durationFrames")}
              value={projectSettings.durationFrames}
              min={1}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  durationFrames: value
                })
              }
            />
            <label>
              {t("settings.terrainPreset")}
              <select
                value={projectSettings.terrainPreset}
                onChange={(event) =>
                  onProjectSettingsChange({
                    ...projectSettings,
                    terrainPreset: event.target.value as ProjectSettings["terrainPreset"]
                  })
                }
              >
                <option value="none">{t("common.none")}</option>
                <option value="demo">{t("settings.terrain.demo")}</option>
                <option value="flat">{t("settings.terrain.flat")}</option>
                <option value="nether">{t("settings.terrain.nether")}</option>
              </select>
            </label>
            <label>
              {t("settings.resolutionPreset")}
              <select
                value={projectSettings.renderResolutionPreset}
                onChange={(event) =>
                  onProjectSettingsChange({
                    ...projectSettings,
                    renderResolutionPreset: event.target.value as ProjectSettings["renderResolutionPreset"]
                  })
                }
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
                <option value="4k">4K</option>
                <option value="custom">{t("settings.resolution.custom")}</option>
              </select>
            </label>
            <TextSetting
              label={t("settings.author")}
              value={projectSettings.author}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  author: value
                })
              }
            />
            <label>
              {t("settings.notes")}
              <textarea
                value={projectSettings.notes}
                onChange={(event) =>
                  onProjectSettingsChange({
                    ...projectSettings,
                    notes: event.target.value
                  })
                }
              />
            </label>
          </section>

          <section>
            <h3>{t("settings.plugins")}</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appSettings.plugins.pluginsEnabled}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    plugins: {
                      ...appSettings.plugins,
                      pluginsEnabled: event.target.checked
                    }
                  })
                }
              />
              {t("settings.plugins.enabled")}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appSettings.plugins.allowExperimentalPlugins}
                onChange={(event) =>
                  onAppSettingsChange({
                    ...appSettings,
                    plugins: {
                      ...appSettings.plugins,
                      allowExperimentalPlugins: event.target.checked
                    }
                  })
                }
              />
              {t("settings.plugins.experimental")}
            </label>
            <TextSetting
              label={t("settings.plugins.folder")}
              value={appSettings.plugins.pluginFolderPath}
              onChange={(value) =>
                onAppSettingsChange({
                  ...appSettings,
                  plugins: {
                    ...appSettings.plugins,
                    pluginFolderPath: value
                  }
                })
              }
            />
            <p className="empty-note">
              {t("settings.plugins.executionDisabled")}
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

function NumberSetting({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function TextSetting({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorSetting({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
