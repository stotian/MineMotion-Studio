import type {
  BlockingSnapshot,
  CameraRigRecord,
  CinematicSequence,
  CompositionCheck,
  ContinuityAxis,
  DirectorAnnotation,
  FocusCue,
  PhysicalCameraProfile,
  SequenceClipRecord,
  StoryboardLink,
  TakeVariantGroup,
  UltraVector2,
  UltraVector3
} from "../UltraTypes";

export interface CameraExposurePlan {
  horizontalFovDegrees: number;
  verticalFovDegrees: number;
  exposureValue100: number;
  shutterSeconds: number;
  circleOfConfusionMm: number;
}

export interface CameraRigSample {
  position: UltraVector3;
  target: UltraVector3;
  rollDegrees: number;
}

export interface CompositionSubject {
  id: string;
  screenPosition: UltraVector2;
  screenBounds: readonly [number, number, number, number];
  gazeDirection?: UltraVector2;
}

export interface CompositionFinding {
  rule: CompositionCheck["rule"];
  subjectId: string;
  score: number;
  severity: "info" | "warning";
  message: string;
}

export interface ContinuityShotSample {
  shotId: string;
  cameraPosition: UltraVector3;
  subjectPosition: UltraVector3;
  gazeDirection?: UltraVector3;
}

export interface ContinuityFinding {
  shotId: string;
  crossedAxis: boolean;
  allowed: boolean;
  screenSide: -1 | 0 | 1;
  gazeReversal: boolean;
}

export interface FocusSample {
  frame: number;
  distance: number;
  progress: number;
}

export interface SequenceAssembly {
  valid: boolean;
  durationFrames: number;
  clips: SequenceClipRecord[];
  overlaps: Array<{ firstId: string; secondId: string; frames: number }>;
  gaps: Array<{ startFrame: number; endFrame: number }>;
}

export function calculatePhysicalCamera(profile: PhysicalCameraProfile): CameraExposurePlan {
  const sensorWidth = clamp(finite(profile.sensorWidthMm, 36), 1, 100);
  const sensorHeight = clamp(finite(profile.sensorHeightMm, 20.25), 1, 100);
  const focalLength = clamp(finite(profile.focalLengthMm, 35), 1, 2000);
  const aperture = clamp(finite(profile.apertureFStop, 2.8), 0.5, 64);
  const shutterAngle = clamp(finite(profile.shutterAngleDegrees, 180), 1, 360);
  const iso = clamp(finite(profile.iso, 400), 25, 25600);
  const horizontalFovDegrees = radiansToDegrees(2 * Math.atan(sensorWidth / (2 * focalLength)));
  const verticalFovDegrees = radiansToDegrees(2 * Math.atan(sensorHeight / (2 * focalLength)));
  const shutterSeconds = shutterAngle / 360 / 24;
  const exposureValue100 = Math.log2((aperture ** 2) / shutterSeconds) - Math.log2(iso / 100);
  const circleOfConfusionMm = sensorWidth / 1500;
  return {
    horizontalFovDegrees: canonical(horizontalFovDegrees),
    verticalFovDegrees: canonical(verticalFovDegrees),
    exposureValue100: canonical(exposureValue100),
    shutterSeconds: canonical(shutterSeconds),
    circleOfConfusionMm: canonical(circleOfConfusionMm)
  };
}

export function sampleCameraRig(rig: CameraRigRecord, progress: number, targetPosition?: UltraVector3): CameraRigSample {
  const t = clamp01(progress);
  const path = rig.path.length > 0 ? rig.path : [rig.origin];
  const position = samplePolyline(path, t);
  const target = targetPosition ?? add(position, [0, 0, -1]);
  const stabilized = clamp01(rig.stabilization);
  const targetWithStabilization: UltraVector3 = [
    lerp(position[0], target[0], stabilized),
    lerp(position[1], target[1], stabilized),
    lerp(position[2] - 1, target[2], stabilized)
  ];
  return {
    position: canonicalVector(position),
    target: canonicalVector(targetWithStabilization),
    rollDegrees: canonical(rig.rollDegrees * (1 - stabilized * 0.35))
  };
}

export function evaluateComposition(check: CompositionCheck, subjects: readonly CompositionSubject[]): CompositionFinding[] {
  const tolerance = clamp(finite(check.tolerance, 0.12), 0.01, 0.5);
  const relevant = check.subjectIds.length > 0
    ? subjects.filter((subject) => check.subjectIds.includes(subject.id))
    : [...subjects];
  return relevant.map((subject) => {
    const score = compositionScore(check.rule, subject);
    return {
      rule: check.rule,
      subjectId: subject.id,
      score: canonical(score),
      severity: score >= 1 - tolerance ? "info" : "warning",
      message: score >= 1 - tolerance
        ? `${subject.id} satisfies ${check.rule}.`
        : `${subject.id} is outside the ${check.rule} tolerance.`
    };
  });
}

