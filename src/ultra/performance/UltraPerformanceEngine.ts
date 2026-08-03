import type {
  AnimationGraphRecord,
  AnimationGraphTransition,
  AnimationLayerRecord,
  ContactConstraintRecord,
  CorrectiveRule,
  CurveToolPreset,
  FacialChannelId,
  FacialPose,
  FacialRigProfile,
  LocomotionPlan,
  MocapFrameObservation,
  MocapJointObservation,
  PerformancePreset,
  RetargetBoneMap,
  RetargetProfile,
  UltraEuler,
  UltraVector3
} from "../UltraTypes";

export interface ScalarKey {
  frame: number;
  value: number;
}

export interface VectorKey {
  frame: number;
  value: UltraVector3;
}

export interface FacialSampleInput {
  viseme?: string;
  emotion?: string;
  microExpression?: string;
  visemeWeight?: number;
  emotionWeight?: number;
  microWeight?: number;
}

export interface CorrectiveSample {
  ruleId: string;
  influence: number;
  scaleOffset: UltraVector3;
  positionOffset: UltraVector3;
  jointFill: number;
}

export interface ContactSolveResult {
  reachable: boolean;
  residual: number;
  solvedPoint: UltraVector3;
  direction: UltraVector3;
}

export interface RetargetSampleResult {
  targetBoneId: string;
  rotationDegrees: UltraEuler;
  confidence: number;
}

export interface LocomotionSample {
  frame: number;
  position: UltraVector3;
  yawDegrees: number;
  speed: number;
  mode: LocomotionPlan["waypoints"][number]["mode"];
}

export interface AnimationGraphRuntime {
  stateId: string;
  enteredAtFrame: number;
  transitionId: string | null;
  transitionProgress: number;
}

const FACIAL_CHANNELS: readonly FacialChannelId[] = [
  "jawOpen", "mouthWide", "mouthNarrow", "mouthSmile", "mouthFrown",
  "lipUpper", "lipLower", "browLeft", "browRight", "lidLeft", "lidRight",
  "cheekLeft", "cheekRight", "lookVertical"
];

export function sampleFacialRig(profile: FacialRigProfile, input: FacialSampleInput): Record<FacialChannelId, number> {
  const result = Object.fromEntries(FACIAL_CHANNELS.map((channel) => [channel, 0])) as Record<FacialChannelId, number>;
  blendPose(result, profile.visemes[input.viseme ?? "rest"], clamp01(input.visemeWeight ?? 1));
  blendPose(result, profile.emotions[input.emotion ?? "neutral"], clamp01(input.emotionWeight ?? 1));
  blendPose(result, profile.microExpressions[input.microExpression ?? ""], clamp01(input.microWeight ?? 1));
  for (const channel of FACIAL_CHANNELS) {
    const [minimum, maximum] = profile.channelLimits[channel] ?? [-1, 1];
    result[channel] = clamp(finite(result[channel]), minimum, maximum);
  }
  return result;
}

export function evaluateCorrectiveRules(
  rules: readonly CorrectiveRule[],
  boneRotationsDegrees: Readonly<Record<string, UltraEuler>>
): CorrectiveSample[] {
  return rules.flatMap((rule) => {
    if (!rule.enabled) return [];
    const rotation = boneRotationsDegrees[rule.boneId];
    if (!rotation) return [];
    const value = finite(rotation[rule.axis]);
    const [start, end] = rule.inputRangeDegrees;
    const influence = smoothstep(start, end, value);
    if (influence <= 0) return [];
    return [{
      ruleId: rule.id,
      influence,
      scaleOffset: scaleVector(rule.scaleOffset, influence),
      positionOffset: scaleVector(rule.positionOffset, influence),
      jointFill: clamp01(rule.jointFill) * influence
    }];
  });
}

export function solveContactConstraint(
  constraint: ContactConstraintRecord,
  effectorWorld: UltraVector3,
  anchorWorld: UltraVector3
): ContactSolveResult {
  const target = add(anchorWorld, constraint.targetPoint);
  const offset = subtract(target, effectorWorld);
  const targetDistance = length(offset);
  const reach = Math.max(0.001, finite(constraint.maximumReach, 0.001));
  const reachable = targetDistance <= reach + 1e-6;
  const direction = targetDistance <= 1e-8 ? [0, 0, 0] as UltraVector3 : scaleVector(offset, 1 / targetDistance);
  const solvedPoint = reachable ? target : add(effectorWorld, scaleVector(direction, reach));
  return {
    reachable,
    residual: distance(solvedPoint, target),
    solvedPoint: canonicalVector(solvedPoint),
    direction: canonicalVector(direction)
  };
}

