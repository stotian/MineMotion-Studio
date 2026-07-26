import { createDeterministicId } from "../../core/ids/Id";
import type {
  AnimatableProperty,
  ReusableAnimationClip,
  Vector3Tuple
} from "../../project/ProjectFile";

export const PROCEDURAL_ANIMATION_VERSION = 1 as const;

export const PROCEDURAL_ANIMATION_KINDS = Object.freeze([
  "idle",
  "walk",
  "run",
  "crouch",
  "jump",
  "landing",
  "recoil",
  "hitReaction",
  "swordSwing",
  "turn"
] as const);

export type ProceduralAnimationKind =
  (typeof PROCEDURAL_ANIMATION_KINDS)[number];

export interface ProceduralAnimationSettings {
  version: typeof PROCEDURAL_ANIMATION_VERSION;
  kind: ProceduralAnimationKind;
  durationFrames: number;
  intensity: number;
  cycles: number;
  direction: -1 | 1;
}

export type ProceduralAnimationResult =
  | {
      ok: true;
      settings: ProceduralAnimationSettings;
      clip: ReusableAnimationClip;
      error: null;
    }
  | {
      ok: false;
      settings: null;
      clip: null;
      error: string;
    };

export const PROCEDURAL_ANIMATION_LIMITS = Object.freeze({
  minimumDurationFrames: 4,
  maximumDurationFrames: 480,
  maximumIntensity: 2,
  maximumCycles: 8,
  maximumKeyframes: 65,
  maximumRotationDegrees: 180
});

export const AVAILABLE_PROCEDURAL_ANIMATION_KINDS =
  Object.freeze(["idle"] as const satisfies readonly ProceduralAnimationKind[]);

const KIND_SET = new Set<ProceduralAnimationKind>(PROCEDURAL_ANIMATION_KINDS);
const DEFAULT_DURATION: Record<ProceduralAnimationKind, number> = {
  idle: 48,
  walk: 32,
  run: 24,
  crouch: 40,
  jump: 28,
  landing: 20,
  recoil: 16,
  hitReaction: 20,
  swordSwing: 28,
  turn: 36
};
const CLIP_NAMES: Record<ProceduralAnimationKind, string> = {
  idle: "Procedural Idle",
  walk: "Procedural Walk",
  run: "Procedural Run",
  crouch: "Procedural Crouch Walk",
  jump: "Procedural Jump",
  landing: "Procedural Landing",
  recoil: "Procedural Recoil",
  hitReaction: "Procedural Hit Reaction",
  swordSwing: "Procedural Sword Swing",
  turn: "Procedural Turn"
};

interface GeneratedBoneTrack {
  property: AnimatableProperty;
  keyframes: Array<{ frame: number; value: Vector3Tuple }>;
}

export function createDefaultProceduralAnimationSettings(
  kind: ProceduralAnimationKind = "idle"
): ProceduralAnimationSettings {
  return {
    version: PROCEDURAL_ANIMATION_VERSION,
    kind,
    durationFrames: DEFAULT_DURATION[kind],
    intensity: 1,
    cycles: kind === "idle" ? 1 : 2,
    direction: 1
  };
}

export function sanitizeProceduralAnimationSettings(
  value: unknown
): ProceduralAnimationSettings | null {
  const record = ownDataRecord(value);
  if (!record ||
    record.version !== PROCEDURAL_ANIMATION_VERSION ||
    !KIND_SET.has(record.kind as ProceduralAnimationKind)) {
    return null;
  }
  const kind = record.kind as ProceduralAnimationKind;
  const durationFrames = boundedInteger(
    record.durationFrames,
    PROCEDURAL_ANIMATION_LIMITS.minimumDurationFrames,
    PROCEDURAL_ANIMATION_LIMITS.maximumDurationFrames,
    DEFAULT_DURATION[kind]
  );
  const maximumCycles = Math.max(
    1,
    Math.min(
      PROCEDURAL_ANIMATION_LIMITS.maximumCycles,
      Math.floor(durationFrames / 4)
    )
  );
  return {
    version: PROCEDURAL_ANIMATION_VERSION,
    kind,
    durationFrames,
    intensity: boundedNumber(
      record.intensity,
      0,
      PROCEDURAL_ANIMATION_LIMITS.maximumIntensity,
      1
    ),
    cycles: boundedInteger(record.cycles, 1, maximumCycles, 1),
    direction: record.direction === -1 ? -1 : 1
  };
}

