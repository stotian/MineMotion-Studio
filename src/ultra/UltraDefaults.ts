import { ULTRA_PHASE_NUMBERS, type UltraPhaseNumber } from "./UltraPhaseRegistry";
import { createUltraCapabilityRecord } from "./capabilities/UltraCapabilityEngine";
import type { UltraCapabilityRecord } from "./capabilities/UltraCapabilityTypes";
import type {
  ActingBeat,
  AnimationGraphRecord,
  AnimationLayerRecord,
  BattleScenario,
  BlockingSnapshot,
  CameraRigRecord,
  CinematicMaterialProfile,
  ArtisticLightRecord,
  VolumetricProfile,
  SkyCloudProfile,
  VfxNodeGraphRecord,
  MinecraftEffectPreset,
  CompositingGraphRecord,
  ColorManagementProfile,
  CinematicSequence,
  CombatSequence,
  CombustionSource,
  CompositionCheck,
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
  StoryboardLink,
  TakeVariantGroup,
  UltraBaseRecord,
  UltraProjectData,
  VehicleRecord,
  WeatherSeasonPreset,
  AttentionCue
} from "./UltraTypes";

const nowIso = (): string => new Date().toISOString();
const base = (id: string, name: string, now = nowIso()): UltraBaseRecord => ({
  id,
  name,
  enabled: true,
  notes: "",
  tags: [],
  createdAt: now,
  updatedAt: now
});

export function createDefaultUltraProjectData(now = nowIso()): UltraProjectData {
  return {
    schemaVersion: 1,
    phaseStates: Object.fromEntries(
      ULTRA_PHASE_NUMBERS.map((phase) => [String(phase), {
        phase,
        status: "planned",
        artifactCount: 0,
        validationErrors: [],
        validationWarnings: [],
        updatedAt: now
      }])
    ),
    performance: {
      facialProfiles: [],
      correctiveRules: [],
      contactConstraints: [],
      animationLayers: [],
      retargetProfiles: [],
      locomotionPlans: [],
      performancePresets: [],
      mocapSessions: [],
      curvePresets: [],
      animationGraphs: []
    },
    directing: {
      cameraProfiles: [],
      cameraRigs: [],
      compositionChecks: [],
      continuityAxes: [],
      focusCues: [],
      blockingSnapshots: [],
      storyboardLinks: [],
      takeGroups: [],
      annotations: [],
      sequences: []
    },
    entities: {
      catalogEntries: [],
      customMobs: [],
      equipmentSets: [],
      secondaryMotionProfiles: [],
      attentionCues: [],
      locomotionProfiles: [],
      combatSequences: [],
      parkourPaths: [],
      actingBeats: [],
      crowdGroups: []
    },
    world: {
      setLayers: [],
      destructionEvents: [],
      debrisProfiles: [],
      rigidBodies: [],
      fluidVolumes: [],
      combustionSources: [],
      redstoneGraphs: [],
      vehicles: [],
      weatherPresets: [],
      battleScenarios: []
    },
    rendering: {
      materialProfiles: [],
      lights: [],
      volumetricProfiles: [],
      skyProfiles: [],
      vfxGraphs: [],
      minecraftEffects: [],
      compositingGraphs: [],
      colorProfiles: []
    },
    capabilities: [],
    activeArc: "performance",
    updatedAt: now
  };
}

