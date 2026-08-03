import type { UltraPhaseNumber } from "./UltraPhaseRegistry";
import type {
  ActingBeat,
  AnimationGraphRecord,
  AnimationLayerRecord,
  ArtisticLightRecord,
  BattleScenario,
  BlockingSnapshot,
  CameraRigRecord,
  CinematicMaterialProfile,
  CinematicSequence,
  ColorManagementProfile,
  CombatSequence,
  CombustionSource,
  CompositionCheck,
  CompositingGraphRecord,
  ContactConstraintRecord,
  ContinuityAxis,
  CorrectiveRule,
  CurveToolPreset,
  CustomMobDefinition,
  DebrisProfile,
  DestructionEvent,
  DirectorAnnotation,
  EntityCatalogEntry,
  EquipmentSet,
  FacialRigProfile,
  FluidVolume,
  FocusCue,
  LocomotionPlan,
  MinecraftEffectPreset,
  MobLocomotionProfile,
  MocapSession,
  NarrativeCrowdGroup,
  ParkourPath,
  PerformancePreset,
  PhysicalCameraProfile,
  RedstoneGraph,
  RetargetProfile,
  RigidBodyRecord,
  SecondaryMotionProfile,
  SetLayer,
  SkyCloudProfile,
  StoryboardLink,
  TakeVariantGroup,
  UltraBaseRecord,
  UltraValidationIssue,
  VehicleRecord,
  VfxNodeGraphRecord,
  VolumetricProfile,
  WeatherSeasonPreset,
  AttentionCue
} from "./UltraTypes";
import {
  applyCurveTool,
  evaluateAnimationGraph,
  evaluateCorrectiveRules,
  generateLocomotionSamples,
  normalizeMocapFrame,
  retargetPose,
  sampleAnimationLayerWeight,
  sampleFacialRig,
  solveContactConstraint
} from "./performance/UltraPerformanceEngine";
import {
  assembleCinematicSequence,
  calculatePhysicalCamera,
  checkContinuity,
  chooseActiveTake,
  createBlockingSnapshot,
  evaluateComposition,
  filterOpenAnnotations,
  linkStoryboardToShot,
  sampleCameraRig,
  sampleFocusCue
} from "./directing/UltraDirectingEngine";
import {
  assignNarrativeCrowd,
  resolveAttention,
  resolveEntityCatalog,
  resolveEquipment,
  sampleMobLocomotion,
  stepSecondaryMotion,
  synchronizeActingBeat,
  validateCombatSequence,
  validateCustomMob,
  validateParkourPath
} from "./entities/UltraEntityEngine";
import {
  applySetLayers,
  evaluateRedstoneGraph,
  generateDebris,
  sampleCombustion,
  sampleStylizedFluid,
  sampleVehicle,
  sampleWeather,
  scheduleBattle,
  scheduleDestruction,
  stepRigidBody
} from "./world/UltraWorldEngine";
import {
  calculateColorScopes,
  compareVolumetricQualities,
  evaluateLightContribution,
  evaluateMaterialProfile,
  evaluateMinecraftEffect,
  evaluateVfxGraph,
  sampleSkyProfile,
  sampleVolumetricProfile,
  transformColor,
  validateCompositingGraph,
  validateVfxGraph
} from "./rendering/UltraRenderingEngine";

export function validateUltraPhaseRecords(phase: UltraPhaseNumber, records: readonly UltraBaseRecord[]): UltraValidationIssue[] {
  const issues: UltraValidationIssue[] = [];
  for (const record of records) {
    try {
      const messages = validateRecord(phase, record);
      for (const message of messages) {
        issues.push({ phase, severity: "error", code: `PHASE_${phase}_INVALID`, message, recordId: record.id });
      }
    } catch (error) {
      issues.push({
        phase,
        severity: "error",
        code: `PHASE_${phase}_VALIDATION_EXCEPTION`,
        message: error instanceof Error ? error.message : `Phase ${phase} record could not be validated.`,
        recordId: record.id
      });
    }
  }
  return issues;
}

