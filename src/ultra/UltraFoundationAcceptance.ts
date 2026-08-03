import {
  createAovManifest,
  createBokehKernel,
  createDenoisePlan,
  createObjectMaskManifest,
  createOfflineRenderPlan,
  createRenderCheckpoint,
  createSampleSequence,
  distributeRenderTiles,
  estimateRenderMemoryMb,
  normalizeRenderQuality,
  resolveAdaptiveSamples,
  resumeRenderPlan,
  sampleMotionBlurSegments,
  type UltraRenderQualityProfile
} from "./final/UltraFinalRenderEngine";
import {
  assignMaterial,
  createLodPlan,
  diagnoseTopology,
  evaluateGeometryNodes,
  evaluateModelingStack,
  instantiateNodeGroup,
  scatterDeterministic,
  snapModelPoint,
  updateSelectionSet,
  validateModifierGraph,
  type UltraGeometryNode,
  type UltraModelPoint
} from "./modeling/UltraModelingEngine";
import {
  applyPoseAsset,
  cleanAnimationCurve,
  evaluateConstraintStack,
  evaluateMorphChannels,
  evaluateSafeDriver,
  listDopeSheetKeys,
  retimeAnimationKeys,
  sampleAnimationCurve,
  sampleNlaStrips,
  switchIkFk
} from "./animation/UltraAnimationWorkflowEngine";
import {
  conformEditorial,
  createInterchangeEvents,
  createProxyPlan,
  mixAudioBus,
  relinkOfflineMedia,
  sampleTransition,
  synchronizeMulticam,
  validateCaptionCues,
  validateEditorialTimeline,
  validateMasteringTimeline,
  type UltraEditorialClip
} from "./editing/UltraEditingWorkflowEngine";
import {
  assignRenderFarmJobs,
  buildDependencyOrder,
  calculateProductionDashboard,
  compareReviewVersions,
  indexProductionAssets,
  packageCollaborationAssets,
  resolveWorkspaceTemplate,
  searchCommandPalette,
  searchProductionAssets,
  validateBatchOperations,
  validateReleaseHandoff,
  type UltraProductionAsset
} from "./production/UltraProductionWorkflowEngine";
import type { UltraPhaseNumber } from "./UltraPhaseRegistry";

export interface UltraFoundationTestResult {
  phase: UltraPhaseNumber;
  passed: boolean;
  message: string;
}

