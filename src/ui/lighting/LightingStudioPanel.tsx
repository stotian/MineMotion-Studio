import {
  CloudFog,
  FolderOpen,
  KeyRound,
  Palette,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { LIGHTING_MOOD_PRESETS } from "../../lighting/LightingPresets";
import type {
  LightingMoodPresetId,
  LightingSettings
} from "../../lighting/LightingTypes";
import {
  MINECRAFT_MATERIAL_PRESETS
} from "../../minecraft/materials/MinecraftMaterialPresets";
import type { MinecraftMaterialPresetId } from "../../minecraft/materials/MinecraftMaterialTypes";
import {
  BIOME_TINT_PRESETS
} from "../../minecraft/resources/BiomeTint";
import type {
  BiomeTintPresetId,
  MinecraftResourceSettings,
  ResourcePackAsset
} from "../../minecraft/resources/ResourcePackTypes";
import type { PostProcessingSettings } from "../../rendering/postprocessing/PostProcessingTypes";
import { useLocalization } from "../../localization/LocalizationContext";

interface LightingStudioPanelProps {
  open: boolean;
  lighting: LightingSettings;
  postProcessing: PostProcessingSettings;
  resources: MinecraftResourceSettings;
  resourcePacks: ResourcePackAsset[];
  currentFrame: number;
  onClose: () => void;
  onApplyMood: (presetId: LightingMoodPresetId) => void;
  onUpdateLighting: (patch: Partial<LightingSettings>) => void;
  onUpdatePostProcessing: (patch: Partial<PostProcessingSettings>) => void;
  onUpdateResources: (settings: MinecraftResourceSettings) => void;
  onChooseResourcePackZip: () => void;
  onChooseResourcePackFolder: () => void;
  onSetActiveResourcePack: (packId: string | null) => void;
  onRemoveResourcePack: (packId: string) => void;
  onAddEnvironmentKeyframe: () => void;
}

export function LightingStudioPanel({
  open,
  lighting,
  postProcessing,
  resources,
  resourcePacks,
  currentFrame,
  onClose,
  onApplyMood,
  onUpdateLighting,
  onUpdatePostProcessing,
  onUpdateResources,
  onChooseResourcePackZip,
  onChooseResourcePackFolder,
  onSetActiveResourcePack,
  onRemoveResourcePack,
  onAddEnvironmentKeyframe
}: LightingStudioPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!open) return null;

  const updateBiomePreset = (presetId: BiomeTintPresetId) => {
    const preset = BIOME_TINT_PRESETS[presetId];
    onUpdateResources({
      ...resources,
      biomeTint: {
        ...preset,
        enabled: resources.biomeTint.enabled
      }
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel lighting-studio-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("lighting.title")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Sun size={18} />
            {t("lighting.title")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("lighting.closeAria")}>
            <X size={16} />
          </button>
        </div>

        <div className="lighting-studio-layout">
          <section className="lighting-wide-section">
            <h3>
              <Sparkles size={15} />
              {t("lighting.moods")}
            </h3>
            <div className="lighting-preset-grid">
              {LIGHTING_MOOD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={lighting.presetId === preset.id ? "selected" : ""}
                  title={preset.description}
                  onClick={() => onApplyMood(preset.id)}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <Sun size={15} />
              {t("lighting.sunAmbient")}
            </h3>
            <SliderField
              label={t("lighting.sunIntensity")}
              value={lighting.sunIntensity}
              min={0}
              max={3}
              step={0.01}
              onChange={(sunIntensity) => onUpdateLighting({ sunIntensity })}
            />
            <SliderField
              label={t("lighting.ambientIntensity")}
              value={lighting.ambientIntensity}
              min={0}
              max={2}
              step={0.01}
              onChange={(ambientIntensity) => onUpdateLighting({ ambientIntensity })}
            />
            <ColorField
              label={t("lighting.sunColor")}
              value={lighting.sunColor}
              onChange={(sunColor) => onUpdateLighting({ sunColor })}
            />
            <ColorField
              label={t("lighting.ambientColor")}
              value={lighting.ambientColor}
              onChange={(ambientColor) => onUpdateLighting({ ambientColor })}
            />
            <VectorField
              label={t("lighting.sunDirection")}
              value={lighting.sunDirection}
              onChange={(sunDirection) => onUpdateLighting({ sunDirection })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lighting.shadowsEnabled}
                onChange={(event) =>
                  onUpdateLighting({ shadowsEnabled: event.target.checked })
                }
              />
              {t("lighting.shadows")}
            </label>
          </section>

          <section>
            <h3>
              <CloudFog size={15} />
              {t("lighting.atmosphere")}
            </h3>
            <ColorField
              label={t("lighting.fogColor")}
              value={lighting.fogColor}
              onChange={(fogColor) => onUpdateLighting({ fogColor })}
            />
            <SliderField
              label={t("lighting.fogDensity")}
              value={lighting.fogDensity}
              min={0}
              max={0.08}
              step={0.001}
              onChange={(fogDensity) => onUpdateLighting({ fogDensity })}
            />
            <SliderField
              label={t("lighting.timeOfDay")}
              value={lighting.timeOfDay}
              min={0}
              max={24}
              step={0.1}
              onChange={(timeOfDay) => onUpdateLighting({ timeOfDay })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lighting.animateTimeOfDay}
                onChange={(event) =>
                  onUpdateLighting({ animateTimeOfDay: event.target.checked })
                }
              />
              {t("lighting.animateTime")}
            </label>
            <NumberField
              label={t("lighting.dayLength")}
              value={lighting.dayLengthFrames}
              min={1}
              step={1}
              onChange={(dayLengthFrames) =>
                onUpdateLighting({ dayLengthFrames: Math.max(1, Math.round(dayLengthFrames)) })
              }
            />
            <div className="lighting-keyframe-row">
              <button type="button" onClick={onAddEnvironmentKeyframe}>
                <KeyRound size={15} />
                {t("lighting.keyframeAt", { frame: currentFrame })}
              </button>
              <span>{localization.plural({ one: "lighting.environmentKeys.one", other: "lighting.environmentKeys.other" }, lighting.keyframes.length)}</span>
            </div>
          </section>

          <section>
            <h3>
              <Sparkles size={15} />
              {t("lighting.shaderPost")}
            </h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={postProcessing.enabled}
                onChange={(event) =>
                  onUpdatePostProcessing({ enabled: event.target.checked })
                }
              />
              {t("lighting.enablePost")}
            </label>
            <SliderField
              label={t("lighting.bloom")}
              value={postProcessing.bloomIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={(bloomIntensity) =>
                onUpdatePostProcessing({ bloomIntensity })
              }
            />
            <SliderField
              label={t("lighting.vignette")}
              value={postProcessing.vignetteAmount}
              min={0}
              max={1}
              step={0.01}
              onChange={(vignetteAmount) =>
                onUpdatePostProcessing({ vignetteAmount })
              }
            />
            <SliderField
              label={t("lighting.grain")}
              value={postProcessing.grainAmount}
              min={0}
              max={1}
              step={0.01}
              onChange={(grainAmount) => onUpdatePostProcessing({ grainAmount })}
            />
            <SliderField
              label={t("lighting.chromatic")}
              value={postProcessing.chromaticAberrationAmount}
              min={0}
              max={1}
              step={0.01}
              onChange={(chromaticAberrationAmount) =>
                onUpdatePostProcessing({ chromaticAberrationAmount })
              }
            />
            <SliderField
              label={t("lighting.exposure")}
              value={postProcessing.exposure}
              min={0.2}
              max={2.5}
              step={0.01}
              onChange={(exposure) => onUpdatePostProcessing({ exposure })}
            />
            <SliderField
              label={t("lighting.contrast")}
              value={postProcessing.contrast}
              min={0.2}
              max={2.5}
              step={0.01}
              onChange={(contrast) => onUpdatePostProcessing({ contrast })}
            />
          </section>

          <section>
            <h3>
              <Palette size={15} />
              {t("lighting.materials")}
            </h3>
            <label>
              {t("lighting.filtering")}
              <select
                value={resources.textureFiltering}
                onChange={(event) =>
                  onUpdateResources({
                    ...resources,
                    textureFiltering: event.target.value as "nearest" | "linear"
                  })
                }
              >
                <option value="nearest">{t("lighting.nearest")}</option>
                <option value="linear">{t("lighting.linear")}</option>
              </select>
            </label>
            <label>
              {t("lighting.defaultMaterial")}
              <select
                value={resources.materials.defaultPresetId}
                onChange={(event) =>
                  onUpdateResources({
                    ...resources,
                    materials: {
                      ...resources.materials,
                      defaultPresetId: event.target.value as MinecraftMaterialPresetId
                    }
                  })
                }
              >
                {Object.values(MINECRAFT_MATERIAL_PRESETS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={resources.biomeTint.enabled}
                onChange={(event) =>
                  onUpdateResources({
                    ...resources,
                    biomeTint: {
                      ...resources.biomeTint,
                      enabled: event.target.checked
                    }
                  })
                }
              />
              {t("lighting.biomeTint")}
            </label>
            <label>
              {t("lighting.biomePreset")}
              <select
                value={resources.biomeTint.presetId}
                onChange={(event) =>
                  updateBiomePreset(event.target.value as BiomeTintPresetId)
                }
              >
                {Object.keys(BIOME_TINT_PRESETS).map((presetId) => (
                  <option key={presetId} value={presetId}>
                    {presetId}
                  </option>
                ))}
              </select>
            </label>
            <div className="export-grid-2">
              <ColorField
                label={t("lighting.grass")}
                value={resources.biomeTint.grassColor}
                onChange={(grassColor) =>
                  onUpdateResources({
                    ...resources,
                    biomeTint: {
                      ...resources.biomeTint,
                      presetId: "custom",
                      grassColor
                    }
                  })
                }
              />
              <ColorField
                label={t("lighting.foliage")}
                value={resources.biomeTint.foliageColor}
                onChange={(foliageColor) =>
                  onUpdateResources({
                    ...resources,
                    biomeTint: {
                      ...resources.biomeTint,
                      presetId: "custom",
                      foliageColor
                    }
                  })
                }
              />
              <ColorField
                label={t("lighting.water")}
                value={resources.biomeTint.waterColor}
                onChange={(waterColor) =>
                  onUpdateResources({
                    ...resources,
                    biomeTint: {
                      ...resources.biomeTint,
                      presetId: "custom",
                      waterColor
                    }
                  })
                }
              />
            </div>
          </section>

          <section className="lighting-wide-section">
            <h3>
              <Upload size={15} />
              {t("lighting.resourcePacks")}
            </h3>
            <div className="world-import-actions">
              <button type="button" onClick={onChooseResourcePackZip}>
                <Upload size={15} />
                {t("lighting.importZip")}
              </button>
              <button type="button" onClick={onChooseResourcePackFolder}>
                <FolderOpen size={15} />
                {t("lighting.importFolder")}
              </button>
              <button
                type="button"
                disabled={!resources.activeResourcePackId}
                onClick={() => onSetActiveResourcePack(null)}
              >
                {t("lighting.resetTextures")}
              </button>
            </div>
            <div className="resource-pack-list">
              {resourcePacks.length === 0 ? (
                <p className="empty-note">{t("lighting.noResourcePack")}</p>
              ) : (
                resourcePacks.map((pack) => (
                  <article
                    key={pack.id}
                    className={
                      resources.activeResourcePackId === pack.id
                        ? "resource-pack-row selected"
                        : "resource-pack-row"
                    }
                  >
                    <div>
                      <strong>{pack.name}</strong>
                      <span>{pack.metadata.description}</span>
                      <small>
                        {t("lighting.packSummary", { format: pack.metadata.packFormat ?? t("world.unknown"), count: pack.textures.length, source: pack.sourceKind })}
                      </small>
                      {pack.warnings.map((warning) => (
                        <small key={warning} className="warning-text">
                          {warning}
                        </small>
                      ))}
                    </div>
                    <div className="resource-pack-actions">
                      <button
                        type="button"
                        onClick={() => onSetActiveResourcePack(pack.id)}
                      >
                        {t("lighting.apply")}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveResourcePack(pack.id)}
                        aria-label={t("lighting.removePack", { name: pack.name })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-field">
      <span>
        {label}
        <output>{Number(value.toFixed(3))}</output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
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
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ColorField({
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
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function VectorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
}) {
  return (
    <fieldset className="vector-editor">
      <legend>{label}</legend>
      {["X", "Y", "Z"].map((axis, index) => (
        <label key={axis}>
          {axis}
          <input
            type="number"
            step={0.05}
            value={Number(value[index].toFixed(3))}
            onChange={(event) => {
              const next = [...value] as [number, number, number];
              next[index] = Number(event.target.value);
              onChange(next);
            }}
          />
        </label>
      ))}
    </fieldset>
  );
}
