import { useState } from "react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { MineMotionProject } from "../../project/ProjectFile";
import { bakeIsometricTurntable } from "../../experimental/showcase/IsometricTurntable";
import { computeBuildBounds } from "../../experimental/showcase/BuildBounds";

interface IsometricTurntablePanelProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

export function IsometricTurntablePanel({ project, onProjectChange }: IsometricTurntablePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const bounds = computeBuildBounds(project);
  const [radius, setRadius] = useState(() => Math.round(bounds.radius));
  const [elevation, setElevation] = useState(30);
  const [duration, setDuration] = useState(240);
  const [turns, setTurns] = useState(1);

  const cameraId = project.activeCameraId;
  const hasCamera = project.scene.cameras.some((camera) => camera.id === cameraId);

  return (
    <section className="experimental-turntable-panel" aria-label={t("turntable.ariaLabel")}>
      <h3>{t("turntable.title")}</h3>
      <p className="warning-note">{t("turntable.description")}</p>
      <div className="form-grid three-columns">
        <label>{t("turntable.radius")}<input type="number" min={1} max={512} value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label>
        <label>{t("turntable.elevation")}<input type="number" min={-89} max={89} value={elevation} onChange={(event) => setElevation(Number(event.target.value))} /></label>
        <label>{t("turntable.duration")}<input type="number" min={1} max={12000} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
        <label>{t("turntable.turns")}<input type="number" min={1} max={12} value={turns} onChange={(event) => setTurns(Number(event.target.value))} /></label>
      </div>
      {!hasCamera && <p className="warning-note">{t("turntable.noCamera")}</p>}
      <button
        type="button"
        disabled={!hasCamera}
        onClick={() => onProjectChange(
          bakeIsometricTurntable(project, cameraId, {
            center: bounds.center,
            radius: Math.max(1, radius),
            elevationDegrees: elevation,
            startFrame: 0,
            durationFrames: Math.max(1, duration),
            turns: Math.max(1, turns)
          }),
          t("turntable.historyLabel")
        )}
      >
        {t("turntable.bake")}
      </button>
    </section>
  );
}