export function runUltraFoundationAcceptance(): UltraFoundationTestResult[] {
  const results: UltraFoundationTestResult[] = [];
  const test = (phase: UltraPhaseNumber, condition: unknown, message: string): void => {
    results.push({ phase, passed: Boolean(condition), message });
  };

  const quality: UltraRenderQualityProfile = {
    width: 128,
    height: 96,
    startFrame: 1,
    endFrame: 2,
    samples: 64,
    adaptiveThreshold: 0.2,
    tileSize: 64,
    workerCount: 2,
    seed: 84
  };
  const normalized = normalizeRenderQuality({ ...quality, width: -1, samples: 0 });
  test(84, normalized.width === 16 && normalized.samples === 1, "render quality normalization failed");
  const plan = createOfflineRenderPlan(quality);
  test(85, plan.length === 8 && plan.every((tile) => tile.width > 0 && tile.height > 0), "offline render planning failed");
  const samplesA = createSampleSequence(8, 42);
  const samplesB = createSampleSequence(8, 42);
  test(86, JSON.stringify(samplesA) === JSON.stringify(samplesB) && samplesA.length === 8, "sample sequence is not deterministic");
  test(87, resolveAdaptiveSamples(100, 0.5, 0.2) >= 1 && resolveAdaptiveSamples(100, 0.5, 0.2) <= 100, "adaptive sampling escaped bounds");
  const checkpoint = createRenderCheckpoint(plan, [plan[0].id]);
  test(88, resumeRenderPlan(plan, checkpoint).length === plan.length - 1 && checkpoint.nextTileId !== plan[0].id, "render checkpoint resume failed");
  test(89, createDenoisePlan(["diffuse"], true).includes("motionVector"), "denoise pass plan is incomplete");
  const blur = sampleMotionBlurSegments(180, 4);
  test(90, blur.length === 4 && blur[0] < blur.at(-1)!, "motion blur segment sampling failed");
  const bokeh = createBokehKernel(6, 30);
  test(91, bokeh.length === 6 && bokeh.every(([x, y]) => Number.isFinite(x + y)), "bokeh kernel is invalid");
  const mask = createObjectMaskManifest(["hero", "set", "hero"]);
  test(92, Object.keys(mask).length === 2 && mask.hero !== mask.set, "object mask manifest failed");
  test(93, createAovManifest(["cryptomatte", "beauty"]).filter((pass) => pass === "beauty").length === 1, "AOV manifest deduplication failed");
  const workers = distributeRenderTiles(plan, 2);
  test(94, workers.length === 2 && workers.flat().length === plan.length, "render tile distribution lost work");
  test(95, estimateRenderMemoryMb(quality, 4) > 0, "render memory estimate is invalid");

  const points: UltraModelPoint[] = [
    { id: "a", position: [0, 0, 0], material: "stone", selected: true },
    { id: "b", position: [1.25, 0, 0], material: "stone", selected: false }
  ];
  const modeled = evaluateModelingStack(points, [{ id: "move", kind: "translate", values: [1, 2, 3], enabled: true }]);
  test(96, modeled[0].position[0] === 1 && modeled[0].position[2] === 3, "modeling stack transform failed");
  test(97, snapModelPoint(points[1], 1).position[0] === 1, "block snapping failed");
  test(98, validateModifierGraph([{ id: "x", kind: "scale", values: [1], enabled: true }, { id: "x", kind: "scale", values: [1], enabled: true }]).includes("MODIFIER_ID_DUPLICATE"), "modifier graph validation missed a duplicate");
  const nodes: UltraGeometryNode[] = [
    { id: "input", kind: "input", inputIds: [], parameters: {} },
    { id: "scatter", kind: "scatter", inputIds: ["input"], parameters: { density: 3 } },
    { id: "output", kind: "output", inputIds: ["scatter"], parameters: {} }
  ];
  const geometry = evaluateGeometryNodes(nodes, 2, 99);
  test(99, geometry.count === 6 && geometry.orderedNodeIds.at(-1) === "output", "geometry node evaluation failed");
  test(100, instantiateNodeGroup(nodes, "group").every((node) => node.id.startsWith("group:")), "node group instantiation failed");
  const scatterA = scatterDeterministic(5, [10, 10, 10], 101);
  test(101, JSON.stringify(scatterA) === JSON.stringify(scatterDeterministic(5, [10, 10, 10], 101)), "procedural scatter is not deterministic");
  test(102, updateSelectionSet(points, new Set(["b"]), "replace")[1].selected, "selection set update failed");
  test(103, assignMaterial(points, true, "gold")[0].material === "gold" && assignMaterial(points, true, "gold")[1].material === "stone", "material assignment ignored selection");
  const topology = diagnoseTopology([...points, { ...points[0] }]);
  test(104, topology.duplicateIds.includes("a") && topology.offGridIds.includes("b"), "topology diagnostics failed");
  const lod = createLodPlan(100, [64, 16, 32]);
  test(105, lod.length === 3 && lod[0].targetCount > lod.at(-1)!.targetCount, "LOD planning failed");

  const keys = [
    { frame: 0, value: 0, interpolation: "linear" as const },
    { frame: 10, value: 10, interpolation: "linear" as const }
  ];
  test(106, listDopeSheetKeys([{ id: "x", keys: [...keys], muted: false }], 0, 5).length === 1, "dope sheet range filtering failed");
  test(107, sampleAnimationCurve(keys, 5) === 5, "animation curve sampling failed");
  test(108, sampleNlaStrips([{ id: "s", startFrame: 0, endFrame: 10, sourceStart: 0, sourceEnd: 20, weight: 1, additive: false }], 5, (frame) => frame) === 10, "NLA strip sampling failed");
  test(109, evaluateConstraintStack(10, [{ id: "limit", kind: "limit", weight: 1, value: 0, minimum: 0, maximum: 5 }]) === 5, "constraint stack failed");
  test(110, evaluateSafeDriver("speed*2+1", { speed: 3 }) === 7, "safe driver evaluation failed");
  test(111, JSON.stringify(switchIkFk([10, 20], [0, 0], 0.5)) === JSON.stringify([5, 10]), "IK/FK switch failed");
  test(112, applyPoseAsset({ arm: 0 }, { arm: 10 }, 0.5).arm === 5, "pose asset blending failed");
  test(113, evaluateMorphChannels({ smile: 2 }, { smile: [0, 1] }).smile === 1, "morph channel limits failed");
  test(114, retimeAnimationKeys(keys, [0, 10], [20, 40])[1].frame === 40, "animation retime failed");
  test(115, cleanAnimationCurve([{ frame: 0, value: 0, interpolation: "linear" }, { frame: 5, value: 5, interpolation: "linear" }, { frame: 10, value: 10, interpolation: "linear" }], 0.01).length === 2, "curve cleanup failed");

  const clips: UltraEditorialClip[] = [
    { id: "a", track: 1, startFrame: 0, sourceIn: 0, sourceOut: 24, speed: 1, mediaId: "camA", offline: false },
    { id: "b", track: 2, startFrame: 24, sourceIn: 0, sourceOut: 24, speed: 1, mediaId: "camB", offline: false }
  ];
  test(116, validateEditorialTimeline(clips).length === 0, "editorial timeline validation failed");
  test(117, synchronizeMulticam(clips, { camB: 12 })[1].startFrame === 12, "multicam synchronization failed");
  test(118, createProxyPlan(clips, 640).every((entry) => entry.scale === 0.25), "proxy planning failed");
  const mix = mixAudioBus([{ id: "dialogue", gainDb: 0, pan: 0.5, muted: false }]);
  test(119, mix.activeInputs === 1 && mix.linearGain === 1 && mix.pan === 0.5, "audio bus mixing failed");
  const captions = [{ id: "c", startFrame: 0, endFrame: 20, text: "Hello", language: "en" }];
  test(120, validateCaptionCues(captions).length === 0, "caption validation failed");
  test(121, createInterchangeEvents(clips, 24)[1].timecode === "00:00:01:00", "interchange timecode failed");
  test(122, relinkOfflineMedia([{ ...clips[0], offline: true }], { camA: "camA_proxy" })[0].mediaId === "camA_proxy", "offline media relink failed");
  const transition = sampleTransition("crossfade", 0.25);
  test(123, transition[0] === 0.75 && transition[1] === 0.25, "transition sampling failed");
  test(124, conformEditorial(clips, new Set(["camA"])).missingMediaIds[0] === "camB", "editorial conform failed");
  test(125, validateMasteringTimeline(clips, captions).valid, "mastering validation failed");

  const assets: UltraProductionAsset[] = [
    { id: "texture", name: "Hero Texture", kind: "texture", tags: ["hero"], version: 1, dependencies: [], sizeBytes: 100 },
    { id: "rig", name: "Hero Rig", kind: "rig", tags: ["hero"], version: 2, dependencies: ["texture"], sizeBytes: 200 }
  ];
  test(126, indexProductionAssets(assets).get("hero")?.length === 2, "asset indexing failed");
  test(127, searchProductionAssets("hero rig", assets)[0]?.id === "rig", "asset search failed");
  test(128, JSON.stringify(buildDependencyOrder(assets, ["rig"])) === JSON.stringify(["texture", "rig"]), "asset dependency order failed");
  test(129, resolveWorkspaceTemplate({ id: "anim", name: "Animation", editors: ["viewport", "timeline", "graph"], shortcuts: {}, minimumWidth: 1200 }, 800).editors.length === 2, "adaptive workspace failed");
  test(130, searchCommandPalette("render final", [{ id: "render", label: "Render Final", keywords: ["output"], enabled: true }])[0] === "render", "command palette search failed");
  const comparison = compareReviewVersions({ id: "v1", shotId: "s", revision: 1, fingerprint: "aaaaaaaa", approved: false }, { id: "v2", shotId: "s", revision: 2, fingerprint: "bbbbbbbb", approved: true });
  test(131, comparison.sameShot && comparison.changed && comparison.revisionDelta === 1, "review comparison failed");
  const collaboration = packageCollaborationAssets(assets, ["rig"]);
  test(132, collaboration.totalBytes === 300 && collaboration.orderedIds[0] === "texture", "collaboration packaging failed");
  test(133, validateBatchOperations([{ id: "batch", targetIds: ["rig"], operator: "validate", parameters: {} }]).length === 0, "batch operation validation failed");
  const farm = assignRenderFarmJobs(["j2", "j1"], [{ id: "worker", enabled: true, capacity: 2, platform: "linux" }]);
  test(134, farm.worker.length === 2, "render farm assignment failed");
  const dashboard = calculateProductionDashboard({ totalShots: 10, approvedShots: 8, blockedShots: 0, queuedRenders: 0, missingAssets: 0 });
  const handoff = validateReleaseHandoff({ projectFingerprint: "aaaaaaaa", manifestFingerprint: "bbbbbbbb", checksums: ["cccccccc"], unresolvedNotes: 0, missingAssets: 0, evidenceComplete: true });
  test(135, dashboard.completion === 0.8 && handoff.length === 0, "production dashboard or release handoff failed");

  return results;
}