export function checkContinuity(axis: ContinuityAxis, shots: readonly ContinuityShotSample[]): ContinuityFinding[] {
  const axisDirection = normalize(axis.direction);
  const results: ContinuityFinding[] = [];
  let previousSide: -1 | 0 | 1 = 0;
  let previousGaze: UltraVector3 | undefined;
  for (const shot of shots) {
    if (!axis.shotIds.includes(shot.shotId)) continue;
    const relativeCamera = subtract(shot.cameraPosition, axis.origin);
    const sideValue = crossY(axisDirection, relativeCamera);
    const side: -1 | 0 | 1 = Math.abs(sideValue) < 1e-8 ? 0 : sideValue > 0 ? 1 : -1;
    const crossedAxis = previousSide !== 0 && side !== 0 && side !== previousSide;
    const allowed = !crossedAxis || axis.allowedCrossingShotIds.includes(shot.shotId);
    const gazeReversal = Boolean(previousGaze && shot.gazeDirection && dot(normalize(previousGaze), normalize(shot.gazeDirection)) < -0.2);
    results.push({ shotId: shot.shotId, crossedAxis, allowed, screenSide: side, gazeReversal });
    if (side !== 0) previousSide = side;
    if (shot.gazeDirection) previousGaze = shot.gazeDirection;
  }
  return results;
}

export function sampleFocusCue(cue: FocusCue, frame: number): FocusSample {
  const start = Math.max(0, Math.round(cue.startFrame));
  const end = Math.max(start + 1, Math.round(cue.endFrame));
  const raw = clamp01((frame - start) / (end - start));
  const progress = applyEasing(raw, cue.easing);
  const distance = Math.max(0.01, lerp(cue.sourceDistance, cue.targetDistance, progress));
  return { frame: Math.round(frame), distance: canonical(distance), progress: canonical(progress) };
}

export function createBlockingSnapshot(
  id: string,
  sceneId: string,
  frame: number,
  transforms: BlockingSnapshot["entityTransforms"],
  now = new Date().toISOString()
): BlockingSnapshot {
  return {
    id,
    name: `Blocking ${Math.max(0, Math.round(frame))}`,
    enabled: true,
    notes: "",
    tags: ["blocking"],
    createdAt: now,
    updatedAt: now,
    sceneId,
    frame: Math.max(0, Math.round(frame)),
    entityTransforms: Object.fromEntries(Object.entries(transforms).map(([entityId, transform]) => [entityId, {
      position: canonicalVector(transform.position),
      rotation: canonicalVector(transform.rotation),
      scale: canonicalVector(transform.scale)
    }])),
    proxyQuality: "box"
  };
}

export function linkStoryboardToShot(link: StoryboardLink, validShotIds: ReadonlySet<string>, validCardIds: ReadonlySet<string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!validShotIds.has(link.shotId)) errors.push(`Unknown shot ${link.shotId}.`);
  if (!validCardIds.has(link.storyboardCardId)) errors.push(`Unknown storyboard card ${link.storyboardCardId}.`);
  if (link.durationFrames < 1) errors.push("Storyboard duration must be positive.");
  return { valid: errors.length === 0, errors };
}

export function chooseActiveTake(group: TakeVariantGroup): string | null {
  if (group.takeIds.length === 0) return null;
  if (group.takeIds.includes(group.activeTakeId)) return group.activeTakeId;
  return [...group.takeIds].sort((a, b) => (group.ratings[b] ?? 0) - (group.ratings[a] ?? 0) || a.localeCompare(b))[0];
}

export function filterOpenAnnotations(annotations: readonly DirectorAnnotation[], shotId: string, revision: number, frame?: number): DirectorAnnotation[] {
  return annotations
    .filter((annotation) => annotation.enabled && annotation.shotId === shotId && annotation.revision === revision && annotation.status === "open")
    .filter((annotation) => frame === undefined || annotation.frame === frame)
    .sort((a, b) => a.frame - b.frame || a.createdAt.localeCompare(b.createdAt));
}

