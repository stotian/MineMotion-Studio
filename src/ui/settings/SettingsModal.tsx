import { Settings } from "lucide-react";
import type { AppSettings } from "../../settings/AppSettings";
import type { ProjectSettings } from "../../project/ProjectFile";
import type { SkyPresetId } from "../../renderer/SkySystem";
import { SKY_PRESETS } from "../../renderer/SkySystem";

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
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Settings size={18} />
            Settings
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="settings-grid">
          <section>
            <h3>App Settings</h3>
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
              Autosave enabled
            </label>
            <NumberSetting
              label="Autosave interval (s)"
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
              label="Default FPS"
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
              label="Default duration"
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
              label="Default name pattern"
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
            <h3>Viewport</h3>
            <ColorSetting
              label="Background color"
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
              Show grid
            </label>
            <NumberSetting
              label="Grid size"
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
              label="Orbit speed"
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
              Render quality
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </section>

          <section>
            <h3>Editor</h3>
            <label>
              Theme
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
                <option value="dark">Dark</option>
                <option value="light">Light placeholder</option>
              </select>
            </label>
            <NumberSetting
              label="UI scale"
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
              Snap to grid
            </label>
            <NumberSetting
              label="Transform step"
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
              label="Rotation step"
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
            <h3>Minecraft</h3>
            <label>
              Default sky
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
              Block palette style
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
                <option value="classic">Classic</option>
                <option value="muted">Muted</option>
                <option value="nether">Nether</option>
              </select>
            </label>
            <NumberSetting
              label="Default terrain size"
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
              label="Resource pack path"
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
            <h3>Project Settings</h3>
            <TextSetting
              label="Project name"
              value={projectSettings.projectName}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  projectName: value
                })
              }
            />
            <NumberSetting
              label="FPS"
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
              label="Duration frames"
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
              Terrain preset
              <select
                value={projectSettings.terrainPreset}
                onChange={(event) =>
                  onProjectSettingsChange({
                    ...projectSettings,
                    terrainPreset: event.target.value as ProjectSettings["terrainPreset"]
                  })
                }
              >
                <option value="none">None</option>
                <option value="demo">Demo</option>
                <option value="flat">Flat</option>
                <option value="nether">Nether</option>
              </select>
            </label>
            <label>
              Resolution preset
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
                <option value="custom">Custom</option>
              </select>
            </label>
            <TextSetting
              label="Author"
              value={projectSettings.author}
              onChange={(value) =>
                onProjectSettingsChange({
                  ...projectSettings,
                  author: value
                })
              }
            />
            <label>
              Notes
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
            <h3>Plugins</h3>
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
              Enable built-in plugin registry
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
              Allow experimental plugin manifests
            </label>
            <TextSetting
              label="Plugin folder path"
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
              External plugin JavaScript execution is disabled in this build.
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