function validateRecord(phase: UltraPhaseNumber, base: UltraBaseRecord): string[] {
  switch (phase) {
    case 36: return validateFacial(base as FacialRigProfile);
    case 37: return validateCorrective(base as CorrectiveRule);
    case 38: return validateContact(base as ContactConstraintRecord);
    case 39: return validateLayer(base as AnimationLayerRecord);
    case 40: return validateRetarget(base as RetargetProfile);
    case 41: return validateLocomotion(base as LocomotionPlan);
    case 42: return validatePerformance(base as PerformancePreset);
    case 43: return validateMocap(base as MocapSession);
    case 44: return validateCurve(base as CurveToolPreset);
    case 45: return validateAnimationGraphRecord(base as AnimationGraphRecord);
    case 46: return validateCamera(base as PhysicalCameraProfile);
    case 47: return validateCameraRig(base as CameraRigRecord);
    case 48: return validateCompositionRecord(base as CompositionCheck);
    case 49: return validateContinuity(base as ContinuityAxis);
    case 50: return validateFocus(base as FocusCue);
    case 51: return validateBlocking(base as BlockingSnapshot);
    case 52: return validateStoryboard(base as StoryboardLink);
    case 53: return validateTakeGroup(base as TakeVariantGroup);
    case 54: return validateAnnotation(base as DirectorAnnotation);
    case 55: return validateSequence(base as CinematicSequence);
    case 56: return validateCatalog(base as EntityCatalogEntry);
    case 57: return validateMob(base as CustomMobDefinition);
    case 58: return validateEquipment(base as EquipmentSet);
    case 59: return validateSecondaryMotion(base as SecondaryMotionProfile);
    case 60: return validateAttention(base as AttentionCue);
    case 61: return validateMobLocomotion(base as MobLocomotionProfile);
    case 62: return validateCombat(base as CombatSequence);
    case 63: return validateParkour(base as ParkourPath);
    case 64: return validateActing(base as ActingBeat);
    case 65: return validateCrowd(base as NarrativeCrowdGroup);
    case 66: return validateSetLayer(base as SetLayer);
    case 67: return validateDestruction(base as DestructionEvent);
    case 68: return validateDebris(base as DebrisProfile);
    case 69: return validateRigidBody(base as RigidBodyRecord);
    case 70: return validateFluid(base as FluidVolume);
    case 71: return validateCombustion(base as CombustionSource);
    case 72: return validateRedstone(base as RedstoneGraph);
    case 73: return validateVehicle(base as VehicleRecord);
    case 74: return validateWeather(base as WeatherSeasonPreset);
    case 75: return validateBattle(base as BattleScenario);
    case 76: return validateMaterial(base as CinematicMaterialProfile);
    case 77: return validateLight(base as ArtisticLightRecord);
    case 78: return validateVolume(base as VolumetricProfile);
    case 79: return validateSky(base as SkyCloudProfile);
    case 80: return validateVfx(base as VfxNodeGraphRecord);
    case 81: return validateMinecraftEffectRecord(base as MinecraftEffectPreset);
    case 82: return validateComposite(base as CompositingGraphRecord);
    case 83: return validateColor(base as ColorManagementProfile);
    default: return [`Phase ${phase} is not a legacy Ultra domain record.`];
  }
}

function validateFacial(record: FacialRigProfile): string[] {
  const errors: string[] = [];
  if (!record.visemes || Object.keys(record.visemes).length === 0) errors.push("Facial profile must define at least one viseme.");
  if (!record.emotions || Object.keys(record.emotions).length === 0) errors.push("Facial profile must define at least one emotion.");
  const sample = sampleFacialRig(record, { viseme: Object.keys(record.visemes ?? {})[0] ?? "", emotion: Object.keys(record.emotions ?? {})[0] ?? "", visemeWeight: 1, emotionWeight: 1 });
  if (!Object.values(sample).every(Number.isFinite)) errors.push("Facial sampling produced a non-finite channel.");
  return errors;
}

function validateCorrective(record: CorrectiveRule): string[] {
  const errors: string[] = [];
  if (!record.boneId) errors.push("Corrective rule requires a bone.");
  if (!isRange(record.inputRangeDegrees)) errors.push("Corrective input range must be ordered and finite.");
  const midpoint = isRange(record.inputRangeDegrees) ? (record.inputRangeDegrees[0] + record.inputRangeDegrees[1]) / 2 : 0;
  const result = evaluateCorrectiveRules([record], { [record.boneId]: record.axis === 0 ? [midpoint, 0, 0] : record.axis === 1 ? [0, midpoint, 0] : [0, 0, midpoint] });
  if (!result.every((entry) => entry.positionOffset.every(Number.isFinite) && entry.scaleOffset.every(Number.isFinite))) errors.push("Corrective evaluation produced invalid offsets.");
  return errors;
}

