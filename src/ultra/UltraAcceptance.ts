import { createDefaultUltraProjectData, createUltraPhaseArtifact } from "./UltraDefaults";
import { ULTRA_PHASE_NUMBERS } from "./UltraPhaseRegistry";
import { buildUltraDependencyPlan, runUltraCapabilityPhaseTest } from "./capabilities/UltraCapabilityEngine";
import type { UltraCapabilityRecord } from "./capabilities/UltraCapabilityTypes";
import { runUltraFoundationAcceptance } from "./UltraFoundationAcceptance";
import { getUltraPhaseRecords, markUltraValidationState, removeUltraPhaseRecord, sanitizeUltraProjectData, updateUltraPhaseRecordMetadata, validateUltraProjectData } from "./UltraSerializer";
import {
  applyCurveTool,
  detectCurveDiscontinuities,
  evaluateAnimationGraph,
  evaluateCorrectiveRules,
  generateLocomotionSamples,
  normalizeMocapFrame,
  retargetPose,
  sampleAnimationLayerWeight,
  sampleFacialRig,
  searchPerformancePresets,
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
import type { DestructionEvent, UltraProjectData } from "./UltraTypes";

export interface UltraAcceptanceResult {
  phaseCount: number;
  configuredPhases: number;
  validatedPhases: number;
  assertions: number;
  serializedBytes: number;
  phaseTests: number;
  foundationTests: number;
  phaseContractAssertions: number;
}

export function runUltraAcceptance(): UltraAcceptanceResult {
  let assertions = 0;
  const assert = (condition: unknown, message: string): void => {
    assertions += 1;
    if (!condition) throw new Error(`Ultra acceptance failed: ${message}`);
  };

  let data = createDefaultUltraProjectData("2026-07-30T00:00:00.000Z");
  for (const phase of ULTRA_PHASE_NUMBERS) {
    data = createUltraPhaseArtifact(phase, 1, "2026-07-30T00:00:00.000Z")(data);
    assert(getUltraPhaseRecords(data, phase).length === 1, `phase ${phase} factory did not create exactly one artifact`);
  }
  assert(Object.keys(data.phaseStates).length === ULTRA_PHASE_NUMBERS.length, "phase state registry does not cover every Ultra phase");

  const report = validateUltraProjectData(data);
  assert(report.valid, `default Ultra data should be valid: ${report.issues.map((issue) => issue.message).join(" | ")}`);
  assert(report.configuredPhases === ULTRA_PHASE_NUMBERS.length, "all Ultra phases should be configured");
  data = markUltraValidationState(data, report, "2026-07-30T00:01:00.000Z");
  assert(Object.values(data.phaseStates).every((state) => state.status === "validated"), "all default phase states should validate");
  const phase36Record = getUltraPhaseRecords(data, 36)[0];
  const metadataUpdated = updateUltraPhaseRecordMetadata(data, 36, phase36Record.id, {
    name: "  Reviewed face  ",
    notes: "n".repeat(3000),
    tags: ["hero", "hero", " dialogue "]
  }, "2026-07-30T00:01:30.000Z");
  const updatedRecord = getUltraPhaseRecords(metadataUpdated, 36)[0];
  assert(updatedRecord.name === "Reviewed face" && updatedRecord.notes.length === 2048, "Ultra metadata editing did not apply bounds");
  assert(JSON.stringify(updatedRecord.tags) === JSON.stringify(["hero", "dialogue"]), "Ultra metadata tags were not normalized");
  const phase84Record = getUltraPhaseRecords(metadataUpdated, 84)[0];
  const capabilityMetadataUpdated = updateUltraPhaseRecordMetadata(metadataUpdated, 84, phase84Record.id, {
    name: "Reviewed offline renderer",
    tags: ["render", "final"]
  }, "2026-07-30T00:01:40.000Z");
  const updatedCapability = getUltraPhaseRecords(capabilityMetadataUpdated, 84)[0] as UltraCapabilityRecord;
  assert(runUltraCapabilityPhaseTest(updatedCapability).passed, "phase 84 metadata edit invalidated its capability fingerprint");
  const dependencyPlan = buildUltraDependencyPlan([84]);
  assert(dependencyPlan.at(-1) === 84 && dependencyPlan.includes(83), "phase 84 dependency plan omitted its legacy dependency");
  const removedCapability = removeUltraPhaseRecord(data, 600, getUltraPhaseRecords(data, 600)[0].id, "2026-07-30T00:01:50.000Z");
  assert(getUltraPhaseRecords(removedCapability, 600).length === 0 && removedCapability.phaseStates["600"].status === "planned", "phase 600 capability removal did not reset its phase state");

  exercisePerformance(data, assert);
  exerciseDirecting(data, assert);
  exerciseEntities(data, assert);
  exerciseWorld(data, assert);
  exerciseRendering(data, assert);

  let phaseTests = 0;
  let phaseContractAssertions = 0;
  for (const phase of ULTRA_PHASE_NUMBERS) {
    const record = getUltraPhaseRecords(data, phase)[0];
    if (phase >= 84) {
      const result = runUltraCapabilityPhaseTest(record as UltraCapabilityRecord);
      assert(result.passed, `phase ${phase} capability test ${result.testId} failed: ${result.errors.join(" | ")}`);
      phaseContractAssertions += result.assertions;
    } else {
      assert(!report.issues.some((issue) => issue.phase === phase && issue.severity === "error"), `phase ${phase} legacy validation failed`);
      phaseContractAssertions += 1;
    }
    phaseTests += 1;
  }

  const foundationResults = runUltraFoundationAcceptance();
  for (const result of foundationResults) {
    assert(result.passed, `phase ${result.phase} source foundation failed: ${result.message}`);
  }

  const invalidDomainData: UltraProjectData = {
    ...data,
    performance: {
      ...data.performance,
      contactConstraints: [{ ...data.performance.contactConstraints[0], maximumReach: 0 }]
    },
    rendering: {
      ...data.rendering,
      vfxGraphs: [{
        ...data.rendering.vfxGraphs[0],
        nodes: [
          { id: "cycle_a", kind: "spawn", inputIds: ["cycle_b"], parameters: {} },
          { id: "cycle_b", kind: "output", inputIds: ["cycle_a"], parameters: {} }
        ]
      }]
    }
  };
  const invalidDomainReport = validateUltraProjectData(invalidDomainData);
  assert(!invalidDomainReport.valid, "domain-invalid Ultra data should fail validation");
  assert(invalidDomainReport.issues.some((issue) => issue.phase === 38), "phase 38 invalid contact was not reported");
  assert(invalidDomainReport.issues.some((issue) => issue.phase === 80), "phase 80 graph cycle was not reported");

  const serialized = JSON.stringify(data);
  const roundTrip = sanitizeUltraProjectData(JSON.parse(serialized), "2026-07-30T00:02:00.000Z");
  assert(JSON.stringify(roundTrip) === serialized, "Ultra subdocument should round-trip exactly");

  const hostile = sanitizeUltraProjectData({
    schemaVersion: 99,
    activeArc: "invalid",
    phaseStates: { 36: { status: "validated" } },
    capabilities: [{ id: "unknown", name: "Unknown", enabled: true, notes: "", tags: [], createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z", phase: 9999 }],
    performance: {
      facialProfiles: [],
      correctiveRules: [{ id: "../../bad", name: "x".repeat(10_000), enabled: true, createdAt: "bad", updatedAt: "bad", channels: [Infinity] }]
    }
  }, "2026-07-30T00:03:00.000Z");
  assert(hostile.schemaVersion === 1, "hostile schema should normalize to version 1");
  assert(hostile.activeArc === "performance", "invalid active arc should use default");
  assert(hostile.performance.correctiveRules[0]?.id === "ultra_record_0", "unsafe record id should be replaced");
  assert(hostile.phaseStates["36"].status !== "validated", "empty or invalid phase must not remain falsely validated");
  assert(hostile.capabilities.length === 0, "unknown capability phases must be discarded during sanitization");
  const boundedCapabilities = sanitizeUltraProjectData({
    capabilities: Array.from({ length: 513 }, (_, index) => ({
      id: `bounded_${index}`, name: `Bounded ${index}`, enabled: true, notes: "", tags: [],
      createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z", phase: 84
    }))
  }, "2026-07-30T00:04:00.000Z");
  assert(boundedCapabilities.capabilities.length === 512, "capability sanitization exceeded the 512 records-per-phase bound");

  return {
    phaseCount: ULTRA_PHASE_NUMBERS.length,
    configuredPhases: report.configuredPhases,
    validatedPhases: report.validatedPhases,
    assertions,
    serializedBytes: new TextEncoder().encode(serialized).byteLength,
    phaseTests,
    foundationTests: foundationResults.length,
    phaseContractAssertions
  };
}

function exercisePerformance(data: UltraProjectData, assert: (condition: unknown, message: string) => void): void {
  const face = data.performance.facialProfiles[0];
  const faceSample = sampleFacialRig(face, { viseme: "A", emotion: "joy", visemeWeight: 1, emotionWeight: 0.5 });
  assert(faceSample.jawOpen > 0.6 && faceSample.mouthSmile > 0.2, "phase 36 facial sample is not blended");

  const corrective = evaluateCorrectiveRules(data.performance.correctiveRules, { left_arm: [0, 0, 90] });
  assert(corrective.length === 1 && corrective[0].jointFill > 0, "phase 37 corrective rule is not active");

  const contact = solveContactConstraint(data.performance.contactConstraints[0], [0, 0, 0], [1, 0, 0]);
  assert(contact.reachable && contact.residual < 1e-8, "phase 38 reachable contact did not solve exactly");
  const unreachable = solveContactConstraint({ ...data.performance.contactConstraints[0], maximumReach: 0.5 }, [0, 0, 0], [2, 0, 0]);
  assert(!unreachable.reachable && unreachable.residual > 1, "phase 38 unreachable target was not reported");

  const layer = data.performance.animationLayers[0];
  assert(sampleAnimationLayerWeight(layer, 0, 48) === 0, "phase 39 fade-in should begin at zero");
  assert(sampleAnimationLayerWeight(layer, 24, 48) > 0.9, "phase 39 layer should reach full weight");

  const profile = {
    ...data.performance.retargetProfiles[0],
    mappings: [{ sourceBoneId: "arm", targetBoneId: "left_arm", axisMap: [0, 2, 1] as const, axisSigns: [1, -1, 1] as const, rotationOffsetDegrees: [0, 5, 0] as const, confidence: 0.9 }]
  };
  const retargeted = retargetPose(profile, { arm: [10, 20, 30] });
  assert(retargeted[0]?.targetBoneId === "left_arm" && retargeted[0].rotationDegrees[1] === -25, "phase 40 retarget mapping is incorrect");

  const locomotion = generateLocomotionSamples(data.performance.locomotionPlans[0]);
  assert(locomotion.length > 2, "phase 41 locomotion did not generate samples");
  assert(equalVector(locomotion.at(-1)!.position, data.performance.locomotionPlans[0].waypoints.at(-1)!.position), "phase 41 locomotion did not reach final waypoint");

  const presets = searchPerformancePresets(data.performance.performancePresets, "dialogue", "neutral");
  assert(presets.length === 1, "phase 42 performance search failed");

  const mocap = normalizeMocapFrame(
    { frame: 4, joints: [{ jointId: "head", position: [0, 1, 0], confidence: 0.4 }] },
    [{ frame: 4, joints: [{ jointId: "head", position: [0, 1.2, 0], confidence: 1 }] }]
  );
  assert(mocap.joints[0].position[1] === 1.2 && mocap.joints[0].confidence === 1, "phase 43 manual mocap correction was not applied");

  const curve = applyCurveTool([{ frame: 0, value: 0 }, { frame: 1, value: 10 }, { frame: 2, value: 0 }], data.performance.curvePresets[0]);
  assert(curve[1].value < 10, "phase 44 curve cleaner did not reduce jitter");
  assert(detectCurveDiscontinuities([{ frame: 0, value: 0 }, { frame: 1, value: 4 }], 2).length === 1, "phase 44 discontinuity detection failed");

  const graph = data.performance.animationGraphs[0];
  const runtime = evaluateAnimationGraph(graph, null, { speed: 1 }, 0);
  assert(runtime.transitionId !== null, "phase 45 state graph did not begin transition");
  const completed = evaluateAnimationGraph(graph, runtime, { speed: 1 }, 10);
  assert(completed.stateId === graph.states[1].id, "phase 45 state graph did not complete transition");
}

function exerciseDirecting(data: UltraProjectData, assert: (condition: unknown, message: string) => void): void {
  const camera = calculatePhysicalCamera(data.directing.cameraProfiles[0]);
  assert(camera.horizontalFovDegrees > camera.verticalFovDegrees && camera.shutterSeconds > 0, "phase 46 physical camera plan is invalid");

  const rigSample = sampleCameraRig(data.directing.cameraRigs[0], 0.5, [4, 1, -4]);
  assert(rigSample.position[0] > 1.5 && rigSample.position[0] < 2.5, "phase 47 camera rig did not sample path midpoint");

  const findings = evaluateComposition(data.directing.compositionChecks[0], [{ id: data.directing.compositionChecks[0].subjectIds[0], screenPosition: [1 / 3, 1 / 3], screenBounds: [0.25, 0.2, 0.4, 0.8] }]);
  assert(findings[0].severity === "info", "phase 48 composition assistant rejected an exact thirds point");

  const continuity = checkContinuity({ ...data.directing.continuityAxes[0], shotIds: ["a", "b"] }, [
    { shotId: "a", cameraPosition: [0, 2, 4], subjectPosition: [0, 0, 0], gazeDirection: [1, 0, 0] },
    { shotId: "b", cameraPosition: [0, 2, -4], subjectPosition: [0, 0, 0], gazeDirection: [-1, 0, 0] }
  ]);
  assert(continuity[1].crossedAxis && continuity[1].gazeReversal, "phase 49 continuity checker missed an axis crossing");

  const focus = sampleFocusCue(data.directing.focusCues[0], 12);
  assert(focus.distance > 3 && focus.distance < 12, "phase 50 focus cue did not interpolate");

  const blocking = createBlockingSnapshot("blocking", "scene", 12, { hero: { position: [1, 2, 3], rotation: [0, -0, 0], scale: [1, 1, 1] } }, "2026-07-30T00:00:00.000Z");
  assert(blocking.entityTransforms.hero.rotation[1] === 0, "phase 51 blocking snapshot did not canonicalize values");

  const storyboard = linkStoryboardToShot({ ...data.directing.storyboardLinks[0], shotId: "shot", storyboardCardId: "card" }, new Set(["shot"]), new Set(["card"]));
  assert(storyboard.valid, "phase 52 storyboard link should validate");

  const take = chooseActiveTake({ ...data.directing.takeGroups[0], takeIds: ["t1", "t2"], activeTakeId: "missing", ratings: { t1: 2, t2: 5 } });
  assert(take === "t2", "phase 53 take selection did not use rating fallback");

  const annotations = filterOpenAnnotations([{ ...data.directing.annotations[0], shotId: "shot", revision: 2, frame: 8 }], "shot", 2, 8);
  assert(annotations.length === 1, "phase 54 annotation filtering failed");

  const sequence = assembleCinematicSequence({ ...data.directing.sequences[0], clips: [
    { id: "c1", shotId: "s1", startFrame: 0, sourceInFrame: 0, sourceOutFrame: 23, transitionFrames: 0 },
    { id: "c2", shotId: "s2", startFrame: 20, sourceInFrame: 0, sourceOutFrame: 23, transitionFrames: 4 }
  ] });
  assert(sequence.valid && sequence.durationFrames === 44 && sequence.overlaps[0].frames === 4, "phase 55 sequence assembly is incorrect");
}

function exerciseEntities(data: UltraProjectData, assert: (condition: unknown, message: string) => void): void {
  const catalog = resolveEntityCatalog(data.entities.catalogEntries, "minecraft:zombie", 4000);
  assert(catalog.compatible && catalog.resolvedId === "minecraft:zombie", "phase 56 entity catalog resolution failed");

  const mob = validateCustomMob(data.entities.customMobs[0]);
  assert(mob.valid && mob.boneCount === 1, "phase 57 custom mob should validate");

  const equipment = resolveEquipment({ ...data.entities.equipmentSets[0], slots: [
    { slotId: "hand", assetId: "sword", boneId: "right_arm", offset: [0, 0, 0], rotation: [0, 0, 0] },
    { slotId: "hand", assetId: "axe", boneId: "right_arm", offset: [0, 0, 0], rotation: [0, 0, 0] }
  ] });
  assert(equipment.conflicts.length === 1 && equipment.validSlots.length === 0, "phase 58 duplicate equipment slot was not detected");

  const secondary = stepSecondaryMotion({ ...data.entities.secondaryMotionProfiles[0], chainBoneIds: ["cape"] }, [[0, 0, 0]], [[0, 0, 0]], [[0, 1, 0]], 1 / 24);
  assert(secondary.positions.length === 1 && secondary.positions[0].every(Number.isFinite), "phase 59 secondary motion produced invalid sample");

  const attention = resolveAttention([{ ...data.entities.attentionCues[0], characterId: "hero" }], "hero", 12);
  assert(attention !== null && attention.headWeight > 0, "phase 60 attention cue did not resolve");

  const gait = sampleMobLocomotion(data.entities.locomotionProfiles[0], 0.25, 2);
  assert(Number.isFinite(gait.strideOffset) && Number.isFinite(gait.verticalOffset), "phase 61 mob gait is invalid");

  const combat = validateCombatSequence({ ...data.entities.combatSequences[0], beats: [
    { id: "a", frame: 4, actorId: "hero", targetId: "enemy", action: "contact", weaponSlotId: "hand" },
    { id: "b", frame: 8, actorId: "enemy", targetId: "hero", action: "reaction", weaponSlotId: null }
  ] });
  assert(combat.valid, `phase 62 combat sequence should validate: ${combat.errors.join(" | ")}`);

  const parkour = validateParkourPath({ ...data.entities.parkourPaths[0], nodes: [
    { id: "a", position: [0, 0, 0], action: "run", surfaceNormal: [0, 1, 0] },
    { id: "b", position: [3, 1, 0], action: "jump", surfaceNormal: [0, 1, 0] }
  ] });
  assert(parkour.valid && parkour.distance > 3, "phase 63 parkour validation failed");

  const acting = synchronizeActingBeat(data.entities.actingBeats[0], 24);
  assert(acting !== null && acting.facialWeight > 0 && acting.bodyWeight > 0, "phase 64 acting synchronization failed");

  const crowd = assignNarrativeCrowd({ ...data.entities.crowdGroups[0], memberIds: Array.from({ length: 200 }, (_, index) => `member_${index}`) });
  assert(crowd.length === 200 && crowd.every((assignment) => Number.isFinite(assignment.targetPoint[0])), "phase 65 crowd assignment failed");
}

function exerciseWorld(data: UltraProjectData, assert: (condition: unknown, message: string) => void): void {
  const set = applySetLayers([{ ...data.world.setLayers[0], operations: [
    { x: 0, y: 0, z: 0, operation: "add", blockState: "minecraft:stone" },
    { x: 0, y: 0, z: 0, operation: "replace", blockState: "minecraft:gold_block" }
  ] }]);
  assert(set.length === 1 && set[0].blockState === "minecraft:gold_block", "phase 66 set layer precedence failed");

  const destructionEvent: DestructionEvent = { ...data.world.destructionEvents[0], blockPositions: [[0, 0, 0], [2, 0, 0], [4, 0, 0]] };
  const destructionA = scheduleDestruction(destructionEvent);
  const destructionB = scheduleDestruction(destructionEvent);
  assert(JSON.stringify(destructionA) === JSON.stringify(destructionB), "phase 67 destruction is not deterministic");

  const debris = generateDebris(destructionEvent, { ...data.world.debrisProfiles[0], maximumPieces: 5 });
  assert(debris.length === 5, "phase 68 debris budget is not enforced");

  const rigid = stepRigidBody(data.world.rigidBodies[0], 1 / 24);
  assert(rigid.position.every(Number.isFinite) && rigid.velocity.every(Number.isFinite), "phase 69 rigid-body step is invalid");

  const fluid = sampleStylizedFluid(data.world.fluidVolumes[0], [0, 2, 0], 1);
  assert(Math.abs(fluid.normal[1]) > 0.9 && fluid.position.every(Number.isFinite), "phase 70 fluid surface sample is invalid");

  const fireA = sampleCombustion(data.world.combustionSources[0], 30);
  const fireB = sampleCombustion(data.world.combustionSources[0], 30);
  assert(fireA.active && JSON.stringify(fireA) === JSON.stringify(fireB), "phase 71 combustion is not deterministic");

  const redstone = evaluateRedstoneGraph(data.world.redstoneGraphs[0], 12);
  assert(redstone.powers[`${data.world.redstoneGraphs[0].id}_output`] > 0, "phase 72 redstone output did not activate");

  const vehicle = sampleVehicle({ ...data.world.vehicles[0], passengerIds: ["a", "b"] }, 0.5);
  assert(vehicle.passengerPositions.length === 2 && vehicle.position[0] > 3, "phase 73 vehicle path or passenger attachment failed");

  const weather = sampleWeather(data.world.weatherPresets[0], { ...data.world.weatherPresets[0], snow: 0, rain: 1, colorTemperatureKelvin: 4200 }, 0.5);
  assert(weather.rain > 0 && weather.snow > 0, "phase 74 weather transition failed");

  const battle = scheduleBattle({ ...data.world.battleScenarios[0], waves: [
    { id: "wave", startFrame: 0, groupIds: ["g1", "g2"], projectileCount: 12, destructionEventIds: ["d1"], weatherPresetId: "w1" }
  ] });
  assert(battle.valid && battle.events.length === 16, `phase 75 battle schedule failed: ${battle.errors.join(" | ")}`);
}

function exerciseRendering(data: UltraProjectData, assert: (condition: unknown, message: string) => void): void {
  const material = evaluateMaterialProfile(data.rendering.materialProfiles[0], 1);
  assert(material.readable && material.pixelEdgeRetention >= 0.65, "phase 76 material lost Minecraft pixel readability");
  const darkMaterial = evaluateMaterialProfile({ ...data.rendering.materialProfiles[0], emissionStrength: 1 }, 0);
  assert(darkMaterial.readable, "phase 76 emissive material should remain readable without incident light");

  const light = data.rendering.lights[0];
  const linked = evaluateLightContribution({ ...light, linkedObjectIds: ["hero"] }, "hero");
  const unlinked = evaluateLightContribution({ ...light, linkedObjectIds: ["hero"] }, "set");
  const blocked = evaluateLightContribution({ ...light, blockerIds: ["flag"] }, "hero", ["flag"]);
  assert(linked.intensity > 0 && unlinked.intensity === 0 && blocked.intensity === 0, "phase 77 light linking or blockers failed");

  const volume = data.rendering.volumetricProfiles[0];
  const preview = sampleVolumetricProfile(volume, 12, "preview");
  const final = sampleVolumetricProfile(volume, 12, "final");
  assert(preview.steps < final.steps && preview.transmittance === final.transmittance, "phase 78 preview/final volumetrics diverged physically");
  assert(compareVolumetricQualities(volume, 12) <= volume.maximumDifference, "phase 78 preview/final volumetric tolerance was exceeded");

  const skyA = sampleSkyProfile(data.rendering.skyProfiles[0], 48);
  const skyB = sampleSkyProfile(data.rendering.skyProfiles[0], 48);
  const skyEnd = sampleSkyProfile(data.rendering.skyProfiles[0], 240);
  assert(JSON.stringify(skyA) === JSON.stringify(skyB), "phase 79 sky sample is not deterministic");
  assert(skyEnd.timeOfDay === data.rendering.skyProfiles[0].endTimeOfDay, "phase 79 sky did not reach its continuity endpoint");

  const graph = data.rendering.vfxGraphs[0];
  const graphValidation = validateVfxGraph(graph);
  assert(graphValidation.valid && graphValidation.orderedNodeIds.length === graph.nodes.length, "phase 80 VFX graph did not validate");
  const vfxA = evaluateVfxGraph(graph, 24, { rate: 32 });
  const vfxB = evaluateVfxGraph(graph, 24, { rate: 32 });
  assert(JSON.stringify(vfxA) === JSON.stringify(vfxB) && vfxA.liveParticles <= graph.maximumParticles, "phase 80 VFX evaluation is not deterministic or bounded");
  const cyclic = validateVfxGraph({ ...graph, nodes: [
    { id: "a", kind: "spawn", inputIds: ["b"], parameters: {} },
    { id: "b", kind: "output", inputIds: ["a"], parameters: {} }
  ] });
  assert(!cyclic.valid && cyclic.errors.includes("GRAPH_CYCLE"), "phase 80 VFX graph cycle was not rejected");

  const effect = evaluateMinecraftEffect(data.rendering.minecraftEffects[0], "minecraft.portal.activate", new Set([graph.id]));
  const fallback = evaluateMinecraftEffect({ ...data.rendering.minecraftEffects[0], graphId: "missing", fallbackPresetId: "safe" }, "minecraft.portal.activate", new Set());
  assert(effect.active && effect.graphId === graph.id && effect.particleBudget > 0, "phase 81 Minecraft effect did not bind to its event");
  assert(fallback.graphId === "" && fallback.fallbackPresetId === "safe", "phase 81 missing graph did not expose its fallback");

  const composite = data.rendering.compositingGraphs[0];
  const compositeValidation = validateCompositingGraph(composite);
  assert(compositeValidation.valid && compositeValidation.orderedNodeIds.length === composite.nodes.length, "phase 82 compositing graph did not validate");
  const compositeCycle = validateCompositingGraph({ ...composite, nodes: [
    { id: "a", kind: "input", inputIds: ["b"], parameters: { pass: "beauty" } },
    { id: "b", kind: "output", inputIds: ["a"], parameters: {} }
  ] });
  assert(!compositeCycle.valid, "phase 82 compositing cycle was not rejected");

  const color = transformColor(data.rendering.colorProfiles[0], [0.18, 0.5, 1]);
  const hdr = transformColor({ ...data.rendering.colorProfiles[0], displayTransform: "rec2020-pq", peakNits: 1000 }, [1, 1, 1]);
  const scopes = calculateColorScopes([[0, 0, 0], [0.18, 0.5, 1], [1, 1, 1]], 16);
  assert(color.rgb.every(Number.isFinite) && color.luminanceNits > 0, "phase 83 SDR color transform is invalid");
  assert(hdr.luminanceNits > color.luminanceNits, "phase 83 HDR transform did not use the larger delivery range");
  assert(scopes.histogram.reduce((sum, count) => sum + count, 0) === 3 && scopes.waveform.length === 3, "phase 83 color scopes lost samples");
}

function equalVector(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => Math.abs(value - b[index]) < 1e-8);
}
