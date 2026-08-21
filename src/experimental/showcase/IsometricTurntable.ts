import type { AnimationTrack, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { cameraPositionFromOrbit, lookAtRotation } from "../../production/director/CameraMath";

// Experimental "Isometric Showcase Turntable": a Minecraft-native camera move
// that orbits a build at the classic isometric elevation for a clean showcase
// render — the shot Minecraft creators reach for and that Blender has no
// built-in equivalent of. It is a deterministic generator that bakes ordinary
// camera transform keyframes into the existing animation tracks (like the
// procedural animation generators, TD-037), so playback and export consume it
// with no renderer or schema changes.

export interface IsometricTurntableOptions {
  /** Point the camera orbits and looks at (usually the build's centre). */
  center: Vector3Tuple;
  /** Horizontal orbit distance from the centre. */
  radius: number;
  /** Camera elevation above the horizon in degrees. Defaults to 30 (iso-ish). */
  elevationDegrees?: number;
  startFrame: number;
  /** Frames for one full 360 revolution. */
  durationFrames: number;
  /** Number of full revolutions. Defaults to 1. */
  turns?: number;
  /** Yaw spacing between keyframes in degrees (2-90). Defaults to 15. */
  degreesPerKeyframe?: number;
}

export interface TurntableKeyframe {
  frame: number;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

/** Deterministically compute the orbiting camera keyframes. */
export function computeIsometricTurntable(options: IsometricTurntableOptions): TurntableKeyframe[] {
  const center = requireFiniteVector(options.center, "center");
  const radius = requireFinite(options.radius, "radius");
  if (radius <= 0) throw new RangeError("Turntable radius must be positive.");
  const startFrame = Math.round(requireFinite(options.startFrame, "startFrame"));
  const duration = Math.round(requireFinite(options.durationFrames, "durationFrames"));
  if (duration < 1) throw new RangeError("Turntable durationFrames must be at least 1.");
  const turns = Math.max(1, Math.round(options.turns ?? 1));
  const elevation = clamp(requireFinite(options.elevationDegrees ?? 30, "elevationDegrees"), -89, 89);
  const degPerKf = clamp(requireFinite(options.degreesPerKeyframe ?? 15, "degreesPerKeyframe"), 2, 90);

  const heightOffset = radius * Math.tan((elevation * Math.PI) / 180);
  const totalDegrees = 360 * turns;
  const totalFrames = duration * turns;
  const steps = Math.ceil(totalDegrees / degPerKf);

  const keyframes: TurntableKeyframe[] = [];
  let lastFrame = Number.NEGATIVE_INFINITY;
  for (let step = 0; step <= steps; step += 1) {
    const degrees = Math.min(step * degPerKf, totalDegrees);
    const fraction = degrees / totalDegrees;
    const frame = Math.round(startFrame + fraction * totalFrames);
    if (frame === lastFrame) continue; // keep frames strictly increasing
    lastFrame = frame;
    const position = cameraPositionFromOrbit(center, radius, degrees, heightOffset);
    keyframes.push({ frame, position, rotation: lookAtRotation(position, center) });
  }
  return keyframes;
}

/**
 * Bake the turntable onto a camera by replacing its transform.position and
 * transform.rotation tracks. Returns a new project; the input is not mutated.
 * Returns the original project when the camera does not exist.
 */
export function bakeIsometricTurntable(
  project: MineMotionProject,
  cameraId: string,
  options: IsometricTurntableOptions
): MineMotionProject {
  if (!project.scene.cameras.some((camera) => camera.id === cameraId)) return project;
  const keyframes = computeIsometricTurntable(options);

  const positionTrack: AnimationTrack = {
    id: `turntable_pos_${cameraId}`,
    targetId: cameraId,
    property: "transform.position",
    keyframes: keyframes.map((keyframe) => ({
      id: `turntable_pos_${cameraId}_${keyframe.frame}`,
      frame: keyframe.frame,
      value: [...keyframe.position] as Vector3Tuple,
      interpolation: "linear"
    }))
  };
  const rotationTrack: AnimationTrack = {
    id: `turntable_rot_${cameraId}`,
    targetId: cameraId,
    property: "transform.rotation",
    keyframes: keyframes.map((keyframe) => ({
      id: `turntable_rot_${cameraId}_${keyframe.frame}`,
      frame: keyframe.frame,
      value: [...keyframe.rotation] as Vector3Tuple,
      interpolation: "linear"
    }))
  };

  const preserved = project.animation.tracks.filter(
    (track) =>
      !(
        track.targetId === cameraId &&
        (track.property === "transform.position" || track.property === "transform.rotation")
      )
  );
  const durationFrames = Math.max(
    project.animation.durationFrames,
    keyframes.length > 0 ? keyframes[keyframes.length - 1].frame : project.animation.durationFrames
  );
  return {
    ...project,
    animation: {
      ...project.animation,
      durationFrames,
      tracks: [...preserved, positionTrack, rotationTrack]
    }
  };
}

export interface StaticShotOptions {
  center: Vector3Tuple;
  radius: number;
  /** Orbit yaw for the static angle in degrees. Defaults to 45 (three-quarter). */
  yawDegrees?: number;
  /** Camera elevation in degrees. Defaults to 30. */
  elevationDegrees?: number;
}

/**
 * Place the camera at a single good isometric three-quarter angle framing the
 * build, without animating it. Returns a new project; unknown camera → original.
 */
export function frameBuildStaticShot(
  project: MineMotionProject,
  cameraId: string,
  options: StaticShotOptions
): MineMotionProject {
  if (!project.scene.cameras.some((camera) => camera.id === cameraId)) return project;
  const center = requireFiniteVector(options.center, "center");
  const radius = requireFinite(options.radius, "radius");
  if (radius <= 0) throw new RangeError("Static shot radius must be positive.");
  const yaw = requireFinite(options.yawDegrees ?? 45, "yawDegrees");
  const elevation = clamp(requireFinite(options.elevationDegrees ?? 30, "elevationDegrees"), -89, 89);
  const heightOffset = radius * Math.tan((elevation * Math.PI) / 180);
  const position = cameraPositionFromOrbit(center, radius, yaw, heightOffset);
  const rotation = lookAtRotation(position, center);
  return {
    ...project,
    scene: {
      ...project.scene,
      cameras: project.scene.cameras.map((camera) =>
        camera.id === cameraId
          ? { ...camera, transform: { ...camera.transform, position: [...position], rotation: [...rotation] } }
          : camera
      )
    }
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function requireFiniteVector(value: Vector3Tuple, label: string): Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
    throw new TypeError(`${label} must be three finite numbers.`);
  }
  return value;
}