function validateContact(record: ContactConstraintRecord): string[] {
  const errors: string[] = [];
  if (!record.targetId || !record.effectorBoneId) errors.push("Contact constraint requires target and effector identifiers.");
  if (!isFrameRange(record.startFrame, record.endFrame)) errors.push("Contact frame range is invalid.");
  if (!(finitePositive(record.maximumReach))) errors.push("Contact maximum reach must be positive.");
  const sample = solveContactConstraint(record, [0, 0, 0], record.targetPoint);
  if (!Number.isFinite(sample.residual) || !sample.solvedPoint.every(Number.isFinite)) errors.push("Contact solve produced invalid values.");
  return errors;
}

function validateLayer(record: AnimationLayerRecord): string[] {
  const errors: string[] = [];
  if (!record.targetId || !record.sourceClipId) errors.push("Animation layer requires target and clip identifiers.");
  if (!inRange(record.weight, 0, 1)) errors.push("Animation layer weight must be between 0 and 1.");
  if (!finiteNonNegative(record.fadeInFrames) || !finiteNonNegative(record.fadeOutFrames)) errors.push("Layer fades must be non-negative.");
  if (!Number.isFinite(sampleAnimationLayerWeight(record, 0, 24))) errors.push("Animation layer sampling failed.");
  return errors;
}

function validateRetarget(record: RetargetProfile): string[] {
  const errors: string[] = [];
  if (!record.sourceRigId || !record.targetRigId) errors.push("Retarget profile requires source and target rigs.");
  if (!finitePositive(record.sourceHeight) || !finitePositive(record.targetHeight) || !finitePositive(record.rootMotionScale)) errors.push("Retarget proportions must be positive.");
  const targetIds = new Set<string>();
  for (const mapping of record.mappings ?? []) {
    if (!mapping.sourceBoneId || !mapping.targetBoneId) errors.push("Retarget mapping requires source and target bones.");
    if (!inRange(mapping.confidence, 0, 1)) errors.push("Retarget confidence must be between 0 and 1.");
    if (targetIds.has(mapping.targetBoneId)) errors.push(`Retarget target bone ${mapping.targetBoneId} is mapped more than once.`);
    targetIds.add(mapping.targetBoneId);
  }
  const sample = retargetPose(record, Object.fromEntries((record.mappings ?? []).map((mapping) => [mapping.sourceBoneId, [0, 0, 0]])));
  if (!sample.every((entry) => entry.rotationDegrees.every(Number.isFinite))) errors.push("Retarget sampling produced invalid rotations.");
  return errors;
}

function validateLocomotion(record: LocomotionPlan): string[] {
  const errors: string[] = [];
  if (!record.targetId || !finitePositive(record.fps)) errors.push("Locomotion plan requires a target and positive FPS.");
  if ((record.waypoints ?? []).length < 2) errors.push("Locomotion plan requires at least two waypoints.");
  if (!finiteNonNegative(record.stepHeight) || !finiteNonNegative(record.acceleration)) errors.push("Locomotion limits must be non-negative.");
  const samples = generateLocomotionSamples(record);
  if (samples.length === 0 || !samples.every((sample) => sample.position.every(Number.isFinite))) errors.push("Locomotion generation produced no valid samples.");
  return errors;
}

function validatePerformance(record: PerformancePreset): string[] {
  const errors: string[] = [];
  if (!record.clipId) errors.push("Performance preset requires a standard clip.");
  if (!inRange(record.intensity, 0, 1) || !finitePositive(record.durationFrames)) errors.push("Performance intensity or duration is invalid.");
  return errors;
}

function validateMocap(record: MocapSession): string[] {
  const errors: string[] = [];
  if (!record.sourceName || !record.sourceFingerprint || !record.targetRigId) errors.push("Mocap session is missing source provenance or target rig.");
  if (!finitePositive(record.sourceDurationSeconds) || !finitePositive(record.sourceFps)) errors.push("Mocap duration and FPS must be positive.");
  for (const frame of [...(record.observations ?? []), ...(record.manualCorrections ?? [])]) {
    if (!finiteNonNegative(frame.frame)) errors.push("Mocap frame index is invalid.");
    for (const joint of frame.joints ?? []) if (!joint.position.every(Number.isFinite) || !inRange(joint.confidence, 0, 1)) errors.push("Mocap joint observation is invalid.");
  }
  const first = record.observations?.[0];
  if (first && !normalizeMocapFrame(first, record.manualCorrections ?? []).joints.every((joint) => joint.position.every(Number.isFinite))) errors.push("Mocap normalization failed.");
  return errors;
}

