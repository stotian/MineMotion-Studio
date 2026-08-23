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
  PROCEDURAL_ANIMATION_KINDS;

const KIND_SET = new Set<ProceduralAnimationKind>(PROCEDURAL_ANIMATION_KINDS);
const LOOP_KINDS = new Set<ProceduralAnimationKind>([
  "idle",
  "walk",
  "run",
  "crouch"
]);
const DIRECTIONAL_KINDS = new Set<ProceduralAnimationKind>([
  "walk",
  "run",
  "crouch",
  "recoil",
  "hitReaction",
  "swordSwing",
  "turn"
]);
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
    cycles: kind === "walk" || kind === "run" || kind === "crouch" ? 2 : 1,
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
    cycles: LOOP_KINDS.has(kind)
      ? boundedInteger(record.cycles, 1, maximumCycles, 1)
      : 1,
    direction: DIRECTIONAL_KINDS.has(kind) && record.direction === -1 ? -1 : 1
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
  const tracks = generateAvailableKind(settings);
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
      description: "Editable keyframes generated by BlockMotion Studio.",
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

function generateAvailableKind(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  if (settings.kind === "idle") return generateIdle(settings);
  if (settings.kind === "walk") {
    return generateLocomotion(settings, {
      armAmplitude: 28,
      legAmplitude: 28,
      bodyLean: 1.5,
      headPitch: -1
    });
  }
  if (settings.kind === "run") {
    return generateLocomotion(settings, {
      armAmplitude: 48,
      legAmplitude: 42,
      bodyLean: 8,
      headPitch: -4
    });
  }
  if (settings.kind === "crouch") {
    return generateLocomotion(settings, {
      armAmplitude: 18,
      legAmplitude: 16,
      bodyLean: 24,
      headPitch: -10
    });
  }
  if (settings.kind === "jump") return generateJump(settings);
  if (settings.kind === "landing") return generateLanding(settings);
  if (settings.kind === "recoil") return generateRecoil(settings);
  if (settings.kind === "hitReaction") return generateHitReaction(settings);
  if (settings.kind === "swordSwing") return generateSwordSwing(settings);
  if (settings.kind === "turn") return generateTurn(settings);
  return [];
}

interface LocomotionStyle {
  armAmplitude: number;
  legAmplitude: number;
  bodyLean: number;
  headPitch: number;
}

function generateLocomotion(
  settings: ProceduralAnimationSettings,
  style: LocomotionStyle
): GeneratedBoneTrack[] {
  const sampleCount = settings.cycles * 4;
  const samples = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const frame = Math.round(
      index * settings.durationFrames / sampleCount
    );
    const phase = index === sampleCount
      ? 0
      : index / sampleCount * Math.PI * 2 * settings.cycles *
        settings.direction;
    return {
      frame,
      arm: Math.sin(phase) * style.armAmplitude * settings.intensity,
      leg: Math.sin(phase) * style.legAmplitude * settings.intensity,
      sway: Math.sin(phase * 2) * 1.5 * settings.intensity
    };
  });
  return [
    boneTrack("body", samples.map(({ frame, sway }) => [
      frame,
      [style.bodyLean * settings.intensity, 0, sway]
    ])),
    boneTrack("head", samples.map(({ frame, sway }) => [
      frame,
      [style.headPitch * settings.intensity, 0, -sway * 0.4]
    ])),
    boneTrack("leftArm", samples.map(({ frame, arm }) => [
      frame,
      [arm, 0, -8]
    ])),
    boneTrack("rightArm", samples.map(({ frame, arm }) => [
      frame,
      [-arm, 0, 8]
    ])),
    boneTrack("leftLeg", samples.map(({ frame, leg }) => [
      frame,
      [-leg, 0, 0]
    ])),
    boneTrack("rightLeg", samples.map(({ frame, leg }) => [
      frame,
      [leg, 0, 0]
    ]))
  ];
}

interface ProceduralPose {
  amount: number;
  bones: Record<string, Vector3Tuple>;
}

function generateJump(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  return poseSequence(settings, [
    pose(0, {
      body: [12, 0, 0],
      head: [4, 0, 0],
      leftArm: [8, 0, -8],
      rightArm: [8, 0, 8],
      leftLeg: [-24, 0, -4],
      rightLeg: [-24, 0, 4]
    }),
    pose(0.25, {
      body: [-10, 0, 0],
      head: [-5, 0, 0],
      leftArm: [-44, 0, -16],
      rightArm: [-44, 0, 16],
      leftLeg: [24, 0, -4],
      rightLeg: [16, 0, 4]
    }),
    pose(0.68, {
      body: [-6, 0, 0],
      head: [-3, 0, 0],
      leftArm: [-30, 0, -12],
      rightArm: [-30, 0, 12],
      leftLeg: [18, 0, -6],
      rightLeg: [26, 0, 6]
    }),
    neutralPose(1, [
      "body",
      "head",
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg"
    ])
  ]);
}

function generateLanding(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  return poseSequence(settings, [
    pose(0, {
      body: [-5, 0, 0],
      head: [-2, 0, 0],
      leftArm: [-24, 0, -12],
      rightArm: [-24, 0, 12],
      leftLeg: [12, 0, -4],
      rightLeg: [12, 0, 4]
    }),
    pose(0.3, {
      body: [24, 0, 0],
      head: [10, 0, 0],
      leftArm: [24, 0, -18],
      rightArm: [24, 0, 18],
      leftLeg: [-34, 0, -8],
      rightLeg: [-34, 0, 8]
    }),
    pose(0.65, {
      body: [10, 0, 0],
      head: [4, 0, 0],
      leftArm: [8, 0, -10],
      rightArm: [8, 0, 10],
      leftLeg: [-12, 0, -3],
      rightLeg: [-12, 0, 3]
    }),
    neutralPose(1, [
      "body",
      "head",
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg"
    ])
  ]);
}

