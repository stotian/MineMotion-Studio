import {
  deriveSeed,
  randomFloat01
} from "../../core/random/DeterministicRandom";
import type { TransformData, Vector3Tuple } from "../../core/scene/SceneTypes";
import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import type { VfxTarget } from "../core/VfxInstance";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import {
  VFX_QUALITY_SCALES,
  type VfxActiveFrameEvaluation
} from "../runtime/VfxFrameEvaluator";
import {
  isFinitePrimitiveVector,
  lerpPrimitiveNumber,
  lerpPrimitiveVector,
  normalizePrimitiveNumber,
  randomUnitVector,
  samplePolyline,
  selectNestedSampleIndices
} from "./VfxPrimitiveSampling";
import {
  VFX_PRIMITIVE_LIMITS,
  VFX_PRIMITIVE_VERSION,
  type VfxBeamDescriptor,
  type VfxBeamEvaluation,
  type VfxExpandingRingDescriptor,
  type VfxExpandingRingEvaluation,
  type VfxLightPulseDescriptor,
  type VfxLightPulseEvaluation,
  type VfxParticleEmitterDescriptor,
  type VfxParticleEmitterEvaluation,
  type VfxParticleSample,
  type VfxPrimitiveBudget,
  type VfxPrimitiveDescriptor,
  type VfxPrimitiveEvaluation,
  type VfxPrimitivePlacement,
  type VfxPrimitiveSource,
  type VfxTrailDescriptor,
  type VfxTrailEvaluation
} from "./VfxPrimitiveTypes";
import {
  sortVfxPrimitiveIssues,
  validateVfxPrimitiveDescriptor
} from "./VfxPrimitiveValidator";

export type VfxPrimitiveEvaluationResult =
  ValidationResult<VfxPrimitiveEvaluation>;

const UINT32_MAX = 0xffffffff;
const VFX_QUALITIES = new Set<VfxQuality>([
  "draft",
  "medium",
  "high",
  "final"
]);
const VFX_SPACES = new Set(["world", "screen", "camera"]);
const VFX_BLEND_MODES = new Set([
  "normal",
  "additive",
  "multiply",
  "screen",
  "difference"
]);
const VFX_RENDER_LAYERS = new Set(["world", "camera", "overlay", "post"]);

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isFiniteVector3(value: unknown): value is Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3) return false;
  for (let index = 0; index < 3; index += 1) {
    const component = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      !component ||
      !component.enumerable ||
      !("value" in component) ||
      typeof component.value !== "number" ||
      !Number.isFinite(component.value)
    ) {
      return false;
    }
  }
  return true;
}

function isTransform(value: unknown): value is TransformData {
  return (
    isPlainRecord(value) &&
    isFiniteVector3(value.position) &&
    isFiniteVector3(value.rotation) &&
    isFiniteVector3(value.scale)
  );
}

function isTarget(value: unknown): value is VfxTarget | null {
  if (value === null) return true;
  return (
    isPlainRecord(value) &&
    typeof value.entityId === "string" &&
    value.entityId.trim() !== "" &&
    (value.boneId === undefined ||
      (typeof value.boneId === "string" && value.boneId.trim() !== ""))
  );
}

function isUint32(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= UINT32_MAX
  );
}