export function generateProceduralAnimation(
  input: unknown
): ProceduralAnimationResult {
  const settings = sanitizeProceduralAnimationSettings(input);
  if (!settings) {
    return failure(
      "PROCEDURAL_ANIMATION_SETTINGS_INVALID: Generator settings must be bounded plain data."
    );
  }
  if (!AVAILABLE_PROCEDURAL_ANIMATION_KINDS.includes(
    settings.kind as (typeof AVAILABLE_PROCEDURAL_ANIMATION_KINDS)[number]
  )) {
    return failure(
      `PROCEDURAL_ANIMATION_KIND_UNAVAILABLE: ${settings.kind}`
    );
  }
  const tracks = settings.kind === "idle" ? generateIdle(settings) : [];
  if (tracks.length === 0 ||
    tracks.some((track) =>
      track.keyframes.length === 0 ||
      track.keyframes.length > PROCEDURAL_ANIMATION_LIMITS.maximumKeyframes ||
      track.keyframes.some((keyframe) =>
        !Number.isInteger(keyframe.frame) ||
        keyframe.frame < 0 ||
        keyframe.frame > settings.durationFrames ||
        !boundedRotation(keyframe.value)
      )
    )) {
    return failure(
      "PROCEDURAL_ANIMATION_OUTPUT_INVALID: Generated keyframes exceeded safe limits."
    );
  }
  const identity = JSON.stringify([
    PROCEDURAL_ANIMATION_VERSION,
    settings.kind,
    settings.durationFrames,
    settings.intensity,
    settings.cycles,
    settings.direction
  ]);
  return {
    ok: true,
    settings,
    clip: {
      id: createDeterministicId("procedural_clip", identity),
      name: CLIP_NAMES[settings.kind],
      description: "Editable keyframes generated by MineMotion Studio.",
      targetType: "character",
      durationFrames: settings.durationFrames,
      tracks: tracks.map((track) => ({
        property: track.property,
        keyframes: track.keyframes.map((keyframe) => ({
          id: createDeterministicId(
            "procedural_key",
            `${identity}:${track.property}:${keyframe.frame}`
          ),
          frame: keyframe.frame,
          value: [...keyframe.value],
          interpolation: "ease-in-out"
        }))
      })),
      createdAt: new Date(0).toISOString()
    },
    error: null
  };
}

function generateIdle(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  const sampleCount = settings.cycles * 4;
  const samples = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const frame = Math.round(
      index * settings.durationFrames / sampleCount
    );
    const phase = index / sampleCount * Math.PI * 2 * settings.cycles;
    const breath = (1 - Math.cos(phase)) / 2 * settings.intensity;
    return { frame, breath };
  });
  return [
    boneTrack("body", samples.map(({ frame, breath }) => [
      frame,
      [1.5 * breath, 0, 0]
    ])),
    boneTrack("head", samples.map(({ frame, breath }) => [
      frame,
      [-breath, 0, 0]
    ])),
    boneTrack("leftArm", samples.map(({ frame, breath }) => [
      frame,
      [0.6 * breath, 0, -8]
    ])),
    boneTrack("rightArm", samples.map(({ frame, breath }) => [
      frame,
      [0.6 * breath, 0, 8]
    ]))
  ];
}

function boneTrack(
  boneId: string,
  keyframes: Array<[number, Vector3Tuple]>
): GeneratedBoneTrack {
  return {
    property: `bone.rotation.${boneId}`,
    keyframes: keyframes.map(([frame, value]) => ({
      frame,
      value: value.map((component) =>
        boundedNumber(
          component,
          -PROCEDURAL_ANIMATION_LIMITS.maximumRotationDegrees,
          PROCEDURAL_ANIMATION_LIMITS.maximumRotationDegrees,
          0
        )
      ) as Vector3Tuple
    }))
  };
}

function boundedRotation(value: unknown): value is Vector3Tuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) =>
      typeof component === "number" &&
      Number.isFinite(component) &&
      Math.abs(component) <=
        PROCEDURAL_ANIMATION_LIMITS.maximumRotationDegrees
    );
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return Math.round(boundedNumber(value, minimum, maximum, fallback));
}

function ownDataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([key, descriptor]) => [
        key,
        descriptor.value
      ])
    );
  } catch {
    return null;
  }
}

function failure(error: string): ProceduralAnimationResult {
  return { ok: false, settings: null, clip: null, error };
}