export function createUltraPhaseArtifact(
  phase: UltraPhaseNumber,
  sequence = 1,
  now = nowIso()
): UltraProjectDataUpdater {
  if (phase >= 84) {
    return appendCapability(createUltraCapabilityRecord(phase, sequence, now));
  }
  const id = `ultra_${phase}_${sequence}`;
  switch (phase) {
    case 36: {
      const record: FacialRigProfile = {
        ...base(id, `Cinematic Face ${sequence}`, now),
        style: "cinematic",
        channelLimits: {},
        visemes: {
          rest: { channels: {} },
          A: { channels: { jawOpen: 0.72, mouthWide: 0.25 } },
          E: { channels: { mouthWide: 0.68, jawOpen: 0.2 } },
          O: { channels: { mouthNarrow: 0.78, jawOpen: 0.42 } },
          M: { channels: { lipUpper: -0.22, lipLower: 0.22 } }
        },
        emotions: {
          neutral: { channels: {} },
          joy: { channels: { mouthSmile: 0.7, cheekLeft: 0.3, cheekRight: 0.3, browLeft: 0.12, browRight: 0.12 } },
          fear: { channels: { jawOpen: 0.38, browLeft: 0.52, browRight: 0.52, lidLeft: 0.28, lidRight: 0.28 } },
          anger: { channels: { mouthFrown: 0.38, browLeft: -0.48, browRight: -0.48 } }
        },
        microExpressions: {
          blink: { channels: { lidLeft: 1, lidRight: 1 } },
          squint: { channels: { lidLeft: 0.55, lidRight: 0.55, cheekLeft: 0.15, cheekRight: 0.15 } }
        }
      };
      return append("performance", "facialProfiles", record);
    }
    case 37: {
      const record: CorrectiveRule = {
        ...base(id, `Shoulder Volume ${sequence}`, now),
        rigFamily: "steve",
        boneId: "left_arm",
        axis: 2,
        inputRangeDegrees: [30, 120],
        scaleOffset: [0.08, 0.04, 0.08],
        positionOffset: [0, 0.05, 0],
        jointFill: 0.45
      };
      return append("performance", "correctiveRules", record);
    }
    case 38: {
      const record: ContactConstraintRecord = {
        ...base(id, `Foot Contact ${sequence}`, now),
        targetId: "character_primary",
        effectorBoneId: "left_leg",
        targetObjectId: null,
        targetPoint: [0, 0, 0],
        startFrame: 0,
        endFrame: 24,
        maximumReach: 2.5,
        orientationWeight: 0.75,
        bakeAfterSolve: false
      };
      return append("performance", "contactConstraints", record);
    }
    case 39: {
      const record: AnimationLayerRecord = {
        ...base(id, `Acting Layer ${sequence}`, now),
        targetId: "character_primary",
        kind: "acting",
        blendMode: "additive",
        weight: 1,
        fadeInFrames: 4,
        fadeOutFrames: 4,
        boneMask: [],
        sourceClipId: "clip_acting_base"
      };
      return append("performance", "animationLayers", record);
    }
    case 40: {
      const record: RetargetProfile = {
        ...base(id, `Steve to Alex ${sequence}`, now),
        sourceRigId: "steve",
        targetRigId: "alex",
        sourceHeight: 1.8,
        targetHeight: 1.8,
        rootMotionScale: 1,
        mappings: [],
        unresolvedSourceBones: []
      };
      return append("performance", "retargetProfiles", record);
    }
    case 41: {
      const record: LocomotionPlan = {
        ...base(id, `Terrain Route ${sequence}`, now),
        targetId: "character_primary",
        fps: 24,
        startFrame: 0,
        stepHeight: 1.25,
        turnSmoothing: 0.65,
        acceleration: 5,
        waypoints: [
          { id: `${id}_a`, position: [0, 0, 0], mode: "walk", holdFrames: 0 },
          { id: `${id}_b`, position: [4, 0, 0], mode: "run", holdFrames: 0 }
        ]
      };
      return append("performance", "locomotionPlans", record);
    }
    case 42: {
      const record: PerformancePreset = {
        ...base(id, `Dialogue Gesture ${sequence}`, now),
        emotion: "neutral",
        intensity: 0.65,
        durationFrames: 48,
        mirrorable: true,
        clipId: "clip_dialogue_gesture"
      };
      return append("performance", "performancePresets", record);
    }
    case 43: {
      const record: MocapSession = {
        ...base(id, `Local Mocap ${sequence}`, now),
        sourceName: "local-reference.mp4",
        sourceFingerprint: "sha256:local-reference",
        sourceDurationSeconds: 1,
        sourceFps: 24,
        targetRigId: "steve",
        observations: [],
        manualCorrections: [],
        generatedClipId: null
      };
      return append("performance", "mocapSessions", record);
    }
    case 44: {
      const record: CurveToolPreset = {
        ...base(id, `Clean Curves ${sequence}`, now),
        mode: "remove-jitter",
        strength: 0.55,
        tolerance: 0.02,
        preserveEndpoints: true
      };
      return append("performance", "curvePresets", record);
    }
    case 45: {
      const record: AnimationGraphRecord = {
        ...base(id, `Locomotion Graph ${sequence}`, now),
        targetId: "character_primary",
        initialStateId: `${id}_idle`,
        states: [
          { id: `${id}_idle`, name: "Idle", clipId: "", speed: 1, loop: true },
          { id: `${id}_move`, name: "Move", clipId: "", speed: 1, loop: true }
        ],
        transitions: [
          { id: `${id}_transition`, fromStateId: `${id}_idle`, toStateId: `${id}_move`, parameter: "speed", operator: ">", threshold: 0.1, durationFrames: 4, priority: 0 }
        ]
      };
      return append("performance", "animationGraphs", record);
    }
    case 46: {
      const record: PhysicalCameraProfile = {
        ...base(id, `35mm Cinema ${sequence}`, now),
        sensorWidthMm: 36,
        sensorHeightMm: 20.25,
        focalLengthMm: 35,
        apertureFStop: 2.8,
        shutterAngleDegrees: 180,
        iso: 400,
        focusDistance: 8
      };
      return append("directing", "cameraProfiles", record);
    }
    case 47: {
      const record: CameraRigRecord = {
        ...base(id, `Dolly Rig ${sequence}`, now),
        cameraId: "camera_main",
        kind: "dolly",
        origin: [0, 0, 0],
        targetId: null,
        path: [[0, 0, 0], [4, 0, 0]],
        rollDegrees: 0,
        stabilization: 0.9
      };
      return append("directing", "cameraRigs", record);
    }
    case 48: {
      const record: CompositionCheck = {
        ...base(id, `Rule of Thirds ${sequence}`, now),
        shotId: "shot_main",
        subjectIds: ["character_primary"],
        rule: "thirds",
        tolerance: 0.12
      };
      return append("directing", "compositionChecks", record);
    }
    case 49: {
      const record: ContinuityAxis = {
        ...base(id, `Action Axis ${sequence}`, now),
        sceneId: "scene_main",
        shotIds: ["shot_main"],
        origin: [0, 0, 0],
        direction: [1, 0, 0],
        allowedCrossingShotIds: []
      };
      return append("directing", "continuityAxes", record);
    }
    case 50: {
      const record: FocusCue = {
        ...base(id, `Rack Focus ${sequence}`, now),
        shotId: "shot_main",
        startFrame: 0,
        endFrame: 24,
        sourceDistance: 3,
        targetDistance: 12,
        targetObjectId: null,
        easing: "ease-in-out"
      };
      return append("directing", "focusCues", record);
    }
    case 51: {
      const record: BlockingSnapshot = {
        ...base(id, `Blocking Snapshot ${sequence}`, now),
        sceneId: "scene_main",
        frame: 0,
        entityTransforms: {},
        proxyQuality: "box"
      };
      return append("directing", "blockingSnapshots", record);
    }
    case 52: {
      const record: StoryboardLink = {
        ...base(id, `Storyboard Link ${sequence}`, now),
        storyboardCardId: "storyboard_card_main",
        shotId: "shot_main",
        sourceImageName: "",
        temporaryAudioClipId: null,
        durationFrames: 48
      };
      return append("directing", "storyboardLinks", record);
    }
    case 53: {
      const record: TakeVariantGroup = {
        ...base(id, `Coverage Group ${sequence}`, now),
        shotId: "shot_main",
        takeIds: ["take_main"],
        activeTakeId: "take_main",
        ratings: { take_main: 5 }
      };
      return append("directing", "takeGroups", record);
    }
    case 54: {
      const record: DirectorAnnotation = {
        ...base(id, `Director Note ${sequence}`, now),
        shotId: "shot_main",
        revision: 1,
        frame: 0,
        status: "open",
        shape: "text",
        points: [[0.5, 0.5]],
        color: "#ffcc55"
      };
      return append("directing", "annotations", record);
    }
    case 55: {
      const record: CinematicSequence = {
        ...base(id, `Master Sequence ${sequence}`, now),
        fps: 24,
        clips: []
      };
      return append("directing", "sequences", record);
    }
    case 56: {
      const record: EntityCatalogEntry = {
        ...base(id, `Zombie ${sequence}`, now),
        minecraftId: "minecraft:zombie",
        minimumDataVersion: 3465,
        rigFamily: "biped",
        materialProfileId: "minecraft-default",
        fallbackEntityId: "minecraft:player",
        defaultAnimations: ["idle", "walk", "attack"]
      };
      return append("entities", "catalogEntries", record);
    }
    case 57: {
      const record: CustomMobDefinition = {
        ...base(id, `Custom Mob ${sequence}`, now),
        baseRigFamily: "generic",
        bones: [{ id: "root", parentId: null, pivot: [0, 0, 0], size: [1, 1, 1] }],
        sockets: [],
        textureAssetId: null,
        lodDistances: [24, 64, 128]
      };
      return append("entities", "customMobs", record);
    }
    case 58: {
      const record: EquipmentSet = {
        ...base(id, `Diamond Equipment ${sequence}`, now),
        targetRigFamily: "biped",
        slots: []
      };
      return append("entities", "equipmentSets", record);
    }
    case 59: {
      const record: SecondaryMotionProfile = {
        ...base(id, `Cape Motion ${sequence}`, now),
        targetId: "character_primary",
        chainBoneIds: ["cape_root"],
        stiffness: 0.55,
        damping: 0.2,
        gravity: [0, -9.81, 0],
        collisionRadius: 0.15,
        seed: 59
      };
      return append("entities", "secondaryMotionProfiles", record);
    }
    case 60: {
      const record: AttentionCue = {
        ...base(id, `Dialogue Attention ${sequence}`, now),
        characterId: "character_primary",
        targetId: null,
        targetPoint: [0, 1.6, 4],
        startFrame: 0,
        endFrame: 48,
        priority: 1,
        headWeight: 0.8,
        torsoWeight: 0.25
      };
      return append("entities", "attentionCues", record);
    }
    case 61: {
      const record: MobLocomotionProfile = {
        ...base(id, `Quadruped Gait ${sequence}`, now),
        rigFamily: "quadruped",
        family: "quadruped",
        gaitFrequency: 1.8,
        strideLength: 1.2,
        verticalAmplitude: 0.08,
        maximumSlopeDegrees: 35
      };
      return append("entities", "locomotionProfiles", record);
    }
    case 62: {
      const record: CombatSequence = {
        ...base(id, `Sword Exchange ${sequence}`, now),
        fps: 24,
        minimumReactionFrames: 3,
        beats: []
      };
      return append("entities", "combatSequences", record);
    }
    case 63: {
      const record: ParkourPath = {
        ...base(id, `Rooftop Chase ${sequence}`, now),
        targetId: "",
        nodes: [],
        maximumJumpDistance: 4.5,
        maximumClimbHeight: 2.5
      };
      return append("entities", "parkourPaths", record);
    }
    case 64: {
      const record: ActingBeat = {
        ...base(id, `Emotional Beat ${sequence}`, now),
        characterId: "character_primary",
        startFrame: 0,
        endFrame: 48,
        emotion: "neutral",
        intensity: 0.65,
        gazeTargetId: null,
        breathingRate: 0.25
      };
      return append("entities", "actingBeats", record);
    }
    case 65: {
      const record: NarrativeCrowdGroup = {
        ...base(id, `Spectator Group ${sequence}`, now),
        role: "spectator",
        memberIds: Array.from({ length: 12 }, (_, index) => `crowd_${sequence}_${index}`),
        leaderId: null,
        focusPoint: [0, 1, 0],
        actionCorridor: [[-2, 0, -6], [2, 3, 6]],
        seed: 65
      };
      return append("entities", "crowdGroups", record);
    }
    case 66: {
      const record: SetLayer = {
        ...base(id, `Set Layer ${sequence}`, now),
        worldFingerprint: "source-world-unselected",
        shotId: null,
        operations: []
      };
      return append("world", "setLayers", record);
    }
    case 67: {
      const record: DestructionEvent = {
        ...base(id, `Directed Destruction ${sequence}`, now),
        startFrame: 0,
        origin: [0, 0, 0],
        radius: 6,
        seed: 67,
        blockPositions: [],
        propagationFrames: 18
      };
      return append("world", "destructionEvents", record);
    }
    case 68: {
      const record: DebrisProfile = {
        ...base(id, `Stone Debris ${sequence}`, now),
        blockStatePattern: "minecraft:*stone*",
        piecesPerBlock: 3,
        dustPerBlock: 2,
        maximumPieces: 2048,
        visibilityDistance: 96
      };
      return append("world", "debrisProfiles", record);
    }
    case 69: {
      const record: RigidBodyRecord = {
        ...base(id, `Rigid Prop ${sequence}`, now),
        targetId: "prop_primary",
        mass: 1,
        position: [0, 2, 0],
        velocity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        restitution: 0.2,
        friction: 0.65,
        sleeping: false
      };
      return append("world", "rigidBodies", record);
    }
    case 70: {
      const record: FluidVolume = {
        ...base(id, `Water Volume ${sequence}`, now),
        kind: "water",
        boundsMin: [-4, 0, -4],
        boundsMax: [4, 2, 4],
        flowDirection: [1, 0, 0],
        flowSpeed: 0.5,
        surfaceBlockSize: 1
      };
      return append("world", "fluidVolumes", record);
    }
    case 71: {
      const record: CombustionSource = {
        ...base(id, `Fire Source ${sequence}`, now),
        position: [0, 0, 0],
        ignitionFrame: 0,
        durationFrames: 120,
        fuel: 1,
        spreadRadius: 4,
        smokeDensity: 0.55,
        seed: 71
      };
      return append("world", "combustionSources", record);
    }
    case 72: {
      const record: RedstoneGraph = {
        ...base(id, `Redstone Mechanism ${sequence}`, now),
        nodes: [
          { id: `${id}_source`, kind: "source", inputIds: [], delayFrames: 0, threshold: 0 },
          { id: `${id}_output`, kind: "lamp", inputIds: [`${id}_source`], delayFrames: 0, threshold: 1 }
        ],
        timelineOverrides: []
      };
      return append("world", "redstoneGraphs", record);
    }
    case 73: {
      const record: VehicleRecord = {
        ...base(id, `Minecart Ride ${sequence}`, now),
        kind: "minecart",
        driverId: null,
        passengerIds: [],
        path: [[0, 0, 0], [8, 0, 0]],
        speed: 4,
        banking: 0.15
      };
      return append("world", "vehicles", record);
    }
    case 74: {
      const record: WeatherSeasonPreset = {
        ...base(id, `Winter Storm ${sequence}`, now),
        season: "winter",
        rain: 0,
        snow: 0.75,
        storm: 0.35,
        fog: 0.45,
        wind: 0.65,
        accumulation: 0.4,
        colorTemperatureKelvin: 7200
      };
      return append("world", "weatherPresets", record);
    }
    case 75: {
      const record: BattleScenario = {
        ...base(id, `Battle Scenario ${sequence}`, now),
        fps: 24,
        maximumActiveEntities: 400,
        maximumEventsPerFrame: 128,
        seed: 75,
        waves: []
      };
      return append("world", "battleScenarios", record);
    }
    case 76: {
      const record: CinematicMaterialProfile = {
        ...base(id, `Cinematic Stone ${sequence}`, now),
        category: "stone",
        style: "vanillaPlus",
        baseColor: "#8b8b8b",
        roughness: 0.82,
        metallic: 0,
        reliefStrength: 0.18,
        emissionStrength: 0,
        transmission: 0,
        subsurface: 0,
        preservePixelEdges: true
      };
      return append("rendering", "materialProfiles", record);
    }
    case 77: {
      const record: ArtisticLightRecord = {
        ...base(id, `Key Light ${sequence}`, now),
        kind: "directional",
        color: "#fff4df",
        intensityLumens: 1500,
        exposureStops: 0,
        position: [6, 10, 4],
        direction: [-0.45, -1, -0.25],
        linkedObjectIds: [],
        excludedObjectIds: [],
        blockerIds: [],
        cookieAssetId: null,
        groupId: "shot_key"
      };
      return append("rendering", "lights", record);
    }
    case 78: {
      const record: VolumetricProfile = {
        ...base(id, `Atmosphere ${sequence}`, now),
        scope: "global",
        density: 0.08,
        anisotropy: 0.35,
        scatteringColor: "#d9e8ff",
        absorption: 0.06,
        shadowStrength: 0.7,
        vfxContribution: 0.5,
        previewSteps: 24,
        finalSteps: 96,
        maximumDifference: 0.08
      };
      return append("rendering", "volumetricProfiles", record);
    }
    case 79: {
      const record: SkyCloudProfile = {
        ...base(id, `Cinematic Sky ${sequence}`, now),
        style: "minecraft",
        startFrame: 0,
        endFrame: 240,
        startTimeOfDay: 0.25,
        endTimeOfDay: 0.5,
        cloudCoverage: 0.35,
        cloudAltitude: 128,
        cloudSpeed: [0.01, 0],
        starIntensity: 0.15,
        moonPhase: 0.5,
        continuityGroupId: "sky_main"
      };
      return append("rendering", "skyProfiles", record);
    }
    case 80: {
      const record: VfxNodeGraphRecord = {
        ...base(id, `Impact Graph ${sequence}`, now),
        version: 1,
        nodes: [
          { id: `${id}_spawn`, kind: "spawn", inputIds: [], parameters: { rate: 16 } },
          { id: `${id}_motion`, kind: "motion", inputIds: [`${id}_spawn`], parameters: { speed: 3 } },
          { id: `${id}_appearance`, kind: "appearance", inputIds: [`${id}_motion`], parameters: { size: 0.2 } },
          { id: `${id}_output`, kind: "output", inputIds: [`${id}_appearance`], parameters: {} }
        ],
        exposedParameters: ["rate", "speed", "size"],
        subgraphIds: [],
        maximumParticles: 2048,
        maximumEventsPerFrame: 64,
        seed: 80
      };
      return append("rendering", "vfxGraphs", record);
    }
    case 81: {
      const record: MinecraftEffectPreset = {
        ...base(id, `Portal Effect ${sequence}`, now),
        kind: "portal",
        style: "film",
        graphId: `ultra_80_${sequence}`,
        eventName: "minecraft.portal.activate",
        maximumParticles: 1024,
        fallbackPresetId: "nativeExplosion",
        tested: true
      };
      return append("rendering", "minecraftEffects", record);
    }
    case 82: {
      const record: CompositingGraphRecord = {
        ...base(id, `Shot Composite ${sequence}`, now),
        scope: "shot",
        targetId: "shot_main",
        nodes: [
          { id: `${id}_input`, kind: "input", inputIds: [], parameters: { pass: "beauty" } },
          { id: `${id}_glow`, kind: "glow", inputIds: [`${id}_input`], parameters: { threshold: 1, radius: 4 } },
          { id: `${id}_output`, kind: "output", inputIds: [`${id}_glow`], parameters: {} }
        ],
        cacheEnabled: true,
        comparisonMode: "split",
        requiredPasses: ["beauty", "depth", "objectId"]
      };
      return append("rendering", "compositingGraphs", record);
    }
    case 83: {
      const record: ColorManagementProfile = {
        ...base(id, `SDR Film Look ${sequence}`, now),
        workingSpace: "linear-srgb",
        displayTransform: "rec709",
        look: "filmic",
        lutAssetId: null,
        exposureStops: 0,
        contrast: 1.05,
        saturation: 1,
        peakNits: 100,
        gamutCompression: true
      };
      return append("rendering", "colorProfiles", record);
    }
  }
  throw new Error(`Unsupported Ultra phase ${phase}.`);
}