function validateActiveFrame(frame: VfxActiveFrameEvaluation): ValidationIssue[] {
  if (!isPlainRecord(frame) || frame.status !== "active") {
    return [
      issue(
        "VFX_PRIMITIVE_FRAME_INVALID",
        "Primitive evaluation requires an active VFX frame.",
        "frame"
      )
    ];
  }

  const inputs = frame.inputs;
  const qualityIsValid = VFX_QUALITIES.has(frame.quality);
  const qualityScale = qualityIsValid
    ? VFX_QUALITY_SCALES[frame.quality]
    : undefined;
  const valid =
    typeof frame.instanceId === "string" &&
    frame.instanceId.trim() !== "" &&
    typeof frame.definitionId === "string" &&
    frame.definitionId.trim() !== "" &&
    Number.isSafeInteger(frame.frame) &&
    frame.frame >= 0 &&
    Number.isFinite(frame.fps) &&
    frame.fps > 0 &&
    Number.isSafeInteger(frame.localFrame) &&
    frame.localFrame >= 0 &&
    Number.isFinite(frame.progress) &&
    frame.progress >= 0 &&
    frame.progress <= 1 &&
    Number.isFinite(frame.localSeconds) &&
    frame.localSeconds >= 0 &&
    Number.isFinite(frame.durationSeconds) &&
    frame.durationSeconds >= 0 &&
    isUint32(frame.rootSeed) &&
    isUint32(frame.frameSeed) &&
    Number.isFinite(frame.frameRandom) &&
    frame.frameRandom >= 0 &&
    frame.frameRandom < 1 &&
    qualityIsValid &&
    typeof frame.qualityScale === "number" &&
    Number.isFinite(frame.qualityScale) &&
    qualityScale !== undefined &&
    frame.qualityScale === qualityScale &&
    isPlainRecord(inputs) &&
    VFX_SPACES.has(inputs.space) &&
    isTransform(inputs.transform) &&
    isTarget(inputs.target) &&
    VFX_BLEND_MODES.has(inputs.blendMode) &&
    VFX_RENDER_LAYERS.has(inputs.renderLayer);

  return valid
    ? []
    : [
        issue(
          "VFX_PRIMITIVE_FRAME_INVALID",
          "Active VFX frame data is malformed or inconsistent.",
          "frame"
        )
      ];
}

function cloneVector(value: Vector3Tuple): Vector3Tuple {
  return [
    normalizePrimitiveNumber(value[0]),
    normalizePrimitiveNumber(value[1]),
    normalizePrimitiveNumber(value[2])
  ];
}

function cloneTransform(value: TransformData): TransformData {
  return {
    position: cloneVector(value.position),
    rotation: cloneVector(value.rotation),
    scale: cloneVector(value.scale)
  };
}

function cloneTarget(value: VfxTarget | null): VfxTarget | null {
  if (!value) return null;
  return value.boneId === undefined
    ? { entityId: value.entityId }
    : { entityId: value.entityId, boneId: value.boneId };
}

function createSource(frame: VfxActiveFrameEvaluation): VfxPrimitiveSource {
  return {
    instanceId: frame.instanceId,
    definitionId: frame.definitionId,
    frame: normalizePrimitiveNumber(frame.frame),
    localFrame: normalizePrimitiveNumber(frame.localFrame),
    progress: normalizePrimitiveNumber(frame.progress),
    localSeconds: normalizePrimitiveNumber(frame.localSeconds),
    durationSeconds: normalizePrimitiveNumber(frame.durationSeconds),
    quality: frame.quality,
    qualityScale: normalizePrimitiveNumber(frame.qualityScale)
  };
}

function createPlacement(
  frame: VfxActiveFrameEvaluation
): VfxPrimitivePlacement {
  return {
    space: frame.inputs.space,
    transform: cloneTransform(frame.inputs.transform),
    target: cloneTarget(frame.inputs.target),
    blendMode: frame.inputs.blendMode,
    renderLayer: frame.inputs.renderLayer
  };
}

function createBudget(
  requested: number,
  hardCap: number,
  qualityScale: number,
  minimum: number
): VfxPrimitiveBudget {
  const capped = Math.min(requested, hardCap);
  return {
    requested,
    capped,
    evaluated: Math.max(minimum, Math.ceil(capped * qualityScale)),
    hardCap
  };
}

function createPrimitiveSeed(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxPrimitiveDescriptor
): number {
  return deriveSeed(
    "vfx-primitive-v1",
    frame.rootSeed,
    descriptor.kind,
    descriptor.id
  );
}

