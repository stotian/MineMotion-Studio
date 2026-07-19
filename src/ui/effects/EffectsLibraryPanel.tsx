import {
  AudioWaveform,
  Clapperboard,
  Film,
  Layers,
  Plus,
  Sparkles
} from "lucide-react";
import type { BuiltinSfxDefinition } from "../../audio/AudioTypes";
import type { AudioClip } from "../../audio/AudioTypes";
import type {
  EffectInstance,
  EffectType
} from "../../effects/EffectTypes";
import type { BuiltinVfxPreset } from "../../vfx/library/BuiltinVfxPresetTypes";
import type { PostProcessingPreset, PostProcessingPresetId } from "../../rendering/postprocessing/PostProcessingTypes";
import type { RenderSettings } from "../../project/ProjectFile";

interface EffectsLibraryPanelProps {
  presets: readonly BuiltinVfxPreset[];
  selectedEffectId: string | null;
  effectInstances: readonly EffectInstance[];
  audioClips: AudioClip[];
  builtinSfx: BuiltinSfxDefinition[];
  postPresets: PostProcessingPreset[];
  activePostPresetId: PostProcessingPresetId;
  renderSettings: RenderSettings;
  onAddEffect: (type: EffectType) => void;
  onSelectEffect: (effectId: string) => void;
  onApplyPostPreset: (presetId: PostProcessingPresetId) => void;
  onToggleRenderPreview: () => void;
  onToggleCinematicBars: () => void;
  onImportAudio: () => void;
  onAddBuiltinSfx: (sfxId: string) => void;
}

export function EffectsLibraryPanel({
  presets,
  selectedEffectId,
  effectInstances,
  audioClips,
  builtinSfx,
  postPresets,
  activePostPresetId,
  renderSettings,
  onAddEffect,
  onSelectEffect,
  onApplyPostPreset,
  onToggleRenderPreview,
  onToggleCinematicBars,
  onImportAudio,
  onAddBuiltinSfx
}: EffectsLibraryPanelProps) {
  return (
    <aside className="panel effects-panel">
      <div className="panel-header">
        <h2>Effects</h2>
      </div>

      <section className="effects-section">
        <h3>
          <Sparkles size={15} />
          Library
        </h3>
        <div className="effect-library-list">
          {presets.map((preset) => {
            const unavailable =
              !preset.metadata.compatibility.capabilities.preview &&
              !preset.metadata.compatibility.capabilities.export;
            return (
              <button
                key={preset.metadata.id}
                type="button"
                className="effect-card"
                title={[
                  preset.definition.description,
                  ...preset.metadata.compatibility.limitations
                ].join(" ")}
                disabled={unavailable}
                onClick={() => onAddEffect(preset.metadata.effectType)}
              >
                <strong>{preset.localizedName}</strong>
                <span>
                  {preset.metadata.category} / {preset.definition.space}
                </span>
                <small>{preset.definition.description}</small>
                <small>{preset.metadata.compatibility.maturity}</small>
                <Plus size={14} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="effects-section">
        <h3>
          <Layers size={15} />
          Scene Effects
        </h3>
        <p className="empty-note">
          {effectInstances.length} effect{effectInstances.length === 1 ? "" : "s"} in this project.
        </p>
        <div className="scene-effect-list" aria-label="Scene effects">
          {effectInstances.map((effect) => (
            <button
              key={effect.id}
              type="button"
              className={`${effect.id === selectedEffectId ? "selected" : ""} ${effect.enabled ? "" : "disabled-effect"}`}
              aria-pressed={effect.id === selectedEffectId}
              onClick={() => onSelectEffect(effect.id)}
            >
              <strong>{effect.name}</strong>
              <span>
                {effect.startFrame}–{effect.startFrame + effect.durationFrames}f
              </span>
              <small>{effect.enabled ? "Enabled" : "Disabled"}</small>
            </button>
          ))}
          {effectInstances.length === 0 && (
            <span className="empty-note">Add an effect from the library.</span>
          )}
        </div>
      </section>

      <section className="effects-section">
        <h3>
          <Film size={15} />
          Post
        </h3>
        <select
          value={activePostPresetId}
          onChange={(event) =>
            onApplyPostPreset(event.target.value as PostProcessingPresetId)
          }
        >
          {postPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <p className="empty-note">
          {postPresets.find((preset) => preset.id === activePostPresetId)?.description}
        </p>
      </section>

      <section className="effects-section">
        <h3>
          <Clapperboard size={15} />
          Render Preview
        </h3>
        <div className="stacked-actions">
          <button type="button" onClick={onToggleRenderPreview}>
            {renderSettings.renderPreviewEnabled ? "Leave Preview" : "Enter Preview"}
          </button>
          <button type="button" onClick={onToggleCinematicBars}>
            {renderSettings.cinematicBarsEnabled ? "Hide Bars" : "Show Bars"}
          </button>
        </div>
        <p className="empty-note">
          {renderSettings.resolutionPreset} / {renderSettings.aspectRatio}
        </p>
      </section>

      <section className="effects-section">
        <h3>
          <AudioWaveform size={15} />
          SFX
        </h3>
        <button type="button" onClick={onImportAudio}>
          Import SFX
        </button>
        <div className="sfx-list">
          {builtinSfx.map((sfx) => (
            <button
              key={sfx.id}
              type="button"
              title={sfx.description}
              onClick={() => onAddBuiltinSfx(sfx.id)}
            >
              {sfx.name}
            </button>
          ))}
        </div>
        <p className="empty-note">
          {audioClips.length} audio clip{audioClips.length === 1 ? "" : "s"} on timeline.
        </p>
      </section>
    </aside>
  );
}
