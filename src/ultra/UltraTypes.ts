import type { UltraArcId, UltraPhaseNumber, UltraPhaseStatus } from "./UltraPhaseRegistry";
import type { UltraCapabilityRecord } from "./capabilities/UltraCapabilityTypes";

export type UltraVector2 = readonly [number, number];
export type UltraVector3 = readonly [number, number, number];
export type UltraEuler = readonly [number, number, number];
export type UltraColor = `#${string}`;

export interface UltraPhaseState {
  phase: UltraPhaseNumber;
  status: UltraPhaseStatus;
  artifactCount: number;
  validationErrors: string[];
  validationWarnings: string[];
  updatedAt: string;
}

export interface UltraBaseRecord {
  id: string;
  name: string;
  enabled: boolean;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type FacialChannelId =
  | "jawOpen" | "mouthWide" | "mouthNarrow" | "mouthSmile" | "mouthFrown"
  | "lipUpper" | "lipLower" | "browLeft" | "browRight" | "lidLeft"
  | "lidRight" | "cheekLeft" | "cheekRight" | "lookVertical";

export interface FacialPose {
  channels: Partial<Record<FacialChannelId, number>>;
}

export interface FacialRigProfile extends UltraBaseRecord {
  style: "vanilla" | "cinematic" | "cartoon";
  channelLimits: Partial<Record<FacialChannelId, UltraVector2>>;
  visemes: Record<string, FacialPose>;
  emotions: Record<string, FacialPose>;
  microExpressions: Record<string, FacialPose>;
}

export interface CorrectiveRule extends UltraBaseRecord {
  rigFamily: "steve" | "alex" | "generic" | "creature";
  boneId: string;
  axis: 0 | 1 | 2;
  inputRangeDegrees: UltraVector2;
  scaleOffset: UltraVector3;
  positionOffset: UltraVector3;
  jointFill: number;
}

export interface ContactConstraintRecord extends UltraBaseRecord {
  targetId: string;
  effectorBoneId: string;
  targetObjectId: string | null;
  targetPoint: UltraVector3;
  startFrame: number;
  endFrame: number;
  maximumReach: number;
  orientationWeight: number;
  bakeAfterSolve: boolean;
}

export interface AnimationLayerRecord extends UltraBaseRecord {
  targetId: string;
  kind: "base" | "locomotion" | "acting" | "face" | "look" | "hands" | "correction";
  blendMode: "override" | "additive";
  weight: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  boneMask: string[];
  sourceClipId: string;
}

export interface RetargetBoneMap {
  sourceBoneId: string;
  targetBoneId: string;
  axisMap: readonly [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
  axisSigns: readonly [-1 | 1, -1 | 1, -1 | 1];
  rotationOffsetDegrees: UltraEuler;
  confidence: number;
}

export interface RetargetProfile extends UltraBaseRecord {
  sourceRigId: string;
  targetRigId: string;
  sourceHeight: number;
  targetHeight: number;
  rootMotionScale: number;
  mappings: RetargetBoneMap[];
  unresolvedSourceBones: string[];
}

export interface LocomotionWaypoint {
  id: string;
  position: UltraVector3;
  mode: "walk" | "run" | "sprint" | "jump" | "fall" | "pause";
  holdFrames: number;
}

export interface LocomotionPlan extends UltraBaseRecord {
  targetId: string;
  fps: number;
  startFrame: number;
  stepHeight: number;
  turnSmoothing: number;
  acceleration: number;
  waypoints: LocomotionWaypoint[];
}

export interface PerformancePreset extends UltraBaseRecord {
  emotion: "neutral" | "joy" | "fear" | "anger" | "fatigue" | "sadness" | "surprise" | "confidence";
  intensity: number;
  durationFrames: number;
  mirrorable: boolean;
  clipId: string;
}

export interface MocapJointObservation {
  jointId: string;
  position: UltraVector3;
  confidence: number;
}

export interface MocapFrameObservation {
  frame: number;
  joints: MocapJointObservation[];
}

export interface MocapSession extends UltraBaseRecord {
  sourceName: string;
  sourceFingerprint: string;
  sourceDurationSeconds: number;
  sourceFps: number;
  targetRigId: string;
  observations: MocapFrameObservation[];
  manualCorrections: MocapFrameObservation[];
  generatedClipId: string | null;
}

export interface CurveToolPreset extends UltraBaseRecord {
  mode: "smooth" | "simplify" | "clamp" | "remove-jitter";
  strength: number;
  tolerance: number;
  preserveEndpoints: boolean;
}

export interface AnimationGraphTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  parameter: string;
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  threshold: number;
  durationFrames: number;
  priority: number;
}

export interface AnimationGraphState {
  id: string;
  name: string;
  clipId: string;
  speed: number;
  loop: boolean;
}

export interface AnimationGraphRecord extends UltraBaseRecord {
  targetId: string;
  initialStateId: string;
  states: AnimationGraphState[];
  transitions: AnimationGraphTransition[];
}

export interface PhysicalCameraProfile extends UltraBaseRecord {
  sensorWidthMm: number;
  sensorHeightMm: number;
  focalLengthMm: number;
  apertureFStop: number;
  shutterAngleDegrees: number;
  iso: number;
  focusDistance: number;
}

export interface CameraRigRecord extends UltraBaseRecord {
  cameraId: string;
  kind: "dolly" | "crane" | "orbit" | "shoulder" | "drone" | "attached";
  origin: UltraVector3;
  targetId: string | null;
  path: UltraVector3[];
  rollDegrees: number;
  stabilization: number;
}

export interface CompositionCheck extends UltraBaseRecord {
  shotId: string;
  subjectIds: string[];
  rule: "thirds" | "symmetry" | "look-room" | "head-room" | "diagonal";
  tolerance: number;
}

export interface ContinuityAxis extends UltraBaseRecord {
  sceneId: string;
  shotIds: string[];
  origin: UltraVector3;
  direction: UltraVector3;
  allowedCrossingShotIds: string[];
}

export interface FocusCue extends UltraBaseRecord {
  shotId: string;
  startFrame: number;
  endFrame: number;
  sourceDistance: number;
  targetDistance: number;
  targetObjectId: string | null;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface BlockingSnapshot extends UltraBaseRecord {
  sceneId: string;
  frame: number;
  entityTransforms: Record<string, { position: UltraVector3; rotation: UltraEuler; scale: UltraVector3 }>;
  proxyQuality: "box" | "rig" | "preview";
}

export interface StoryboardLink extends UltraBaseRecord {
  storyboardCardId: string;
  shotId: string;
  sourceImageName: string;
  temporaryAudioClipId: string | null;
  durationFrames: number;
}

export interface TakeVariantGroup extends UltraBaseRecord {
  shotId: string;
  takeIds: string[];
  activeTakeId: string;
  ratings: Record<string, number>;
}

export interface DirectorAnnotation extends UltraBaseRecord {
  shotId: string;
  revision: number;
  frame: number;
  status: "open" | "addressed" | "approved";
  shape: "text" | "arrow" | "circle" | "freehand";
  points: UltraVector2[];
  color: UltraColor;
}

export interface SequenceClipRecord {
  id: string;
  shotId: string;
  startFrame: number;
  sourceInFrame: number;
  sourceOutFrame: number;
  transitionFrames: number;
}

export interface CinematicSequence extends UltraBaseRecord {
  fps: number;
  clips: SequenceClipRecord[];
}

export interface EntityCatalogEntry extends UltraBaseRecord {
  minecraftId: string;
  minimumDataVersion: number;
  rigFamily: string;
  materialProfileId: string;
  fallbackEntityId: string | null;
  defaultAnimations: string[];
}

export interface CustomMobDefinition extends UltraBaseRecord {
  baseRigFamily: string;
  bones: Array<{ id: string; parentId: string | null; pivot: UltraVector3; size: UltraVector3 }>;
  sockets: Array<{ id: string; boneId: string; offset: UltraVector3 }>;
  textureAssetId: string | null;
  lodDistances: number[];
}

export interface EquipmentSet extends UltraBaseRecord {
  targetRigFamily: string;
  slots: Array<{ slotId: string; assetId: string; boneId: string; offset: UltraVector3; rotation: UltraEuler }>;
}

export interface SecondaryMotionProfile extends UltraBaseRecord {
  targetId: string;
  chainBoneIds: string[];
  stiffness: number;
  damping: number;
  gravity: UltraVector3;
  collisionRadius: number;
  seed: number;
}

export interface AttentionCue extends UltraBaseRecord {
  characterId: string;
  targetId: string | null;
  targetPoint: UltraVector3;
  startFrame: number;
  endFrame: number;
  priority: number;
  headWeight: number;
  torsoWeight: number;
}

export interface MobLocomotionProfile extends UltraBaseRecord {
  rigFamily: string;
  family: "biped" | "quadruped" | "flying" | "crawling" | "swimming" | "boss";
  gaitFrequency: number;
  strideLength: number;
  verticalAmplitude: number;
  maximumSlopeDegrees: number;
}

export interface CombatBeat {
  id: string;
  frame: number;
  actorId: string;
  targetId: string;
  action: "anticipation" | "attack" | "contact" | "parry" | "dodge" | "reaction" | "recovery";
  weaponSlotId: string | null;
}

export interface CombatSequence extends UltraBaseRecord {
  fps: number;
  beats: CombatBeat[];
  minimumReactionFrames: number;
}

export interface ParkourNode {
  id: string;
  position: UltraVector3;
  action: "run" | "jump" | "vault" | "climb" | "drop" | "wall-run";
  surfaceNormal: UltraVector3;
}

export interface ParkourPath extends UltraBaseRecord {
  targetId: string;
  nodes: ParkourNode[];
  maximumJumpDistance: number;
  maximumClimbHeight: number;
}

export interface ActingBeat extends UltraBaseRecord {
  characterId: string;
  startFrame: number;
  endFrame: number;
  emotion: PerformancePreset["emotion"];
  intensity: number;
  gazeTargetId: string | null;
  breathingRate: number;
}

export interface NarrativeCrowdGroup extends UltraBaseRecord {
  role: "civilian" | "guard" | "attacker" | "supporter" | "fleeing" | "spectator";
  memberIds: string[];
  leaderId: string | null;
  focusPoint: UltraVector3;
  actionCorridor: readonly [UltraVector3, UltraVector3];
  seed: number;
}

export interface SetLayerOperation {
  x: number;
  y: number;
  z: number;
  operation: "add" | "hide" | "replace";
  blockState: string | null;
}

export interface SetLayer extends UltraBaseRecord {
  worldFingerprint: string;
  shotId: string | null;
  operations: SetLayerOperation[];
}

export interface DestructionEvent extends UltraBaseRecord {
  startFrame: number;
  origin: UltraVector3;
  radius: number;
  seed: number;
  blockPositions: UltraVector3[];
  propagationFrames: number;
}

export interface DebrisProfile extends UltraBaseRecord {
  blockStatePattern: string;
  piecesPerBlock: number;
  dustPerBlock: number;
  maximumPieces: number;
  visibilityDistance: number;
}

export interface RigidBodyRecord extends UltraBaseRecord {
  targetId: string;
  mass: number;
  position: UltraVector3;
  velocity: UltraVector3;
  angularVelocity: UltraVector3;
  restitution: number;
  friction: number;
  sleeping: boolean;
}

export interface FluidVolume extends UltraBaseRecord {
  kind: "water" | "lava";
  boundsMin: UltraVector3;
  boundsMax: UltraVector3;
  flowDirection: UltraVector3;
  flowSpeed: number;
  surfaceBlockSize: number;
}

export interface CombustionSource extends UltraBaseRecord {
  position: UltraVector3;
  ignitionFrame: number;
  durationFrames: number;
  fuel: number;
  spreadRadius: number;
  smokeDensity: number;
  seed: number;
}

export interface RedstoneNode {
  id: string;
  kind: "source" | "wire" | "repeater" | "comparator" | "piston" | "lamp" | "door" | "output";
  inputIds: string[];
  delayFrames: number;
  threshold: number;
}

export interface RedstoneGraph extends UltraBaseRecord {
  nodes: RedstoneNode[];
  timelineOverrides: Array<{ frame: number; nodeId: string; power: number }>;
}

export interface VehicleRecord extends UltraBaseRecord {
  kind: "minecart" | "boat" | "horse" | "elytra" | "custom";
  driverId: string | null;
  passengerIds: string[];
  path: UltraVector3[];
  speed: number;
  banking: number;
}

export interface WeatherSeasonPreset extends UltraBaseRecord {
  season: "spring" | "summer" | "autumn" | "winter" | "custom";
  rain: number;
  snow: number;
  storm: number;
  fog: number;
  wind: number;
  accumulation: number;
  colorTemperatureKelvin: number;
}

export interface BattleWave {
  id: string;
  startFrame: number;
  groupIds: string[];
  projectileCount: number;
  destructionEventIds: string[];
  weatherPresetId: string | null;
}

export interface BattleScenario extends UltraBaseRecord {
  fps: number;
  maximumActiveEntities: number;
  maximumEventsPerFrame: number;
  seed: number;
  waves: BattleWave[];
}

export interface UltraPerformanceData {
  facialProfiles: FacialRigProfile[];
  correctiveRules: CorrectiveRule[];
  contactConstraints: ContactConstraintRecord[];
  animationLayers: AnimationLayerRecord[];
  retargetProfiles: RetargetProfile[];
  locomotionPlans: LocomotionPlan[];
  performancePresets: PerformancePreset[];
  mocapSessions: MocapSession[];
  curvePresets: CurveToolPreset[];
  animationGraphs: AnimationGraphRecord[];
}

export interface UltraDirectingData {
  cameraProfiles: PhysicalCameraProfile[];
  cameraRigs: CameraRigRecord[];
  compositionChecks: CompositionCheck[];
  continuityAxes: ContinuityAxis[];
  focusCues: FocusCue[];
  blockingSnapshots: BlockingSnapshot[];
  storyboardLinks: StoryboardLink[];
  takeGroups: TakeVariantGroup[];
  annotations: DirectorAnnotation[];
  sequences: CinematicSequence[];
}

export interface UltraEntityData {
  catalogEntries: EntityCatalogEntry[];
  customMobs: CustomMobDefinition[];
  equipmentSets: EquipmentSet[];
  secondaryMotionProfiles: SecondaryMotionProfile[];
  attentionCues: AttentionCue[];
  locomotionProfiles: MobLocomotionProfile[];
  combatSequences: CombatSequence[];
  parkourPaths: ParkourPath[];
  actingBeats: ActingBeat[];
  crowdGroups: NarrativeCrowdGroup[];
}


export interface CinematicMaterialProfile extends UltraBaseRecord {
  category: "stone" | "wood" | "metal" | "glass" | "water" | "foliage" | "organic" | "emissive";
  style: "vanillaPlus" | "film" | "stylized";
  baseColor: UltraColor;
  roughness: number;
  metallic: number;
  reliefStrength: number;
  emissionStrength: number;
  transmission: number;
  subsurface: number;
  preservePixelEdges: boolean;
}

export interface ArtisticLightRecord extends UltraBaseRecord {
  kind: "directional" | "point" | "spot" | "area" | "ambient";
  color: UltraColor;
  intensityLumens: number;
  exposureStops: number;
  position: UltraVector3;
  direction: UltraVector3;
  linkedObjectIds: string[];
  excludedObjectIds: string[];
  blockerIds: string[];
  cookieAssetId: string | null;
  groupId: string;
}

export interface VolumetricProfile extends UltraBaseRecord {
  scope: "global" | "local";
  density: number;
  anisotropy: number;
  scatteringColor: UltraColor;
  absorption: number;
  shadowStrength: number;
  vfxContribution: number;
  previewSteps: number;
  finalSteps: number;
  maximumDifference: number;
}

export interface SkyCloudProfile extends UltraBaseRecord {
  style: "minecraft" | "cinematic" | "stylized";
  startFrame: number;
  endFrame: number;
  startTimeOfDay: number;
  endTimeOfDay: number;
  cloudCoverage: number;
  cloudAltitude: number;
  cloudSpeed: UltraVector2;
  starIntensity: number;
  moonPhase: number;
  continuityGroupId: string;
}

export type VfxNodeKind = "spawn" | "motion" | "appearance" | "event" | "subgraph" | "output";
export interface VfxGraphNode {
  id: string;
  kind: VfxNodeKind;
  inputIds: string[];
  parameters: Record<string, number | string | boolean>;
}

export interface VfxNodeGraphRecord extends UltraBaseRecord {
  version: 1;
  nodes: VfxGraphNode[];
  exposedParameters: string[];
  subgraphIds: string[];
  maximumParticles: number;
  maximumEventsPerFrame: number;
  seed: number;
}

export interface MinecraftEffectPreset extends UltraBaseRecord {
  kind: "potion" | "enchantment" | "portal" | "xp" | "redstone" | "boss";
  style: "vanilla" | "film" | "stylized";
  graphId: string;
  eventName: string;
  maximumParticles: number;
  fallbackPresetId: string | null;
  tested: boolean;
}

export type CompositingNodeKind = "input" | "color" | "mask" | "glow" | "blur" | "depth" | "objectId" | "merge" | "output";
export interface CompositingNode {
  id: string;
  kind: CompositingNodeKind;
  inputIds: string[];
  parameters: Record<string, number | string | boolean>;
}

export interface CompositingGraphRecord extends UltraBaseRecord {
  scope: "shot" | "sequence";
  targetId: string;
  nodes: CompositingNode[];
  cacheEnabled: boolean;
  comparisonMode: "off" | "split" | "wipe";
  requiredPasses: string[];
}

export interface ColorManagementProfile extends UltraBaseRecord {
  workingSpace: "linear-srgb" | "acescg";
  displayTransform: "srgb" | "rec709" | "p3-d65" | "rec2020-pq";
  look: "neutral" | "filmic" | "highContrast" | "custom";
  lutAssetId: string | null;
  exposureStops: number;
  contrast: number;
  saturation: number;
  peakNits: number;
  gamutCompression: boolean;
}

export interface UltraRenderingData {
  materialProfiles: CinematicMaterialProfile[];
  lights: ArtisticLightRecord[];
  volumetricProfiles: VolumetricProfile[];
  skyProfiles: SkyCloudProfile[];
  vfxGraphs: VfxNodeGraphRecord[];
  minecraftEffects: MinecraftEffectPreset[];
  compositingGraphs: CompositingGraphRecord[];
  colorProfiles: ColorManagementProfile[];
}

export interface UltraWorldData {
  setLayers: SetLayer[];
  destructionEvents: DestructionEvent[];
  debrisProfiles: DebrisProfile[];
  rigidBodies: RigidBodyRecord[];
  fluidVolumes: FluidVolume[];
  combustionSources: CombustionSource[];
  redstoneGraphs: RedstoneGraph[];
  vehicles: VehicleRecord[];
  weatherPresets: WeatherSeasonPreset[];
  battleScenarios: BattleScenario[];
}

export interface UltraProjectData {
  schemaVersion: 1;
  phaseStates: Record<string, UltraPhaseState>;
  performance: UltraPerformanceData;
  directing: UltraDirectingData;
  entities: UltraEntityData;
  world: UltraWorldData;
  rendering: UltraRenderingData;
  capabilities: UltraCapabilityRecord[];
  activeArc: UltraArcId;
  updatedAt: string;
}

export interface UltraValidationIssue {
  phase: UltraPhaseNumber;
  severity: "error" | "warning";
  code: string;
  message: string;
  recordId?: string;
}

export interface UltraValidationReport {
  valid: boolean;
  configuredPhases: number;
  validatedPhases: number;
  issues: UltraValidationIssue[];
}