function createChannelSeed(primitiveSeed: number, channel: string): number {
  return deriveSeed("vfx-primitive-channel-v1", primitiveSeed, channel);
}

function commonEvaluation(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxPrimitiveDescriptor,
  primitiveSeed: number
) {
  return {
    version: VFX_PRIMITIVE_VERSION,
    id: descriptor.id,
    primitiveSeed,
    source: createSource(frame),
    placement: createPlacement(frame),
    color: descriptor.color
  };
}

function particleSpawnOffset(
  descriptor: VfxParticleEmitterDescriptor,
  primitiveSeed: number,
  sampleIndex: number
): Vector3Tuple {
  if (descriptor.shape === "point" || descriptor.radius === 0) {
    return [0, 0, 0];
  }
  if (descriptor.shape === "ring") {
    const angle =
      randomFloat01(
        createChannelSeed(primitiveSeed, "particle.spawn.ring-angle"),
        sampleIndex
      ) *
      Math.PI *
      2;
    return [
      normalizePrimitiveNumber(Math.cos(angle) * descriptor.radius),
      0,
      normalizePrimitiveNumber(Math.sin(angle) * descriptor.radius)
    ];
  }
  if (descriptor.shape === "box") {
    return (["x", "y", "z"] as const).map((axis) =>
      normalizePrimitiveNumber(
        (randomFloat01(
          createChannelSeed(primitiveSeed, `particle.spawn.box-${axis}`),
          sampleIndex
        ) *
          2 -
          1) *
          descriptor.radius
      )
    ) as Vector3Tuple;
  }

  const direction = randomUnitVector(
    createChannelSeed(primitiveSeed, "particle.spawn.sphere-azimuth"),
    createChannelSeed(primitiveSeed, "particle.spawn.sphere-height"),
    sampleIndex
  );
  const radius =
    Math.cbrt(
      randomFloat01(
        createChannelSeed(primitiveSeed, "particle.spawn.sphere-radius"),
        sampleIndex
      )
    ) * descriptor.radius;
  return direction.map((component) =>
    normalizePrimitiveNumber(component * radius)
  ) as Vector3Tuple;
}

function evaluateParticleEmitter(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxParticleEmitterDescriptor,
  primitiveSeed: number
): VfxParticleEmitterEvaluation | null {
  const budget = createBudget(
    descriptor.count,
    VFX_PRIMITIVE_LIMITS.particles,
    frame.qualityScale,
    1
  );
  const age = Math.min(1, frame.localSeconds / descriptor.lifetimeSeconds);
  if (!Number.isFinite(age)) return null;
  const common = commonEvaluation(frame, descriptor, primitiveSeed);
  if (frame.localSeconds > descriptor.lifetimeSeconds) {
    return {
      ...common,
      kind: descriptor.kind,
      budget: { ...budget, evaluated: 0 },
      age: 1,
      lifetimeSeconds: normalizePrimitiveNumber(descriptor.lifetimeSeconds),
      particles: []
    };
  }

  const elapsed = Math.min(frame.localSeconds, descriptor.lifetimeSeconds);
  const travel = descriptor.speed * elapsed;
  const size = lerpPrimitiveNumber(
    descriptor.startSize,
    descriptor.endSize,
    age
  );
  const opacity = lerpPrimitiveNumber(
    descriptor.startOpacity,
    descriptor.endOpacity,
    age
  );
  if (![travel, size, opacity].every(Number.isFinite)) return null;

  const velocityAzimuthSeed = createChannelSeed(
    primitiveSeed,
    "particle.direction.azimuth"
  );
  const velocityHeightSeed = createChannelSeed(
    primitiveSeed,
    "particle.direction.z"
  );
  const particles: VfxParticleSample[] = [];
  for (let sampleIndex = 0; sampleIndex < budget.evaluated; sampleIndex += 1) {
    const direction = randomUnitVector(
      velocityAzimuthSeed,
      velocityHeightSeed,
      sampleIndex
    );
    const spawn = particleSpawnOffset(descriptor, primitiveSeed, sampleIndex);
    const velocity = direction.map((component) =>
      normalizePrimitiveNumber(component * descriptor.speed)
    ) as Vector3Tuple;
    const position = spawn.map((component, axis) =>
      normalizePrimitiveNumber(component + direction[axis] * travel)
    ) as Vector3Tuple;
    if (!isFinitePrimitiveVector(velocity) || !isFinitePrimitiveVector(position)) {
      return null;
    }
    particles.push({ sampleIndex, position, velocity, size, opacity });
  }

  return {
    ...common,
    kind: descriptor.kind,
    budget,
    age: normalizePrimitiveNumber(age),
    lifetimeSeconds: normalizePrimitiveNumber(descriptor.lifetimeSeconds),
    particles
  };
}

