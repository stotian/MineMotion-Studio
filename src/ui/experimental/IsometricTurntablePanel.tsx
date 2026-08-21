import { useState } from "react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { bakeIsometricTurntable } from "../../experimental/showcase/IsometricTurntable";

interface IsometricTurntablePanelProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

// A sensible orbit centre: the world spawn, else the centroid of placed scene
// objects, else the origin at eye height.
function deriveCenter(project: MineMotionProject): Vector3Tuple {
  if (project.world?.spawn) return [...project.world.spawn];
  const positions = [
    ...project.scene.characters.map((entity) => entity.transform.position),
    ...project.scene.importedObjects.map((entity) => entity.transform.position)
  ];
  if (positions.length === 0) return [0, 2, 0];
  const sum = positions.reduce<Vector3Tuple>((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
  return [sum[0] / positions.length, sum[1] / positions.length + 1, sum[2] / positions.length];
}

export function IsometricTurntablePanel({ project, onProjectChange }: IsometricTurntablePanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [radius, setRadius] = useState(16);
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
            center: deriveCenter(project),
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