function validateCurve(record: CurveToolPreset): string[] {
  const errors: string[] = [];
  if (!inRange(record.strength, 0, 1) || !finiteNonNegative(record.tolerance)) errors.push("Curve tool strength or tolerance is invalid.");
  const result = applyCurveTool([{ frame: 0, value: 0 }, { frame: 1, value: 1 }], record);
  if (result.length !== 2 || !result.every((key) => Number.isFinite(key.value))) errors.push("Curve tool produced invalid keys.");
  return errors;
}

function validateAnimationGraphRecord(record: AnimationGraphRecord): string[] {
  const errors: string[] = [];
  const states = new Set((record.states ?? []).map((state) => state.id));
  if (!record.targetId || states.size === 0 || !states.has(record.initialStateId)) errors.push("Animation graph target or initial state is invalid.");
  for (const transition of record.transitions ?? []) {
    if (!states.has(transition.fromStateId) || !states.has(transition.toStateId)) errors.push(`Animation transition ${transition.id} references a missing state.`);
    if (!finiteNonNegative(transition.durationFrames)) errors.push(`Animation transition ${transition.id} has an invalid duration.`);
  }
  if (states.has(record.initialStateId)) {
    const result = evaluateAnimationGraph(record, null, {}, 0);
    if (!result.stateId) errors.push("Animation graph did not produce a state.");
  }
  return errors;
}

function validateCamera(record: PhysicalCameraProfile): string[] {
  const errors: string[] = [];
  if (![record.sensorWidthMm, record.sensorHeightMm, record.focalLengthMm, record.apertureFStop, record.iso, record.focusDistance].every(finitePositive)) errors.push("Physical camera values must be positive.");
  const result = calculatePhysicalCamera(record);
  if (![result.horizontalFovDegrees, result.verticalFovDegrees, result.shutterSeconds].every(Number.isFinite)) errors.push("Physical camera calculation failed.");
  return errors;
}

function validateCameraRig(record: CameraRigRecord): string[] {
  const errors: string[] = [];
  if (!record.cameraId || (record.path ?? []).length < 2) errors.push("Camera rig requires a camera and at least two path points.");
  const sample = sampleCameraRig(record, 0.5);
  if (!sample.position.every(Number.isFinite) || !sample.target.every(Number.isFinite) || !Number.isFinite(sample.rollDegrees)) errors.push("Camera rig sampling failed.");
  return errors;
}

function validateCompositionRecord(record: CompositionCheck): string[] {
  const errors: string[] = [];
  if (!record.shotId || (record.subjectIds ?? []).length === 0) errors.push("Composition check requires a shot and subjects.");
  if (!inRange(record.tolerance, 0, 1)) errors.push("Composition tolerance must be between 0 and 1.");
  const findings = evaluateComposition(record, (record.subjectIds ?? []).map((id) => ({ id, screenPosition: [0.5, 0.5], screenBounds: [0.4, 0.4, 0.6, 0.6] })));
  if (!Array.isArray(findings)) errors.push("Composition evaluation failed.");
  return errors;
}

function validateContinuity(record: ContinuityAxis): string[] {
  const errors: string[] = [];
  if (!record.sceneId || (record.shotIds ?? []).length === 0) errors.push("Continuity axis requires a scene and shots.");
  if (vectorLength(record.direction) < 1e-6) errors.push("Continuity direction must be non-zero.");
  const findings = checkContinuity(record, []);
  if (!Array.isArray(findings)) errors.push("Continuity evaluation failed.");
  return errors;
}

function validateFocus(record: FocusCue): string[] {
  const errors: string[] = [];
  if (!record.shotId || !isFrameRange(record.startFrame, record.endFrame)) errors.push("Focus cue shot or frame range is invalid.");
  if (!finitePositive(record.sourceDistance) || !finitePositive(record.targetDistance)) errors.push("Focus distances must be positive.");
  if (!Number.isFinite(sampleFocusCue(record, record.startFrame).distance)) errors.push("Focus sampling failed.");
  return errors;
}

function validateBlocking(record: BlockingSnapshot): string[] {
  const errors: string[] = [];
  if (!record.sceneId || !finiteNonNegative(record.frame)) errors.push("Blocking snapshot requires scene and frame.");
  for (const [id, transform] of Object.entries(record.entityTransforms ?? {})) {
    if (!id || !transform.position.every(Number.isFinite) || !transform.rotation.every(Number.isFinite) || !transform.scale.every(Number.isFinite)) errors.push("Blocking snapshot contains an invalid transform.");
  }
  const copy = createBlockingSnapshot(record.name, record.sceneId, record.frame, record.entityTransforms ?? {}, record.updatedAt);
  if (!copy.sceneId) errors.push("Blocking snapshot normalization failed.");
  return errors;
}