function evaluateBeam(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxBeamDescriptor,
  primitiveSeed: number
): VfxBeamEvaluation | null {
  const budget = createBudget(
    descriptor.subdivisions,
    VFX_PRIMITIVE_LIMITS.beamSubdivisions,
    frame.qualityScale,
    1
  );
  const indices = selectNestedSampleIndices(budget.capped, budget.evaluated);
  const jitterSeeds = (["x", "y", "z"] as const).map((axis) =>
    createChannelSeed(primitiveSeed, `beam.jitter.${axis}`)
  ) as Vector3Tuple;
  const points = indices.map((sampleIndex) => {
    const progress = sampleIndex / budget.capped;
    const base = lerpPrimitiveVector(descriptor.start, descriptor.end, progress);
    const envelope =
      sampleIndex === 0 || sampleIndex === budget.capped
        ? 0
        : Math.sin(progress * Math.PI);
    const position = base.map((component, axis) =>
      normalizePrimitiveNumber(
        component +
          (randomFloat01(jitterSeeds[axis], sampleIndex) * 2 - 1) *
            descriptor.jitter *
            envelope
      )
    ) as Vector3Tuple;
    return { sampleIndex, position };
  });
  if (points.some((point) => !isFinitePrimitiveVector(point.position))) {
    return null;
  }
  return {
    ...commonEvaluation(frame, descriptor, primitiveSeed),
    kind: descriptor.kind,
    budget,
    width: normalizePrimitiveNumber(descriptor.width),
    opacity: normalizePrimitiveNumber(descriptor.opacity),
    points
  };
}

function evaluateTrail(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxTrailDescriptor,
  primitiveSeed: number
): VfxTrailEvaluation | null {
  const budget = createBudget(
    descriptor.segments,
    VFX_PRIMITIVE_LIMITS.trailSegments,
    frame.qualityScale,
    1
  );
  const indices = selectNestedSampleIndices(budget.capped, budget.evaluated);
  const points = indices.map((sampleIndex) => {
    const progress = sampleIndex / budget.capped;
    return {
      sampleIndex,
      position: samplePolyline(descriptor.points, progress),
      width: lerpPrimitiveNumber(
        descriptor.startWidth,
        descriptor.endWidth,
        progress
      ),
      opacity: lerpPrimitiveNumber(
        descriptor.startOpacity,
        descriptor.endOpacity,
        progress
      )
    };
  });
  if (
    points.some(
      (point) =>
        !isFinitePrimitiveVector(point.position) ||
        !Number.isFinite(point.width) ||
        !Number.isFinite(point.opacity)
    )
  ) {
    return null;
  }
  return {
    ...commonEvaluation(frame, descriptor, primitiveSeed),
    kind: descriptor.kind,
    budget,
    points
  };
}