export function sampleAnimationLayerWeight(layer: AnimationLayerRecord, localFrame: number, durationFrames: number): number {
  if (!layer.enabled || layer.weight <= 0 || durationFrames <= 0) return 0;
  const frame = clamp(localFrame, 0, durationFrames);
  const fadeIn = layer.fadeInFrames <= 0 ? 1 : clamp01(frame / layer.fadeInFrames);
  const remaining = durationFrames - frame;
  const fadeOut = layer.fadeOutFrames <= 0 ? 1 : clamp01(remaining / layer.fadeOutFrames);
  return clamp01(layer.weight) * Math.min(fadeIn, fadeOut);
}

export function retargetEuler(rotation: UltraEuler, mapping: RetargetBoneMap): UltraEuler {
  const values = [finite(rotation[0]), finite(rotation[1]), finite(rotation[2])] as const;
  const result: [number, number, number] = [0, 0, 0];
  for (let targetAxis = 0 as 0 | 1 | 2; targetAxis < 3; targetAxis = (targetAxis + 1) as 0 | 1 | 2) {
    const sourceAxis = mapping.axisMap[targetAxis];
    result[targetAxis] = values[sourceAxis] * mapping.axisSigns[targetAxis] + mapping.rotationOffsetDegrees[targetAxis];
  }
  return canonicalVector(result) as UltraEuler;
}

export function retargetPose(
  profile: RetargetProfile,
  sourceRotations: Readonly<Record<string, UltraEuler>>
): RetargetSampleResult[] {
  const usedTargets = new Set<string>();
  const result: RetargetSampleResult[] = [];
  for (const mapping of profile.mappings) {
    const source = sourceRotations[mapping.sourceBoneId];
    if (!source || !mapping.targetBoneId || usedTargets.has(mapping.targetBoneId)) continue;
    usedTargets.add(mapping.targetBoneId);
    result.push({
      targetBoneId: mapping.targetBoneId,
      rotationDegrees: retargetEuler(source, mapping),
      confidence: clamp01(mapping.confidence)
    });
  }
  return result;
}

export function generateLocomotionSamples(plan: LocomotionPlan): LocomotionSample[] {
  if (!plan.enabled || plan.waypoints.length === 0) return [];
  const fps = clamp(Math.round(plan.fps), 1, 240);
  const acceleration = Math.max(0.01, finite(plan.acceleration, 5));
  const samples: LocomotionSample[] = [];
  let frame = Math.max(0, Math.round(plan.startFrame));
  let previousSpeed = 0;
  const first = plan.waypoints[0];
  samples.push({ frame, position: canonicalVector(first.position), yawDegrees: 0, speed: 0, mode: first.mode });

  for (let index = 1; index < plan.waypoints.length; index += 1) {
    const previous = plan.waypoints[index - 1];
    const current = plan.waypoints[index];
    const segment = subtract(current.position, previous.position);
    const horizontalDistance = Math.hypot(segment[0], segment[2]);
    const directDistance = length(segment);
    const targetSpeed = locomotionSpeed(current.mode);
    const averageSpeed = Math.max(0.2, (Math.max(previousSpeed, 0.2) + Math.max(targetSpeed, 0.2)) / 2);
    const seconds = current.mode === "pause" ? 0 : directDistance / averageSpeed;
    const travelFrames = Math.max(current.mode === "pause" ? 0 : 1, Math.round(seconds * fps));
    const yaw = horizontalDistance <= 1e-8 ? (samples.at(-1)?.yawDegrees ?? 0) : radiansToDegrees(Math.atan2(segment[0], segment[2]));

    for (let step = 1; step <= travelFrames; step += 1) {
      const t = step / travelFrames;
      const eased = smoothstep(0, 1, t);
      const speedLimit = previousSpeed + acceleration * (step / fps);
      const speed = Math.min(targetSpeed, speedLimit);
      const position = interpolateLocomotionPosition(previous.position, current.position, current.mode, eased);
      samples.push({
        frame: frame + step,
        position: canonicalVector(position),
        yawDegrees: canonicalNumber(lerpAngleDegrees(samples.at(-1)?.yawDegrees ?? yaw, yaw, clamp01(plan.turnSmoothing))),
        speed: canonicalNumber(speed),
        mode: current.mode
      });
    }
    frame += travelFrames;
    previousSpeed = targetSpeed;
    for (let hold = 0; hold < Math.max(0, Math.round(current.holdFrames)); hold += 1) {
      frame += 1;
      samples.push({ frame, position: canonicalVector(current.position), yawDegrees: yaw, speed: 0, mode: "pause" });
    }
  }
  return samples;
}