function validateStoryboard(record: StoryboardLink): string[] {
  const errors: string[] = [];
  if (!record.storyboardCardId || !record.shotId || !finitePositive(record.durationFrames)) errors.push("Storyboard link is incomplete.");
  const result = linkStoryboardToShot(record, new Set([record.shotId]), new Set([record.storyboardCardId]));
  if (!result.valid) errors.push("Cinematic sequence contains invalid overlap or timing.");
  return errors;
}

function validateTakeGroup(record: TakeVariantGroup): string[] {
  const errors: string[] = [];
  if (!record.shotId || (record.takeIds ?? []).length === 0) errors.push("Take group requires a shot and at least one take.");
  if (new Set(record.takeIds ?? []).size !== (record.takeIds ?? []).length) errors.push("Take identifiers must be unique.");
  if (record.activeTakeId && !(record.takeIds ?? []).includes(record.activeTakeId)) errors.push("Active take must belong to the group.");
  if (chooseActiveTake(record) === null) errors.push("Take group has no selectable take.");
  return errors;
}

function validateAnnotation(record: DirectorAnnotation): string[] {
  const errors: string[] = [];
  if (!record.shotId || !finiteNonNegative(record.revision) || !finiteNonNegative(record.frame)) errors.push("Director annotation target is invalid.");
  if ((record.points ?? []).length > 8192 || !(record.points ?? []).every((point) => point.every(Number.isFinite))) errors.push("Director annotation points are invalid.");
  if (filterOpenAnnotations([record], record.shotId, record.revision, record.frame).length > 1) errors.push("Director annotation filtering failed.");
  return errors;
}

function validateSequence(record: CinematicSequence): string[] {
  const errors: string[] = [];
  if (!finitePositive(record.fps)) errors.push("Cinematic sequence FPS must be positive.");
  const result = assembleCinematicSequence(record);
  if (!result.valid) errors.push("Cinematic sequence contains invalid overlap or timing.");
  return errors;
}

function validateCatalog(record: EntityCatalogEntry): string[] {
  const errors: string[] = [];
  if (!/^minecraft:[a-z0-9_./-]+$/.test(record.minecraftId) || !record.rigFamily || !record.materialProfileId) errors.push("Entity catalog entry is incomplete.");
  if (!finiteNonNegative(record.minimumDataVersion)) errors.push("Entity data version is invalid.");
  const result = resolveEntityCatalog([record], record.minecraftId, record.minimumDataVersion);
  if (!result.compatible) errors.push("Entity catalog entry cannot resolve itself.");
  return errors;
}

function validateMob(record: CustomMobDefinition): string[] {
  const result = validateCustomMob(record);
  return result.valid ? [] : result.errors;
}

function validateEquipment(record: EquipmentSet): string[] {
  const errors: string[] = [];
  if (!record.targetRigFamily) errors.push("Equipment set requires a target rig family.");
  const result = resolveEquipment(record);
  if (result.conflicts.length > 0) errors.push(...result.conflicts.map((slot) => `Equipment slot conflict: ${slot}.`));
  return errors;
}

function validateSecondaryMotion(record: SecondaryMotionProfile): string[] {
  const errors: string[] = [];
  if (!record.targetId || (record.chainBoneIds ?? []).length === 0) errors.push("Secondary-motion profile requires target and chain bones.");
  if (!inRange(record.stiffness, 0, 1) || !inRange(record.damping, 0, 1) || !finiteNonNegative(record.collisionRadius)) errors.push("Secondary-motion parameters are out of range.");
  const count = record.chainBoneIds?.length ?? 0;
  const zeros = Array.from({ length: count }, () => [0, 0, 0] as const);
  const result = stepSecondaryMotion(record, zeros, zeros, zeros, 1 / 24);
  if (!result.positions.every((position) => position.every(Number.isFinite))) errors.push("Secondary-motion step failed.");
  return errors;
}

function validateAttention(record: AttentionCue): string[] {
  const errors: string[] = [];
  if (!record.characterId || !isFrameRange(record.startFrame, record.endFrame)) errors.push("Attention cue target or frame range is invalid.");
  if (!inRange(record.headWeight, 0, 1) || !inRange(record.torsoWeight, 0, 1)) errors.push("Attention weights must be between 0 and 1.");
  const result = resolveAttention([record], record.characterId, record.startFrame);
  if (!result) errors.push("Attention cue cannot resolve at its start frame.");
  return errors;
}

