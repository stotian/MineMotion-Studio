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
import { scheduleBuiltinVfxPresetPreviews } from "../../vfx/library/VfxPresetPreviewCache";
import type {
  InstalledCustomVfxPreset,
  InstalledVfxSourceStatus
} from "../../vfx/package/VfxPackageProjectIntegration";

interface EffectsLibraryPanelProps {
  presets: readonly BuiltinVfxPreset[];
  customPresets: readonly InstalledCustomVfxPreset[];
  selectedEffectId: string | null;
  effectInstances: readonly EffectInstance[];
  audioClips: AudioClip[];
  builtinSfx: BuiltinSfxDefinition[];
  postPresets: PostProcessingPreset[];
  activePostPresetId: PostProcessingPresetId;
  renderSettings: RenderSettings;
  onAddEffect: (type: EffectType) => void;
  onAddCustomEffect: (packageId: string) => void;
  getCustomSourceStatus: (effect: EffectInstance) => InstalledVfxSourceStatus | null;
  onSelectEffect: (effectId: string) => void;
  onApplyPostPreset: (presetId: PostProcessingPresetId) => void;
  onToggleRenderPreview: () => void;
  onToggleCinematicBars: () => void;
  onImportAudio: () => void;
  onAddBuiltinSfx: (sfxId: string) => void;
}

export function EffectsLibraryPanel({
  presets,
  customPresets,
  selectedEffectId,
  effectInstances,
  audioClips,
  builtinSfx,
  postPresets,
  activePostPresetId,
  renderSettings,
  onAddEffect,
  onAddCustomEffect,
  getCustomSourceStatus,
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
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
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
  const filteredCustomPresets = useMemo(() => {
    if (source === "builtin" || category !== "all" || selectedTags.length > 0 || favoritesOnly) return [];
    const needle = search.trim().toLocaleLowerCase();
    return customPresets.filter((preset) =>
      needle === "" || [preset.displayName, preset.description, preset.packageId, preset.author]
        .some((value) => value.toLocaleLowerCase().includes(needle))
    );
  }, [category, customPresets, favoritesOnly, search, selectedTags, source]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      saveVfxLibraryPreferences(window.localStorage, preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return scheduleBuiltinVfxPresetPreviews(
      presets,
      window.localStorage,
      (presetId, dataUrl) => setPreviewUrls((current) =>
        current[presetId] === dataUrl
          ? current
          : { ...current, [presetId]: dataUrl }
      )
    );
  }, [presets]);

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
                {value === "all" ? `All ${presets.length + customPresets.length}` : value === "builtin" ? `Built-in ${presets.length}` : `Custom ${customPresets.length}`}
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
            {filteredPresets.length + filteredCustomPresets.length} result{filteredPresets.length + filteredCustomPresets.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="effect-library-list">
          {filteredPresets.map((preset) => {
            const unavailable =
              !preset.metadata.compatibility.capabilities.preview &&
              !preset.metadata.compatibility.capabilities.export;
            const favorite = preferences.favoriteIds.includes(preset.metadata.id);
            const previewUrl = previewUrls[preset.metadata.id];
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
                  {previewUrl ? (
                    <img className="effect-preview" src={previewUrl} alt="" />
                  ) : (
                    <span className="effect-preview effect-preview-pending" aria-label="Preview pending">
                      <Sparkles size={18} />
                    </span>
                  )}
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
          {filteredCustomPresets.map((preset) => (
            <div key={`${preset.packageId}@${preset.packageVersion}`} className="effect-card" title={`${preset.description} ${preset.author} / ${preset.license}`}>
              <button type="button" className="effect-card-main" onClick={() => onAddCustomEffect(preset.packageId)}>
                <img className="effect-preview" src={preset.previewDataUrl} alt="" />
                <strong>{preset.displayName}</strong>
                <span>Custom / {preset.space}</span>
                <small>{preset.description}</small>
                <small>{preset.packageId} / {preset.packageVersion}</small>
                <Plus size={14} />
              </button>
            </div>
          ))}
          {filteredPresets.length + filteredCustomPresets.length === 0 && (
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
              <small>{(() => {
                const sourceStatus = getCustomSourceStatus(effect);
                const state = effect.enabled ? "Enabled" : "Disabled";
                if (sourceStatus === "missing") return `${state} / source package missing (embedded recipe kept)`;
                if (sourceStatus === "disabled") return `${state} / source package disabled (embedded recipe kept)`;
                if (sourceStatus === "version-mismatch") return `${state} / source package version changed (embedded recipe kept)`;
                return effect.enabled ? "Enabled" : "Disabled";
              })()}</small>
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
