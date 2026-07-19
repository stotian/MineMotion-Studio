import {
  AudioWaveform,
  Clapperboard,
  Clock3,
  Film,
  Layers,
  Plus,
  Search,
  Star,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuiltinSfxDefinition } from "../../audio/AudioTypes";
import type { AudioClip } from "../../audio/AudioTypes";
import type {
  EffectInstance,
  EffectType
} from "../../effects/EffectTypes";
import type { BuiltinVfxPreset } from "../../vfx/library/BuiltinVfxPresetTypes";
import type { PostProcessingPreset, PostProcessingPresetId } from "../../rendering/postprocessing/PostProcessingTypes";
import type { RenderSettings } from "../../project/ProjectFile";
import {
  DEFAULT_VFX_LIBRARY_FILTERS,
  filterBuiltinVfxPresets,
  listVfxLibraryTags,
  loadVfxLibraryPreferences,
  recordRecentVfxPreset,
  resolveRecentBuiltinVfxPresets,
  saveVfxLibraryPreferences,
  toggleVfxLibraryFavorite,
  type VfxLibrarySourceFilter
} from "../../vfx/library/VfxLibraryNavigation";

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
  const [search, setSearch] = useState(DEFAULT_VFX_LIBRARY_FILTERS.search);
  const [category, setCategory] = useState(DEFAULT_VFX_LIBRARY_FILTERS.category);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [source, setSource] = useState<VfxLibrarySourceFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [preferences, setPreferences] = useState(() =>
    typeof window === "undefined"
      ? { version: 1 as const, favoriteIds: [], recentIds: [] }
      : loadVfxLibraryPreferences(window.localStorage)
  );
  const categories = useMemo(
    () => [...new Set(presets.map((preset) => preset.metadata.category))].sort(),
    [presets]
  );
  const tags = useMemo(() => listVfxLibraryTags(presets), [presets]);
  const filteredPresets = useMemo(
    () => filterBuiltinVfxPresets(
      presets,
      { search, category, selectedTags, source, favoritesOnly },
      preferences.favoriteIds
    ),
    [category, favoritesOnly, preferences.favoriteIds, presets, search, selectedTags, source]
  );
  const recentPresets = useMemo(
    () => resolveRecentBuiltinVfxPresets(presets, preferences.recentIds),
    [preferences.recentIds, presets]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      saveVfxLibraryPreferences(window.localStorage, preferences);
    }
  }, [preferences]);

  const addPreset = (preset: BuiltinVfxPreset) => {
    setPreferences((current) => recordRecentVfxPreset(current, preset.metadata.id));
    onAddEffect(preset.metadata.effectType);
  };

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
        <div className="effect-library-tools">
          <label className="effect-search">
            <Search size={14} />
            <input
              type="search"
              value={search}
              placeholder="Search VFX"
              aria-label="Search VFX presets"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="effect-source-tabs" aria-label="VFX preset source">
            {(["all", "builtin", "custom"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={source === value ? "selected" : ""}
                aria-pressed={source === value}
                onClick={() => setSource(value)}
              >
                {value === "all" ? `All ${presets.length}` : value === "builtin" ? `Built-in ${presets.length}` : "Custom 0"}
              </button>
            ))}
          </div>
          <div className="effect-filter-row">
            <select
              value={category}
              aria-label="Filter VFX category"
              onChange={(event) => setCategory(event.target.value as typeof category)}
            >
              <option value="all">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select
              value=""
              aria-label="Add VFX tag filter"
              onChange={(event) => {
                const tag = event.target.value;
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags((current) => [...current, tag]);
                }
              }}
            >
              <option value="">Add tag</option>
              {tags.filter((tag) => !selectedTags.includes(tag)).map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              type="button"
              className={favoritesOnly ? "selected" : ""}
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((value) => !value)}
            >
              <Star size={13} fill={favoritesOnly ? "currentColor" : "none"} /> Favorites
            </button>
          </div>
          {selectedTags.length > 0 && (
            <div className="effect-tag-filters" aria-label="Active VFX tag filters">
              {selectedTags.map((tag) => (
                <button key={tag} type="button" onClick={() => setSelectedTags((current) => current.filter((value) => value !== tag))}>
                  {tag} ×
                </button>
              ))}
            </div>
          )}
          {recentPresets.length > 0 && source !== "custom" && (
            <div className="effect-recents">
              <span><Clock3 size={12} /> Recent</span>
              {recentPresets.slice(0, 5).map((preset) => (
                <button key={preset.metadata.id} type="button" onClick={() => addPreset(preset)}>
                  {preset.localizedName}
                </button>
              ))}
            </div>
          )}
          <small className="effect-result-count">
            {filteredPresets.length} result{filteredPresets.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="effect-library-list">
          {filteredPresets.map((preset) => {
            const unavailable =
              !preset.metadata.compatibility.capabilities.preview &&
              !preset.metadata.compatibility.capabilities.export;
            const favorite = preferences.favoriteIds.includes(preset.metadata.id);
            return (
              <div
                key={preset.metadata.id}
                className="effect-card"
                title={[
                  preset.definition.description,
                  ...preset.metadata.compatibility.limitations
                ].join(" ")}
              >
                <button
                  type="button"
                  className="effect-card-main"
                  disabled={unavailable}
                  onClick={() => addPreset(preset)}
                >
                  <strong>{preset.localizedName}</strong>
                  <span>{preset.metadata.category} / {preset.definition.space}</span>
                  <small>{preset.definition.description}</small>
                  <small>Built-in / {preset.metadata.compatibility.maturity}</small>
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="effect-favorite"
                  aria-label={`${favorite ? "Remove" : "Add"} ${preset.localizedName} ${favorite ? "from" : "to"} favorites`}
                  aria-pressed={favorite}
                  onClick={() => setPreferences((current) => toggleVfxLibraryFavorite(current, preset.metadata.id))}
                >
                  <Star size={14} fill={favorite ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
          {filteredPresets.length === 0 && (
            <span className="empty-note">
              {source === "custom" ? "No custom VFX packages are installed." : "No VFX presets match these filters."}
            </span>
          )}
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