export function searchPerformancePresets(
  presets: readonly PerformancePreset[],
  query: string,
  emotion?: PerformancePreset["emotion"]
): PerformancePreset[] {
  const normalized = query.trim().toLocaleLowerCase();
  return presets
    .filter((preset) => preset.enabled)
    .filter((preset) => !emotion || preset.emotion === emotion)
    .filter((preset) => !normalized || [preset.name, preset.notes, ...preset.tags, preset.emotion]
      .some((value) => value.toLocaleLowerCase().includes(normalized)))
    .sort((a, b) => b.intensity - a.intensity || a.name.localeCompare(b.name));
}

export function normalizeMocapFrame(
  frame: MocapFrameObservation,
  corrections: readonly MocapFrameObservation[] = []
): MocapFrameObservation {
  const correction = corrections.find((candidate) => candidate.frame === frame.frame);
  const correctedByJoint = new Map(correction?.joints.map((joint) => [joint.jointId, sanitizeJoint(joint)]) ?? []);
  const joints = new Map<string, MocapJointObservation>();
  for (const joint of frame.joints) joints.set(joint.jointId, sanitizeJoint(joint));
  for (const [jointId, joint] of correctedByJoint) joints.set(jointId, joint);
  return {
    frame: Math.max(0, Math.round(finite(frame.frame))),
    joints: [...joints.values()].sort((a, b) => a.jointId.localeCompare(b.jointId))
  };
}

export function applyCurveTool(keys: readonly ScalarKey[], preset: CurveToolPreset): ScalarKey[] {
  const sorted = [...keys]
    .filter((key) => Number.isFinite(key.frame) && Number.isFinite(key.value))
    .sort((a, b) => a.frame - b.frame)
    .map((key) => ({ frame: Math.round(key.frame), value: finite(key.value) }));
  if (sorted.length <= 2 || !preset.enabled) return sorted;
  switch (preset.mode) {
    case "smooth":
    case "remove-jitter":
      return smoothScalarKeys(sorted, clamp01(preset.strength), preset.preserveEndpoints);
    case "simplify":
      return simplifyScalarKeys(sorted, Math.max(0, preset.tolerance), preset.preserveEndpoints);
    case "clamp": {
      const values = sorted.map((key) => key.value);
      const center = median(values);
      const radius = Math.max(0.0001, preset.tolerance || standardDeviation(values) * 2);
      return sorted.map((key) => ({ ...key, value: canonicalNumber(clamp(key.value, center - radius, center + radius)) }));
    }
  }
}

export function evaluateAnimationGraph(
  graph: AnimationGraphRecord,
  runtime: AnimationGraphRuntime | null,
  parameters: Readonly<Record<string, number>>,
  frame: number
): AnimationGraphRuntime {
  const currentStateId = runtime && graph.states.some((state) => state.id === runtime.stateId)
    ? runtime.stateId
    : graph.initialStateId;
  const candidates = graph.transitions
    .filter((transition) => transition.fromStateId === currentStateId)
    .filter((transition) => evaluateTransition(transition, parameters[transition.parameter] ?? 0))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const chosen = candidates[0];
  if (!chosen) {
    return {
      stateId: currentStateId,
      enteredAtFrame: runtime?.enteredAtFrame ?? frame,
      transitionId: null,
      transitionProgress: 1
    };
  }
  if (runtime?.transitionId === chosen.id) {
    const elapsed = Math.max(0, frame - runtime.enteredAtFrame);
    const duration = Math.max(1, chosen.durationFrames);
    if (elapsed >= duration) {
      return { stateId: chosen.toStateId, enteredAtFrame: frame, transitionId: null, transitionProgress: 1 };
    }
    return { ...runtime, transitionProgress: clamp01(elapsed / duration) };
  }
  if (chosen.durationFrames <= 0) {
    return { stateId: chosen.toStateId, enteredAtFrame: frame, transitionId: null, transitionProgress: 1 };
  }
  return { stateId: currentStateId, enteredAtFrame: frame, transitionId: chosen.id, transitionProgress: 0 };
}

export function detectCurveDiscontinuities(keys: readonly ScalarKey[], threshold: number): Array<{ frame: number; delta: number }> {
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  const limit = Math.max(0, threshold);
  return sorted.slice(1).flatMap((key, index) => {
    const delta = Math.abs(key.value - sorted[index].value);
    return delta > limit ? [{ frame: key.frame, delta }] : [];
  });
}