function validateMobLocomotion(record: MobLocomotionProfile): string[] {
  const errors: string[] = [];
  if (!record.rigFamily || !finitePositive(record.gaitFrequency) || !finiteNonNegative(record.strideLength) || !finiteNonNegative(record.maximumSlopeDegrees)) errors.push("Mob locomotion profile is invalid.");
  const result = sampleMobLocomotion(record, 0.5, 1);
  if (![result.strideOffset, result.verticalOffset].every(Number.isFinite)) errors.push("Mob locomotion sampling failed.");
  return errors;
}

function validateCombat(record: CombatSequence): string[] {
  const result = validateCombatSequence(record);
  return result.valid ? [] : result.errors;
}

function validateParkour(record: ParkourPath): string[] {
  const result = validateParkourPath(record);
  return result.valid ? [] : result.errors;
}

function validateActing(record: ActingBeat): string[] {
  const errors: string[] = [];
  if (!record.characterId || !isFrameRange(record.startFrame, record.endFrame) || !inRange(record.intensity, 0, 1) || !finitePositive(record.breathingRate)) errors.push("Acting beat is invalid.");
  if (!synchronizeActingBeat(record, record.startFrame)) errors.push("Acting beat cannot synchronize at its start frame.");
  return errors;
}

function validateCrowd(record: NarrativeCrowdGroup): string[] {
  const errors: string[] = [];
  if ((record.memberIds ?? []).length === 0 || (record.memberIds ?? []).length > 5000) errors.push("Crowd group member count is invalid.");
  if (new Set(record.memberIds ?? []).size !== (record.memberIds ?? []).length) errors.push("Crowd member identifiers must be unique.");
  if (!record.actionCorridor?.[0]?.every(Number.isFinite) || !record.actionCorridor?.[1]?.every(Number.isFinite)) errors.push("Crowd action corridor is invalid.");
  if (assignNarrativeCrowd(record).length !== (record.memberIds ?? []).length) errors.push("Crowd assignment lost members.");
  return errors;
}

function validateSetLayer(record: SetLayer): string[] {
  const errors: string[] = [];
  if (!record.worldFingerprint) errors.push("Set layer must preserve its source world fingerprint.");
  for (const operation of record.operations ?? []) {
    if (![operation.x, operation.y, operation.z].every(Number.isFinite)) errors.push("Set operation coordinates are invalid.");
    if (operation.operation !== "hide" && !operation.blockState) errors.push("Set add/replace operations require a block state.");
  }
  if (!Array.isArray(applySetLayers([record]))) errors.push("Set layer evaluation failed.");
  return errors;
}

function validateDestruction(record: DestructionEvent): string[] {
  const errors: string[] = [];
  if (!finiteNonNegative(record.startFrame) || !finitePositive(record.radius) || !finiteNonNegative(record.propagationFrames)) errors.push("Destruction timing or radius is invalid.");
  if (!(record.blockPositions ?? []).every((position) => position.every(Number.isFinite))) errors.push("Destruction block positions are invalid.");
  if (!scheduleDestruction(record).every((sample) => Number.isFinite(sample.activationFrame))) errors.push("Destruction schedule failed.");
  return errors;
}

function validateDebris(record: DebrisProfile): string[] {
  const errors: string[] = [];
  if (!record.blockStatePattern || !finiteNonNegative(record.piecesPerBlock) || !finiteNonNegative(record.dustPerBlock) || !finiteNonNegative(record.maximumPieces) || !finitePositive(record.visibilityDistance)) errors.push("Debris profile is invalid.");
  const sampleEvent = { ...baseWorldEvent(), blockPositions: [[0, 0, 0]] as const } as unknown as DestructionEvent;
  if (generateDebris(sampleEvent, record).length > Math.round(record.maximumPieces)) errors.push("Debris generation exceeded its budget.");
  return errors;
}

function validateRigidBody(record: RigidBodyRecord): string[] {
  const errors: string[] = [];
  if (!record.targetId || !finitePositive(record.mass) || !inRange(record.restitution, 0, 1) || !inRange(record.friction, 0, 1)) errors.push("Rigid-body parameters are invalid.");
  const result = stepRigidBody(record, 1 / 24);
  if (!result.position.every(Number.isFinite) || !result.velocity.every(Number.isFinite)) errors.push("Rigid-body step failed.");
  return errors;
}

