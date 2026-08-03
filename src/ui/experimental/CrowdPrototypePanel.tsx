import { useMemo, useState } from "react";
import { generateCrowdPrototype, applyCrowdPrototype } from "../../experimental/crowds/CrowdGenerator";
import { useLocalization } from "../../localization/LocalizationContext";
import type { MineMotionProject } from "../../project/ProjectFile";

interface CrowdPrototypePanelProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

export function CrowdPrototypePanel({ project, onProjectChange }: CrowdPrototypePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [count, setCount] = useState(24);
  const [radius, setRadius] = useState(12);
  const [seed, setSeed] = useState(25);
  const center = project.world?.spawn ?? project.scene.characters[0]?.transform.position ?? [0, 1.05, 0];
  const result = useMemo(
    () => generateCrowdPrototype({ count, radius, seed, center, spacing: 1.4 }),
    [count, radius, seed, center[0], center[1], center[2]]
  );

  return (
    <section className="experimental-crowd-panel" aria-label={t("crowd.ariaLabel")}>
      <h3>{t("crowd.title")}</h3>
      <p className="warning-note">{t("crowd.description")}</p>
      <div className="form-grid three-columns">
        <label>{t("crowd.characters")}<input type="number" min={1} max={80} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
        <label>{t("crowd.radius")}<input type="number" min={2} max={64} value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label>
        <label>{t("crowd.seed")}<input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value))} /></label>
      </div>
      <p>{t("crowd.metrics", {
        count: localization.formatNumber(result.metrics.generated),
        cpu: localization.formatNumber(Math.round(result.metrics.estimatedCpuBytes / 1024)),
        gpu: localization.formatNumber(Math.round(result.metrics.estimatedGpuBytes / 1024)),
        duration: localization.formatNumber(result.metrics.generationMs, { maximumFractionDigits: 2 })
      })}</p>
      {result.metrics.generated < result.metrics.requested && (
        <p className="warning-note">{t("crowd.spacingWarning", {
          generated: result.metrics.generated,
          requested: result.metrics.requested
        })}</p>
      )}
      <button
        type="button"
        onClick={() => onProjectChange(
          applyCrowdPrototype(project, result),
          t("crowd.historyLabel")
        )}
      >
        {t("crowd.apply")}
      </button>
    </section>
  );
}