function generateRecoil(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  const direction = settings.direction;
  return poseSequence(settings, [
    pose(0, {
      body: [4, 8 * direction, 0],
      head: [-2, -6 * direction, 0],
      rightArm: [-78, -10 * direction, 12 * direction],
      rightForearm: [-34, 0, 0],
      leftArm: [-48, 10 * direction, -8 * direction]
    }),
    pose(0.28, {
      body: [-12, -8 * direction, -5 * direction],
      head: [-10, 10 * direction, 3 * direction],
      rightArm: [-112, 18 * direction, 22 * direction],
      rightForearm: [-58, 0, 0],
      leftArm: [-70, -8 * direction, -16 * direction]
    }),
    pose(0.62, {
      body: [-2, 4 * direction, 0],
      head: [-4, -3 * direction, 0],
      rightArm: [-90, -4 * direction, 14 * direction],
      rightForearm: [-42, 0, 0],
      leftArm: [-54, 5 * direction, -10 * direction]
    }),
    pose(1, {
      body: [4, 8 * direction, 0],
      head: [-2, -6 * direction, 0],
      rightArm: [-78, -10 * direction, 12 * direction],
      rightForearm: [-34, 0, 0],
      leftArm: [-48, 10 * direction, -8 * direction]
    })
  ]);
}

function generateHitReaction(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  const direction = settings.direction;
  return poseSequence(settings, [
    neutralPose(0, [
      "body",
      "head",
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg"
    ]),
    pose(0.35, {
      body: [-16, 18 * direction, 10 * direction],
      head: [-22, -24 * direction, -8 * direction],
      leftArm: [-38, 8 * direction, -22],
      rightArm: [-38, 8 * direction, 22],
      leftLeg: [8, 0, -5 * direction],
      rightLeg: [-8, 0, 5 * direction]
    }),
    pose(0.7, {
      body: [-6, 6 * direction, 3 * direction],
      head: [-8, -8 * direction, -2 * direction],
      leftArm: [-14, 2 * direction, -12],
      rightArm: [-14, 2 * direction, 12],
      leftLeg: [3, 0, -2 * direction],
      rightLeg: [-3, 0, 2 * direction]
    }),
    neutralPose(1, [
      "body",
      "head",
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg"
    ])
  ]);
}

function generateSwordSwing(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  const direction = settings.direction;
  return poseSequence(settings, [
    pose(0, {
      body: [0, -20 * direction, 0],
      head: [-6, -16 * direction, 0],
      rightArm: [-98, 14 * direction, 26 * direction],
      rightForearm: [-42, 0, 0],
      leftArm: [8, 0, -10]
    }),
    pose(0.42, {
      body: [0, 24 * direction, 0],
      head: [-8, 18 * direction, 0],
      rightArm: [-34, -20 * direction, -48 * direction],
      rightForearm: [-12, 0, 0],
      leftArm: [-8, 0, -12]
    }),
    pose(0.72, {
      body: [2, 10 * direction, 0],
      head: [-4, 8 * direction, 0],
      rightArm: [-12, -8 * direction, -18 * direction],
      rightForearm: [-4, 0, 0],
      leftArm: [0, 0, -8]
    }),
    neutralPose(1, [
      "body",
      "head",
      "rightArm",
      "rightForearm",
      "leftArm"
    ])
  ]);
}

function generateTurn(
  settings: ProceduralAnimationSettings
): GeneratedBoneTrack[] {
  const direction = settings.direction;
  return poseSequence(settings, [
    pose(0, {
      root: [0, 0, 0],
      body: [0, 0, 0],
      head: [0, 24 * direction, 0]
    }),
    pose(0.35, {
      root: [0, 28 * direction, 0],
      body: [0, 16 * direction, 0],
      head: [0, 18 * direction, 0]
    }),
    pose(0.7, {
      root: [0, 68 * direction, 0],
      body: [0, 12 * direction, 0],
      head: [0, 8 * direction, 0]
    }),
    pose(1, {
      root: [0, 90 * direction, 0],
      body: [0, 0, 0],
      head: [0, 0, 0]
    })
  ]);
}

function poseSequence(
  settings: ProceduralAnimationSettings,
  poses: ProceduralPose[]
): GeneratedBoneTrack[] {
  const boneIds = [...new Set(poses.flatMap((entry) =>
    Object.keys(entry.bones)
  ))];
  return boneIds.map((boneId) =>
    boneTrack(boneId, poses.map((entry) => [
      Math.round(entry.amount * settings.durationFrames),
      (entry.bones[boneId] ?? [0, 0, 0]).map((component) =>
        component * settings.intensity
      ) as Vector3Tuple
    ]))
  );
}

function pose(
  amount: number,
  bones: Record<string, Vector3Tuple>
): ProceduralPose {
  return { amount, bones };
}

function neutralPose(amount: number, boneIds: string[]): ProceduralPose {
  return pose(amount, Object.fromEntries(boneIds.map((boneId) => [
    boneId,
    boneId === "leftArm"
      ? [0, 0, -8]
      : boneId === "rightArm"
        ? [0, 0, 8]
        : [0, 0, 0]
  ])));
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
  const bounded = typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
  return Object.is(bounded, -0) ? 0 : bounded;
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