export type UltraProjectDataUpdater = (data: UltraProjectData) => UltraProjectData;

type UltraArrayKey =
  | keyof UltraProjectData["performance"]
  | keyof UltraProjectData["directing"]
  | keyof UltraProjectData["entities"]
  | keyof UltraProjectData["world"]
  | keyof UltraProjectData["rendering"];

function append(
  arc: "performance" | "directing" | "entities" | "world" | "rendering",
  key: UltraArrayKey,
  record: UltraBaseRecord
): UltraProjectDataUpdater {
  return (data) => {
    const currentArc = data[arc] as unknown as Record<string, UltraBaseRecord[]>;
    const current = currentArc[key as string] ?? [];
    const phase = Number(record.id.split("_")[1]) as UltraPhaseNumber;
    const nextCount = current.length + 1;
    return {
      ...data,
      [arc]: {
        ...data[arc],
        [key]: [...current, record]
      },
      phaseStates: {
        ...data.phaseStates,
        [String(phase)]: {
          ...data.phaseStates[String(phase)],
          phase,
          status: "configured",
          artifactCount: nextCount,
          validationErrors: [],
          validationWarnings: [],
          updatedAt: record.updatedAt
        }
      },
      activeArc: arc,
      updatedAt: record.updatedAt
    } as UltraProjectData;
  };
}

function appendCapability(record: UltraCapabilityRecord): UltraProjectDataUpdater {
  return (data) => {
    const phase = record.phase;
    const current = data.capabilities.filter((candidate) => candidate.phase === phase);
    const nextCount = current.length + 1;
    return {
      ...data,
      capabilities: [...data.capabilities, record],
      phaseStates: {
        ...data.phaseStates,
        [String(phase)]: {
          ...data.phaseStates[String(phase)],
          phase,
          status: "configured",
          artifactCount: nextCount,
          validationErrors: [],
          validationWarnings: [],
          updatedAt: record.updatedAt
        }
      },
      activeArc: record.arc,
      updatedAt: record.updatedAt
    };
  };
}