function validateFluid(record: FluidVolume): string[] {
  const errors: string[] = [];
  if (!finitePositive(record.surfaceBlockSize) || !finiteNonNegative(record.flowSpeed)) errors.push("Fluid scale or speed is invalid.");
  for (let axis = 0; axis < 3; axis += 1) if (!(record.boundsMin[axis] < record.boundsMax[axis])) errors.push("Fluid bounds must be ordered.");
  const result = sampleStylizedFluid(record, record.boundsMin, 0);
  if (!result.position.every(Number.isFinite) || !result.normal.every(Number.isFinite)) errors.push("Fluid sampling failed.");
  return errors;
}

function validateCombustion(record: CombustionSource): string[] {
  const errors: string[] = [];
  if (!finiteNonNegative(record.ignitionFrame) || !finitePositive(record.durationFrames) || !finiteNonNegative(record.fuel) || !finiteNonNegative(record.spreadRadius) || !inRange(record.smokeDensity, 0, 1)) errors.push("Combustion parameters are invalid.");
  const result = sampleCombustion(record, record.ignitionFrame);
  if (![result.flameIntensity, result.smokeDensity, result.lightIntensity, result.spreadRadius].every(Number.isFinite)) errors.push("Combustion sampling failed.");
  return errors;
}

function validateRedstone(record: RedstoneGraph): string[] {
  const errors: string[] = [];
  if ((record.nodes ?? []).length === 0) errors.push("Redstone graph requires nodes.");
  const ids = new Set((record.nodes ?? []).map((node) => node.id));
  if (ids.size !== (record.nodes ?? []).length) errors.push("Redstone node identifiers must be unique.");
  for (const node of record.nodes ?? []) for (const input of node.inputIds) if (!ids.has(input)) errors.push(`Redstone node ${node.id} references missing input ${input}.`);
  const result = evaluateRedstoneGraph(record, 0);
  if (!Object.values(result.powers).every(Number.isFinite)) errors.push("Redstone evaluation failed.");
  return errors;
}

function validateVehicle(record: VehicleRecord): string[] {
  const errors: string[] = [];
  if ((record.path ?? []).length < 2 || !finiteNonNegative(record.speed) || !Number.isFinite(record.banking)) errors.push("Vehicle path or speed is invalid.");
  const result = sampleVehicle(record, 0.5);
  if (!result.position.every(Number.isFinite) || !result.forward.every(Number.isFinite) || !result.up.every(Number.isFinite) || !Number.isFinite(result.bankDegrees)) errors.push("Vehicle sampling failed.");
  return errors;
}

function validateWeather(record: WeatherSeasonPreset): string[] {
  const errors: string[] = [];
  for (const value of [record.rain, record.snow, record.storm, record.fog, record.wind, record.accumulation]) if (!inRange(value, 0, 1)) errors.push("Weather channels must be between 0 and 1.");
  if (!inRange(record.colorTemperatureKelvin, 1000, 20000)) errors.push("Weather color temperature is invalid.");
  const result = sampleWeather(record, null, 0);
  if (![result.rain, result.snow, result.fog].every(Number.isFinite)) errors.push("Weather sampling failed.");
  return errors;
}

function validateBattle(record: BattleScenario): string[] {
  const result = scheduleBattle(record);
  return result.valid ? [] : result.errors;
}

function validateMaterial(record: CinematicMaterialProfile): string[] {
  const errors: string[] = [];
  for (const value of [record.roughness, record.metallic, record.reliefStrength, record.transmission, record.subsurface]) if (!inRange(value, 0, 1)) errors.push("Material channels must be between 0 and 1.");
  if (!finiteNonNegative(record.emissionStrength)) errors.push("Material emission must be non-negative.");
  if (!evaluateMaterialProfile(record, record.emissionStrength > 0 ? 0 : 1).readable) errors.push("Material profile does not preserve Minecraft readability.");
  return errors;
}

function validateLight(record: ArtisticLightRecord): string[] {
  const errors: string[] = [];
  if (!finiteNonNegative(record.intensityLumens) || !Number.isFinite(record.exposureStops)) errors.push("Light intensity or exposure is invalid.");
  if (!record.position.every(Number.isFinite) || !record.direction.every(Number.isFinite)) errors.push("Light transform is invalid.");
  const conflicts = record.linkedObjectIds.filter((id) => record.excludedObjectIds.includes(id));
  if (conflicts.length > 0) errors.push(`Light contains linked/excluded conflicts: ${conflicts.join(", ")}.`);
  if (!Number.isFinite(evaluateLightContribution(record, record.linkedObjectIds[0] ?? "sample").intensity)) errors.push("Light evaluation failed.");
  return errors;
}