export function assembleCinematicSequence(sequence: CinematicSequence): SequenceAssembly {
  const clips = [...sequence.clips]
    .filter((clip) => clip.sourceOutFrame >= clip.sourceInFrame)
    .map((clip) => ({
      ...clip,
      startFrame: Math.max(0, Math.round(clip.startFrame)),
      sourceInFrame: Math.max(0, Math.round(clip.sourceInFrame)),
      sourceOutFrame: Math.max(0, Math.round(clip.sourceOutFrame)),
      transitionFrames: Math.max(0, Math.round(clip.transitionFrames))
    }))
    .sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id));
  const overlaps: SequenceAssembly["overlaps"] = [];
  const gaps: SequenceAssembly["gaps"] = [];
  let cursor = 0;
  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index];
    const duration = clip.sourceOutFrame - clip.sourceInFrame + 1;
    if (clip.startFrame > cursor) gaps.push({ startFrame: cursor, endFrame: clip.startFrame - 1 });
    if (index > 0) {
      const previous = clips[index - 1];
      const previousEnd = previous.startFrame + (previous.sourceOutFrame - previous.sourceInFrame + 1) - 1;
      if (clip.startFrame <= previousEnd) {
        overlaps.push({ firstId: previous.id, secondId: clip.id, frames: previousEnd - clip.startFrame + 1 });
      }
    }
    cursor = Math.max(cursor, clip.startFrame + duration);
  }
  return {
    valid: overlaps.every((overlap) => {
      const clip = clips.find((candidate) => candidate.id === overlap.secondId);
      return overlap.frames <= (clip?.transitionFrames ?? 0);
    }),
    durationFrames: cursor,
    clips,
    overlaps,
    gaps
  };
}

function compositionScore(rule: CompositionCheck["rule"], subject: CompositionSubject): number {
  const [x, y] = subject.screenPosition;
  const [left, top, right, bottom] = subject.screenBounds;
  switch (rule) {
    case "thirds": {
      const targets: UltraVector2[] = [[1 / 3, 1 / 3], [2 / 3, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 2 / 3]];
      const nearest = Math.min(...targets.map((target) => Math.hypot(x - target[0], y - target[1])));
      return clamp01(1 - nearest / 0.5);
    }
    case "symmetry": return clamp01(1 - Math.abs(x - 0.5) * 2);
    case "look-room": {
      const direction = subject.gazeDirection?.[0] ?? 0;
      const room = direction >= 0 ? 1 - right : left;
      return clamp01(room / 0.35);
    }
    case "head-room": return clamp01(1 - Math.abs(top - 0.08) / 0.35);
    case "diagonal": return clamp01(1 - Math.min(Math.abs(y - x), Math.abs(y - (1 - x))) / 0.5);
  }
}

function samplePolyline(path: readonly UltraVector3[], progress: number): UltraVector3 {
  if (path.length === 1) return path[0];
  const lengths = path.slice(1).map((point, index) => distance(path[index], point));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  if (total <= 1e-8) return path[0];
  let target = total * progress;
  for (let index = 0; index < lengths.length; index += 1) {
    if (target <= lengths[index]) return lerpVector(path[index], path[index + 1], target / Math.max(lengths[index], 1e-8));
    target -= lengths[index];
  }
  return path.at(-1)!;
}

function applyEasing(value: number, easing: FocusCue["easing"]): number {
  switch (easing) {
    case "linear": return value;
    case "ease-in": return value * value;
    case "ease-out": return 1 - (1 - value) ** 2;
    case "ease-in-out": return value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2;
  }
}

function crossY(a: UltraVector3, b: UltraVector3): number { return a[2] * b[0] - a[0] * b[2]; }
function dot(a: UltraVector3, b: UltraVector3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function add(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function subtract(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function length(value: UltraVector3): number { return Math.hypot(value[0], value[1], value[2]); }
function normalize(value: UltraVector3): UltraVector3 { const len = length(value); return len <= 1e-8 ? [0, 0, 0] : [value[0] / len, value[1] / len, value[2] / len]; }
function distance(a: UltraVector3, b: UltraVector3): number { return length(subtract(a, b)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpVector(a: UltraVector3, b: UltraVector3, t: number): UltraVector3 { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function clamp01(value: number): number { return clamp(finite(value), 0, 1); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function radiansToDegrees(value: number): number { return value * 180 / Math.PI; }
function canonical(value: number): number { const finiteValue = finite(value); return Object.is(finiteValue, -0) ? 0 : Number(finiteValue.toFixed(8)); }
function canonicalVector(value: readonly [number, number, number]): UltraVector3 { return [canonical(value[0]), canonical(value[1]), canonical(value[2])]; }