function blendPose(target: Record<FacialChannelId, number>, pose: FacialPose | undefined, weight: number): void {
  if (!pose || weight <= 0) return;
  for (const [channel, value] of Object.entries(pose.channels) as Array<[FacialChannelId, number]>) {
    if (!(channel in target)) continue;
    target[channel] += finite(value) * weight;
  }
}

function interpolateLocomotionPosition(a: UltraVector3, b: UltraVector3, mode: LocomotionPlan["waypoints"][number]["mode"], t: number): UltraVector3 {
  const base = lerpVector(a, b, t);
  if (mode !== "jump" && mode !== "fall") return base;
  const height = mode === "jump" ? Math.max(0.5, distance(a, b) * 0.18) : Math.max(0.25, Math.abs(a[1] - b[1]) * 0.2);
  const arc = mode === "jump" ? Math.sin(Math.PI * t) * height : Math.sin(Math.PI * t) * height * 0.25;
  return [base[0], base[1] + arc, base[2]];
}

function locomotionSpeed(mode: LocomotionPlan["waypoints"][number]["mode"]): number {
  switch (mode) {
    case "walk": return 2.4;
    case "run": return 4.8;
    case "sprint": return 7.2;
    case "jump": return 4.5;
    case "fall": return 4;
    case "pause": return 0;
  }
}

function smoothScalarKeys(keys: readonly ScalarKey[], strength: number, preserveEndpoints: boolean): ScalarKey[] {
  const result = keys.map((key) => ({ ...key }));
  for (let index = 1; index < keys.length - 1; index += 1) {
    const average = (keys[index - 1].value + keys[index].value + keys[index + 1].value) / 3;
    result[index].value = canonicalNumber(keys[index].value + (average - keys[index].value) * strength);
  }
  if (!preserveEndpoints) {
    result[0].value = canonicalNumber(lerp(keys[0].value, keys[1].value, strength * 0.5));
    result[result.length - 1].value = canonicalNumber(lerp(keys.at(-1)!.value, keys.at(-2)!.value, strength * 0.5));
  }
  return result;
}

function simplifyScalarKeys(keys: readonly ScalarKey[], tolerance: number, preserveEndpoints: boolean): ScalarKey[] {
  if (keys.length <= 2) return [...keys];
  const kept: ScalarKey[] = [keys[0]];
  for (let index = 1; index < keys.length - 1; index += 1) {
    const previous = kept.at(-1)!;
    const next = keys[index + 1];
    const frameSpan = Math.max(1, next.frame - previous.frame);
    const expected = lerp(previous.value, next.value, (keys[index].frame - previous.frame) / frameSpan);
    if (Math.abs(keys[index].value - expected) > tolerance) kept.push(keys[index]);
  }
  kept.push(keys.at(-1)!);
  return preserveEndpoints ? kept : kept.slice(0, Math.max(2, kept.length));
}

function evaluateTransition(transition: AnimationGraphTransition, value: number): boolean {
  switch (transition.operator) {
    case ">": return value > transition.threshold;
    case ">=": return value >= transition.threshold;
    case "<": return value < transition.threshold;
    case "<=": return value <= transition.threshold;
    case "==": return value === transition.threshold;
    case "!=": return value !== transition.threshold;
  }
}

function sanitizeJoint(joint: MocapJointObservation): MocapJointObservation {
  return {
    jointId: String(joint.jointId).slice(0, 80),
    position: canonicalVector(joint.position),
    confidence: clamp01(joint.confidence)
  };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function lerpAngleDegrees(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return a + delta * t;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpVector(a: UltraVector3, b: UltraVector3, t: number): UltraVector3 { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function add(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function subtract(a: UltraVector3, b: UltraVector3): UltraVector3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function scaleVector(value: UltraVector3, scalar: number): UltraVector3 { return [value[0] * scalar, value[1] * scalar, value[2] * scalar]; }
function length(value: UltraVector3): number { return Math.hypot(value[0], value[1], value[2]); }
function distance(a: UltraVector3, b: UltraVector3): number { return length(subtract(a, b)); }
function radiansToDegrees(value: number): number { return value * 180 / Math.PI; }
function clamp01(value: number): number { return clamp(finite(value), 0, 1); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function finite(value: number, fallback = 0): number { return Number.isFinite(value) ? value : fallback; }
function canonicalNumber(value: number): number { const finiteValue = finite(value); return Object.is(finiteValue, -0) ? 0 : Number(finiteValue.toFixed(8)); }
function canonicalVector(value: readonly [number, number, number]): UltraVector3 { return [canonicalNumber(value[0]), canonicalNumber(value[1]), canonicalNumber(value[2])]; }