function validateVolume(record: VolumetricProfile): string[] {
  const errors: string[] = [];
  if (!inRange(record.density, 0, 4) || !inRange(record.anisotropy, -0.99, 0.99) || !inRange(record.absorption, 0, 4) || !inRange(record.shadowStrength, 0, 1) || !inRange(record.vfxContribution, 0, 1)) errors.push("Volumetric parameters are invalid.");
  if (!inRange(record.previewSteps, 1, 512) || !inRange(record.finalSteps, 1, 512) || record.finalSteps < record.previewSteps) errors.push("Volumetric step budgets are invalid.");
  if (!inRange(record.maximumDifference, 0, 1)) errors.push("Volumetric tolerance is invalid.");
  if (compareVolumetricQualities(record, 12) > record.maximumDifference) errors.push("Preview/final volumetric difference exceeds tolerance.");
  if (!Number.isFinite(sampleVolumetricProfile(record, 12, "final").transmittance)) errors.push("Volumetric sampling failed.");
  return errors;
}

function validateSky(record: SkyCloudProfile): string[] {
  const errors: string[] = [];
  if (!isFrameRange(record.startFrame, record.endFrame)) errors.push("Sky frame range is invalid.");
  if (!inRange(record.startTimeOfDay, 0, 1) || !inRange(record.endTimeOfDay, 0, 1) || !inRange(record.cloudCoverage, 0, 1) || !inRange(record.starIntensity, 0, 1) || !inRange(record.moonPhase, 0, 1)) errors.push("Sky channels are out of range.");
  if (!finitePositive(record.cloudAltitude) || !record.cloudSpeed.every(Number.isFinite) || !record.continuityGroupId) errors.push("Sky cloud or continuity data is invalid.");
  const result = sampleSkyProfile(record, record.startFrame);
  if (!result.sunDirection.every(Number.isFinite)) errors.push("Sky sampling failed.");
  return errors;
}

function validateVfx(record: VfxNodeGraphRecord): string[] {
  const result = validateVfxGraph(record);
  const errors = [...result.errors];
  if (result.valid && !Number.isFinite(evaluateVfxGraph(record, 0).checksum)) errors.push("VFX graph evaluation failed.");
  return errors;
}

function validateMinecraftEffectRecord(record: MinecraftEffectPreset): string[] {
  const errors: string[] = [];
  if (!record.graphId || !record.eventName || !finitePositive(record.maximumParticles)) errors.push("Minecraft effect graph, event or budget is invalid.");
  if (!record.tested) errors.push("Minecraft effect must be marked tested before validation.");
  const result = evaluateMinecraftEffect(record, record.eventName, new Set([record.graphId]));
  if (!result.active || result.particleBudget <= 0) errors.push("Minecraft effect cannot activate its own event.");
  return errors;
}

function validateComposite(record: CompositingGraphRecord): string[] {
  return validateCompositingGraph(record).errors;
}

function validateColor(record: ColorManagementProfile): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(record.exposureStops) || !inRange(record.contrast, 0, 4) || !inRange(record.saturation, 0, 4) || !inRange(record.peakNits, 80, 10000)) errors.push("Color-management parameters are invalid.");
  const transformed = transformColor(record, [0.18, 0.5, 1]);
  if (!transformed.rgb.every(Number.isFinite) || !Number.isFinite(transformed.luminanceNits)) errors.push("Color transform failed.");
  const scopes = calculateColorScopes([[0, 0, 0], [0.18, 0.5, 1]]);
  if (scopes.histogram.reduce((sum, count) => sum + count, 0) !== 2) errors.push("Color scopes lost samples.");
  return errors;
}

function baseWorldEvent(): Partial<DestructionEvent> {
  return {
    id: "validation_destruction",
    name: "Validation destruction",
    enabled: true,
    notes: "",
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startFrame: 0,
    origin: [0, 0, 0],
    radius: 1,
    seed: 1,
    propagationFrames: 1
  };
}

function isFrameRange(start: number, end: number): boolean {
  return finiteNonNegative(start) && finiteNonNegative(end) && end >= start;
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function inRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isRange(value: readonly [number, number]): boolean {
  return value?.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]) && value[1] > value[0];
}

function vectorLength(value: readonly number[]): number {
  return Math.hypot(...value.map((entry) => Number.isFinite(entry) ? entry : 0));
}
