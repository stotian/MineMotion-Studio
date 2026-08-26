import { useMemo, useState } from "react";
import { Dices, Globe2, X } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import {
  DEFAULT_WORLDGEN,
  estimateBlockCount,
  listChunkCoords,
  type WorldGenSettings
} from "../../minecraft/worldgen/WorldGenerator";

interface WorldGeneratorPanelProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (settings: WorldGenSettings) => void;
  isGenerating: boolean;
  progress: { completed: number; total: number } | null;
}

/** Above this a generation is heavy enough to warn about before starting. */
const HEAVY_BLOCK_COUNT = 4_000_000;

export function WorldGeneratorPanel({
  open,
  onClose,
  onGenerate,
  isGenerating,
  progress
}: WorldGeneratorPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [settings, setSettings] = useState<WorldGenSettings>(DEFAULT_WORLDGEN);

  const chunkCount = useMemo(() => listChunkCoords(settings).length, [settings]);
  const blockEstimate = useMemo(() => estimateBlockCount(settings), [settings]);
  const heavy = blockEstimate > HEAVY_BLOCK_COUNT;

  if (!open) return null;

  const patch = (next: Partial<WorldGenSettings>) =>
    setSettings((current) => ({ ...current, ...next }));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("worldgen.title")}>
      <div className="modal-panel worldgen-modal">
        <header className="panel-header">
          <h2><Globe2 size={15} /> {t("worldgen.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")}>
            <X size={15} />
          </button>
        </header>

        <section className="inspector-section">
          <label>
            {t("worldgen.seed")}
            <input
              type="text"
              value={settings.seed}
              onChange={(event) => patch({ seed: event.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={() => patch({ seed: String(Math.floor(Math.random() * 2 ** 31)) })}
          >
            <Dices size={14} /> {t("worldgen.randomSeed")}
          </button>

          <label>
            {t("worldgen.radius")}
            <input
              type="number"
              min={0}
              max={32}
              value={settings.radiusChunks}
              onChange={(event) =>
                patch({ radiusChunks: clamp(Number(event.target.value), 0, 32) })
              }
            />
          </label>

          <label>
            {t("worldgen.seaLevel")}
            <input
              type="number"
              min={0}
              max={200}
              value={settings.seaLevel}
              onChange={(event) => patch({ seaLevel: Number(event.target.value) })}
            />
          </label>

          <label>
            {t("worldgen.caves")}
            <input
              type="checkbox"
              checked={settings.caves}
              onChange={(event) => patch({ caves: event.target.checked })}
            />
          </label>
        </section>

        <section className="inspector-section">
          <h3>{t("worldgen.estimate")}</h3>
          <p className="worldgen-estimate">
            {t("worldgen.estimateBody", {
              chunks: localization.formatNumber(chunkCount),
              blocks: localization.formatNumber(blockEstimate)
            })}
          </p>
          {heavy ? (
            <p className="worldgen-warning">{t("worldgen.heavyWarning")}</p>
          ) : null}
        </section>

        {isGenerating && progress ? (
          <section className="inspector-section">
            <progress value={progress.completed} max={progress.total} />
            <p>
              {t("worldgen.progress", {
                completed: progress.completed,
                total: progress.total
              })}
            </p>
          </section>
        ) : null}

        <div className="inspector-actions">
          <button
            type="button"
            className="primary-action"
            disabled={isGenerating}
            onClick={() => onGenerate(settings)}
          >
            {t("worldgen.generate")}
          </button>
          <button type="button" onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