function evaluateExpandingRing(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxExpandingRingDescriptor,
  primitiveSeed: number
): VfxExpandingRingEvaluation | null {
  const budget = createBudget(
    descriptor.segments,
    VFX_PRIMITIVE_LIMITS.ringSegments,
    frame.qualityScale,
    3
  );
  const radius = lerpPrimitiveNumber(
    descriptor.startRadius,
    descriptor.endRadius,
    frame.progress
  );
  const opacity = lerpPrimitiveNumber(
    descriptor.startOpacity,
    descriptor.endOpacity,
    frame.progress
  );
  const center = cloneVector(descriptor.center);
  const indices = selectNestedSampleIndices(budget.capped, budget.evaluated);
  const points = indices.map((sampleIndex) => {
    const angle =
      sampleIndex === budget.capped
        ? 0
        : (sampleIndex / budget.capped) * Math.PI * 2;
    const position: Vector3Tuple = [
      normalizePrimitiveNumber(center[0] + Math.cos(angle) * radius),
      center[1],
      normalizePrimitiveNumber(center[2] + Math.sin(angle) * radius)
    ];
    return { sampleIndex, position };
  });
  if (
    !Number.isFinite(radius) ||
    !Number.isFinite(opacity) ||
    points.some((point) => !isFinitePrimitiveVector(point.position))
  ) {
    return null;
  }
  return {
    ...commonEvaluation(frame, descriptor, primitiveSeed),
    kind: descriptor.kind,
    budget,
    center,
    radius,
    thickness: normalizePrimitiveNumber(descriptor.thickness),
    opacity,
    points
  };
}

function evaluateLightPulse(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxLightPulseDescriptor,
  primitiveSeed: number
): VfxLightPulseEvaluation | null {
  const pulse =
    frame.progress <= 0 || frame.progress >= 1
      ? 0
      : Math.sin(frame.progress * Math.PI);
  const radius = lerpPrimitiveNumber(
    descriptor.startRadius,
    descriptor.endRadius,
    frame.progress
  );
  const intensity = lerpPrimitiveNumber(
    descriptor.baseIntensity,
    descriptor.peakIntensity,
    pulse
  );
  if (!Number.isFinite(radius) || !Number.isFinite(intensity)) return null;
  return {
    ...commonEvaluation(frame, descriptor, primitiveSeed),
    kind: descriptor.kind,
    center: cloneVector(descriptor.center),
    radius,
    intensity
  };
}

function evaluateValidatedPrimitive(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxPrimitiveDescriptor
): VfxPrimitiveEvaluation | null {
  const primitiveSeed = createPrimitiveSeed(frame, descriptor);
  if (descriptor.kind === "particle-emitter") {
    return evaluateParticleEmitter(frame, descriptor, primitiveSeed);
  }
  if (descriptor.kind === "beam") {
    return evaluateBeam(frame, descriptor, primitiveSeed);
  }
  if (descriptor.kind === "trail") {
    return evaluateTrail(frame, descriptor, primitiveSeed);
  }
  if (descriptor.kind === "expanding-ring") {
    return evaluateExpandingRing(frame, descriptor, primitiveSeed);
  }
  return evaluateLightPulse(frame, descriptor, primitiveSeed);
}

export function evaluateVfxPrimitive(
  frame: VfxActiveFrameEvaluation,
  descriptor: VfxPrimitiveDescriptor
): VfxPrimitiveEvaluationResult {
  const frameErrors = validateActiveFrame(frame);
  const descriptorValidation = validateVfxPrimitiveDescriptor(descriptor);
  const warnings = sortVfxPrimitiveIssues(descriptorValidation.warnings);
  if (!descriptorValidation.ok || frameErrors.length > 0) {
    return invalidResult(
      sortVfxPrimitiveIssues([
        ...frameErrors,
        ...(descriptorValidation.ok ? [] : descriptorValidation.errors)
      ]),
      warnings
    );
  }

  const output = evaluateValidatedPrimitive(frame, descriptorValidation.value);
  if (!output) {
    return invalidResult(
      [
        issue(
          "VFX_PRIMITIVE_OUTPUT_NON_FINITE",
          "Primitive evaluation would produce non-finite output.",
          "output"
        )
      ],
      warnings
    );
  }
  return validResult(output, warnings);
}
