import { useLocalization } from "../../localization/LocalizationContext";
import type {
  BuildAxis,
  BuildMode,
  BuildPacing,
  BuildRevealStrategy,
  BuildSequenceSettings
} from "../../experimental/buildsequencer/BuildSequenceTypes";

interface BuildSequencerControlsProps {
  hasWorld: boolean;
  value: BuildSequenceSettings | null;
  onChange: (value: BuildSequenceSettings | null) => void;
  /** Timeline length used as the default reveal duration when enabling. */
  timelineFrames?: number;
}

const BASE_SETTINGS: BuildSequenceSettings = {
  strategy: { kind: "layer", axis: "y", direction: "ascending" },
  startFrame: 0,
  durationFrames: 120,
  fadeFrames: 0,
  pacing: "linear"
};

type StrategyKind = BuildRevealStrategy["kind"];
const STRATEGY_KINDS: StrategyKind[] = ["layer", "scan", "radial", "scatter"];
const PACINGS: BuildPacing[] = ["linear", "ease-in", "ease-out", "ease-in-out"];
const MODES: BuildMode[] = ["assemble", "disassemble"];

// Preserve axis/seed/origin when switching strategies so the UI is predictable.
function strategyForKind(kind: StrategyKind, previous: BuildRevealStrategy): BuildRevealStrategy {
  const axis: BuildAxis = previous.kind === "layer" || previous.kind === "scan" ? previous.axis : "y";
  switch (kind) {
    case "layer":
    case "scan":
      return { kind, axis, direction: "ascending" };
    case "radial":
      return { kind, origin: previous.kind === "radial" ? previous.origin : [0, 0, 0], direction: "ascending" };
    case "scatter":
      return { kind, seed: previous.kind === "scatter" ? previous.seed : 1337 };
  }
}

export function BuildSequencerControls({ hasWorld, value, onChange, timelineFrames }: BuildSequencerControlsProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const enabled = value !== null;
  const defaultSettings: BuildSequenceSettings = {
    ...BASE_SETTINGS,
    durationFrames: timelineFrames && timelineFrames > 0 ? Math.round(timelineFrames) : BASE_SETTINGS.durationFrames
  };
  const settings = value ?? defaultSettings;

  return (
    <section className="experimental-build-panel" aria-label={t("buildSequencer.ariaLabel")}>
      <label className="experimental-build-toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={!hasWorld}
          onChange={(event) => onChange(event.target.checked ? defaultSettings : null)}
        />
        {t("buildSequencer.enable")}
      </label>
      {!hasWorld && <p className="warning-note">{t("buildSequencer.noWorld")}</p>}
      {enabled && hasWorld && (
        <div className="experimental-build-fields">
          <label>
            {t("buildSequencer.mode")}
            <select
              value={settings.mode ?? "assemble"}
              onChange={(event) => onChange({ ...settings, mode: event.target.value as BuildMode })}
            >
              {MODES.map((mode) => (
                <option key={mode} value={mode}>{t(`buildSequencer.mode.${mode}`)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("buildSequencer.strategy")}
            <select
              value={settings.strategy.kind}
              onChange={(event) => onChange({ ...settings, strategy: strategyForKind(event.target.value as StrategyKind, settings.strategy) })}
            >
              {STRATEGY_KINDS.map((kind) => (
                <option key={kind} value={kind}>{t(`buildSequencer.strategy.${kind}`)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("buildSequencer.pacing")}
            <select
              value={settings.pacing ?? "linear"}
              onChange={(event) => onChange({ ...settings, pacing: event.target.value as BuildPacing })}
            >
              {PACINGS.map((pacing) => (
                <option key={pacing} value={pacing}>{t(`buildSequencer.pacing.${pacing}`)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("buildSequencer.duration")}
            <input
              type="number"
              min={0}
              max={6000}
              value={settings.durationFrames}
              onChange={(event) => onChange({ ...settings, durationFrames: Math.max(0, Number(event.target.value)) })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
