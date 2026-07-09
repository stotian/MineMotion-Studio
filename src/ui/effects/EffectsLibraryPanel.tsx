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
import type { EffectDefinition, EffectType } from "../../effects/EffectTypes";
import type { PostProcessingPreset, PostProcessingPresetId } from "../../rendering/postprocessing/PostProcessingTypes";
import type { RenderSettings } from "../../project/ProjectFile";

interface EffectsLibraryPanelProps {
  effects: EffectDefinition[];
  selectedEffectId: string | null;
  effectCount: number;
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
  effects,
  selectedEffectId,
  effectCount,
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
          {effects.map((effect) => (
            <button
              key={effect.type}
              type="button"
              className="effect-card"
              title={effect.description}
              onClick={() => onAddEffect(effect.type)}
            >
              <strong>{effect.name}</strong>
              <span>{effect.space}</span>
              <small>{effect.description}</small>
              <Plus size={14} />
            </button>
          ))}
        </div>
      </section>

      <section className="effects-section">
        <h3>
          <Layers size={15} />
          Scene Effects
        </h3>
        <p className="empty-note">
          {effectCount} effect{effectCount === 1 ? "" : "s"} in this project.
        </p>
        {selectedEffectId && (
          <button
            type="button"
            className="compact-action"
            onClick={() => onSelectEffect(selectedEffectId)}
          >
            Edit selected effect
          </button>
        )}
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
