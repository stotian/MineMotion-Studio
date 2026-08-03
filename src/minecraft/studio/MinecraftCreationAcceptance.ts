import { createInitialProject } from "../../project/ProjectStore";
import { RIG_ANIMATION_PRESETS } from "../../rigs/AnimationPresetLibrary";
import type { MineMotionProject } from "../../project/ProjectFile";
import { MINECRAFT_CREATION_FEATURE_SEEDS } from "./MinecraftCreationFeatureRegistry";
import { sanitizeMinecraftCreationSuite } from "./MinecraftStudioDefaults";
import { configureWorldStudio, buildSeedProxyArea, createBlankStudioStage, createWorldStudioManifest } from "./MinecraftWorldStudio";
import { createWorldAreaPlan, hashSeed } from "./WorldAreaPlanner";
import { analyzeWorldStreaming, classifyWorldChunkLod, estimateWorldStreamingReduction, exportWorldStreamingManifest, selectStreamedWorldChunks, simplifyChunkForLod } from "./WorldStreamingStudio";
import { generateBoundedProxyWorld } from "./WorldProxyGenerator";
import { analyzeModCompatibility, listMinecraftEntityCatalog, parseModManifest, removeModDescriptor, setModEnabled, upsertModDescriptor } from "./ModAssetCatalog";
import { activateModResourcePack, bindImportedAssetsToMod, createModBlockPaletteProp, discoverImportedModAssets, exportModAssetUsageManifest, insertModAssetIntoScene } from "./ModAssetBridge";
import { addWorldEditOperation, applyWorldEditOperations, bakeWorldEdits, clearWorldEditOperations, createWorldEditManifest, removeWorldEditOperation, updateWorldEditOperation } from "./WorldEditLayer";
import { analyzeWorldEditSelection, createCylinderBrush, createLineBrush, createMinecraftStructure, createSphereBrush, duplicateWorldEditLayer, exportWorldEditBlueprint, importWorldEditBlueprint, mirrorWorldEditLayer, MINECRAFT_STRUCTURE_TEMPLATE_IDS } from "./MinecraftBuilderAdvanced";
import { addVoxelCube, arrayVoxelModel, compileVoxelModelToObj, createVoxelModel, createVoxelModelFromWorldBox, createVoxelModelManifest, deleteVoxelModel, mirrorVoxelModel, optimizeVoxelModel, removeVoxelCube, syncVoxelModelToScene, updateVoxelCube } from "./VoxelModeling";
import { addVoxelPrimitive, centerVoxelModelOrigin, createVoxelModelTemplate, duplicateVoxelModel, mergeAdjacentVoxelCubes, recolorVoxelModel, transformVoxelModel, VOXEL_MODEL_TEMPLATE_IDS, VOXEL_PRIMITIVE_KINDS } from "./VoxelModelingAdvanced";
import { applyPresetToRigGroup, createRigGroup, createRigGroupManifest, deleteRigGroup, mirrorRigGroupPose, offsetRigGroupAnimation, spawnCatalogEntity, synchronizeRigGroupPose, updateRigGroup } from "./MultiRigAnimator";
import { addRigGroupTimingVariation, animateRigGroupTranslation, arrangeRigGroup, faceRigGroupTarget, muteRigGroupAnimation, removeRigGroupAnimation, retimeRigGroup, RIG_GROUP_FORMATIONS, spawnRigCrowd } from "./MultiRigStudio";
import { analyzeCollisions, createDefaultCollisionProfiles, exportCollisionManifest, getCollisionAabb, removeCollisionProfile, resolveEntityCollisions, setCollisionStudioEnabled, setCollisionVisualization, setEntityCollisionEnabled, setWorldCollisionEnabled, snapAllEntitiesToWorld, snapEntityToWorld, synchronizeCollisionHelpers, upsertCollisionProfile } from "./CollisionStudio";
import { analyzeCollisionTimeline, bakeCollisionAvoidance, exportCollisionTimelineReport } from "./CollisionAnimationBaker";
import { addQuickVfxFavorite, exportQuickVfxCatalog, insertQuickVfx, insertQuickVfxFavorite, QUICK_VFX_PRESET_IDS, removeEffectsAtFrame, removeQuickVfxFavorite } from "./QuickVfxStudio";
import { addPostStackLayer, applyStudioFinish, clearPostStack, createPostStackFromFinish, evaluatePostStack, exportPostFinishManifest, flattenPostStack, movePostStackLayer, removePostStackLayer, STUDIO_FINISH_IDS, updatePostStackLayer } from "./PostFinishStudio";
import { analyzeMinecraftStudioPerformance, applyMinecraftStudioPerformanceTarget, autoOptimizeMinecraftStudio, disableOffAreaEffects, exportOptimizationReport, optimizeAllVoxelModels } from "./MinecraftStudioOptimization";
import { createMinecraftStudioPackage, serializeMinecraftStudioPackage } from "./MinecraftStudioPackage";
import { autoRigVoxelModel, detachRiggedGeometry, exportSimpleRigManifest, rebindRiggedCube, refreshRiggedGeometryFromModel, setRiggedGeometryVisible, updateRiggedCube, validateSimpleRig } from "./SimpleRiggingStudio";
import { sanitizeCharacterRig } from "../../rigs/RigSerializer";

export interface MinecraftCreationAcceptanceContext {
  assert: (condition: unknown, message: string) => void;
  cover: (acceptanceId: string) => void;
}

export interface MinecraftCreationAcceptanceResult {
  project: MineMotionProject;
  creationFeatures: number;
  chunks: number;
  models: number;
  rigs: number;
  effects: number;
}

export function runMinecraftCreationAcceptance(context: MinecraftCreationAcceptanceContext): MinecraftCreationAcceptanceResult {
  const { assert, cover } = context;
  const covered = new Set<string>();
  const mark = (id: string) => { const acceptanceId = `creation-${id.replace(/\./g, "-")}`; cover(acceptanceId); covered.add(acceptanceId); };
  let project = createInitialProject();

  project = configureWorldStudio(project, { sourceMode: "seed-proxy", seed: "MineMotion Acceptance", minecraftVersion: "1.21.1", loader: "fabric", exactWorldRequired: false, biomePreset: "forest", area: { radiusChunks: 1, maxActiveChunks: 9, nearLodRadius: 1, mediumLodRadius: 1, minY: -64, maxY: 128 } });
  assert(project.creationSuite.worldStudio.loader === "fabric", "World Studio did not persist loader configuration."); mark("world.configure"); mark("world.loader-version");
  const plan = createWorldAreaPlan(project.creationSuite.worldStudio);
  assert(plan.chunks.length === 9 && plan.chunks[0].distance === 0, "Bounded world plan is not centered and prioritized."); mark("world.area-plan");
  assert(hashSeed("same") === hashSeed("same") && hashSeed("same") !== hashSeed("different"), "Seed hashing is not deterministic."); mark("world.seed-hash");
  const generated = generateBoundedProxyWorld(project.creationSuite.worldStudio);
  assert(generated.chunks.length === 9 && generated.blockCount > 0, "Proxy generator did not produce bounded terrain."); mark("world.proxy-generate");
  const built = buildSeedProxyArea(project);
  assert(built.changed && built.chunksBuilt === 9 && built.blocksBuilt > 0, "Seed proxy was not built into the project.");
  project = built.project; mark("world.proxy-build");
  const streamed = selectStreamedWorldChunks(project); assert(streamed.length > 0 && streamed.length <= 9, "Bounded streaming did not select active chunks."); mark("world.streaming-select");
  assert(classifyWorldChunkLod(0, 1, 2) === "near" && classifyWorldChunkLod(2, 1, 2) === "medium" && classifyWorldChunkLod(3, 1, 2) === "far", "World LOD classification failed."); mark("world.streaming-lod");
  const streamingReport = analyzeWorldStreaming(project); assert(streamingReport.selectedChunks === streamed.length && streamingReport.selectedBlocks > 0, "World streaming report is inconsistent."); mark("world.streaming-report");
  const farChunk = simplifyChunkForLod(generated.chunks[0], "far"); assert(farChunk.blocks.length <= generated.chunks[0].blocks.length && farChunk.status === "streamed-far", "Far chunk LOD simplification failed."); mark("world.streaming-simplify");
  const streamingReduction = estimateWorldStreamingReduction(project); assert(streamingReduction.renderedBlocks <= streamingReduction.sourceBlocks && streamingReduction.reductionRatio >= 0, "Streaming reduction estimate is invalid."); mark("world.streaming-reduction");
  assert(exportWorldStreamingManifest(project).includes('"lod"'), "World streaming manifest omitted LOD data."); mark("world.streaming-manifest");
  assert(createWorldStudioManifest(project).includes("MineMotion Acceptance"), "World Studio manifest omitted the seed."); mark("world.manifest");
  const exactPlan = createWorldAreaPlan({ ...project.creationSuite.worldStudio, exactWorldRequired: true });
  assert(exactPlan.warnings.some((warning) => warning.toLowerCase().includes("import")), "Exact-world guard did not require an imported save."); mark("world.exact-source-guard");
  const blank = createBlankStudioStage(project);
  assert(blank.changed && blank.project.world?.sourceName === "Blank Minecraft studio stage" && blank.chunksBuilt === 0, "Blank stage creation failed."); mark("world.blank-stage");

  const descriptor = parseModManifest(JSON.stringify({ id: "cinematic_mobs", name: "Cinematic Mobs", version: "1.0", loader: "fabric", namespace: "cinematic", entities: ["cinematic:dragon"], blocks: ["cinematic:studio_block"], assets: ["cinematic:dragon_model"] }), "fabric");
  assert(descriptor.entityIds.length === 1, "Mod manifest parser omitted entities."); mark("mods.parse-manifest");
  project = upsertModDescriptor(project, descriptor); assert(project.creationSuite.worldStudio.mods.length === 1, "Mod upsert failed."); mark("mods.upsert");
  project = setModEnabled(project, descriptor.id, false); assert(project.creationSuite.worldStudio.mods[0].enabled === false, "Mod toggle failed."); mark("mods.toggle");
  project = setModEnabled(project, descriptor.id, true);
  const compatibility = analyzeModCompatibility(project); assert(compatibility.compatible.length === 1 && compatibility.entityCount === 1, "Compatible Fabric mod was rejected."); mark("mods.compatibility");
  let catalog = listMinecraftEntityCatalog(project); assert(catalog.some((entry) => entry.id === "steve") && catalog.some((entry) => entry.id === "cinematic:dragon"), "Entity catalog did not combine Vanilla and mod entities."); mark("mods.entity-catalog");
  project = { ...project, assets: { ...project.assets, obj: [...project.assets.obj, { id: "cinematic_dragon_obj", name: "cinematic dragon", rawObj: "o cinematic_dragon\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n", importedAt: new Date().toISOString() }], resourcePacks: [...project.assets.resourcePacks, { id: "cinematic_pack", name: "Cinematic Mobs Pack", sourceKind: "folder", metadata: { packFormat: 34, description: "Acceptance pack", hasPackMetadata: true }, textures: [{ id: "cinematic_block_texture", path: "assets/cinematic/textures/block/studio_block.png", blockName: "cinematic:studio_block", mimeType: "image/png", dataUrl: "data:image/png;base64,", byteLength: 0, animated: false, animation: null }], importedAt: new Date().toISOString(), warnings: [] }] } };
  const assetDiscovery = discoverImportedModAssets(project, descriptor.id); assert(assetDiscovery.objModels === 1 && assetDiscovery.directUsable >= 1, "Mod asset discovery did not find the imported OBJ."); mark("mods.assets-discover");
  const boundAssets = bindImportedAssetsToMod(project, descriptor.id); project = boundAssets.project; assert(project.creationSuite.worldStudio.mods[0].assetIds.some((id) => id.startsWith("obj:")), "Mod assets were not bound to the descriptor."); mark("mods.assets-bind");
  const insertedAsset = insertModAssetIntoScene(project, descriptor.id, assetDiscovery.discovered.find((asset) => asset.kind === "obj")!.id, [3, 80, 3]); project = insertedAsset.project; assert(insertedAsset.changed && Boolean(insertedAsset.sceneObjectId), "Mod OBJ asset was not inserted into the scene."); mark("mods.assets-insert");
  const modPalette = createModBlockPaletteProp(project, descriptor.id); project = modPalette.project; assert(modPalette.changed && Boolean(modPalette.sceneObjectId), "Mod block palette prop failed."); mark("mods.assets-block-palette");
  const activatedPack = activateModResourcePack(project, descriptor.id); project = activatedPack.project; assert(activatedPack.changed && project.minecraftResources.activeResourcePackId === "cinematic_pack", "Mod resource pack activation failed."); mark("mods.assets-resource-pack");
  assert(exportModAssetUsageManifest(project, descriptor.id).includes("cinematic_dragon_obj"), "Mod asset usage manifest omitted imported assets."); mark("mods.assets-manifest");
  const removedModProject = removeModDescriptor(project, descriptor.id); assert(removedModProject.creationSuite.worldStudio.mods.length === 0, "Mod removal failed."); mark("mods.remove");

  const editRequests = [
    { kind: "set" as const, from: [0, 100, 0] as [number, number, number], blockName: "minecraft:gold_block" },
    { kind: "fill" as const, from: [1, 100, 0] as [number, number, number], to: [2, 100, 1] as [number, number, number], blockName: "minecraft:stone" },
    { kind: "replace" as const, from: [1, 100, 0] as [number, number, number], to: [2, 100, 1] as [number, number, number], matchBlockName: "minecraft:stone", blockName: "minecraft:glass" },
    { kind: "clone" as const, from: [1, 100, 0] as [number, number, number], to: [2, 100, 1] as [number, number, number], destination: [4, 100, 0] as [number, number, number] },
    { kind: "erase" as const, from: [0, 100, 0] as [number, number, number] }
  ];
  for (const request of editRequests) {
    project = addWorldEditOperation(project, request);
    assert(project.creationSuite.worldEdits.at(-1)?.kind === request.kind, `World edit ${request.kind} was not added.`);
    mark(`build.${request.kind}`);
  }
  const firstEdit = project.creationSuite.worldEdits[0];
  project = updateWorldEditOperation(project, firstEdit.id, { name: "Updated edit", enabled: false }); assert(project.creationSuite.worldEdits[0].name === "Updated edit", "World edit update failed."); mark("build.update");
  project = updateWorldEditOperation(project, firstEdit.id, { enabled: true });
  const applied = applyWorldEditOperations(project.world?.importedChunks ?? [], project.creationSuite.worldEdits); assert(applied.appliedOperations >= 3 && applied.changedBlocks > 0, "World edits were not evaluated."); mark("build.apply");
  assert(createWorldEditManifest(project).includes("Updated edit"), "World-edit manifest omitted operations."); mark("build.manifest");
  const lastEditId = project.creationSuite.worldEdits.at(-1)!.id;
  const withoutOne = removeWorldEditOperation(project, lastEditId); assert(withoutOne.creationSuite.worldEdits.length === project.creationSuite.worldEdits.length - 1, "World edit removal failed."); mark("build.remove");
  const cleared = clearWorldEditOperations(withoutOne); assert(cleared.creationSuite.worldEdits.length === 0, "World edit clear failed."); mark("build.clear");
  project = bakeWorldEdits(project); assert(project.creationSuite.worldEdits.length === 0 && project.world?.notes.some((note) => note.startsWith("World edits baked:")), "World edits did not bake into project copy."); mark("build.bake");

  let builderProject = project;
  for (const templateId of MINECRAFT_STRUCTURE_TEMPLATE_IDS) { const builtStructure = createMinecraftStructure(builderProject, templateId, [20, 70, 20], { width: 7, height: 5, depth: 7 }); builderProject = builtStructure.project; assert(builtStructure.changed && builtStructure.operationIds.length > 0, `Structure template ${templateId} failed.`); mark(`build.structure.${templateId}`); }
  const lineBrush = createLineBrush(builderProject, [0, 75, 0], [6, 78, 3], "minecraft:gold_block"); builderProject = lineBrush.project; assert(lineBrush.changed && lineBrush.operationIds.length >= 6, "Line brush failed."); mark("build.brush-line");
  const sphereBrush = createSphereBrush(builderProject, [10, 76, 0], 3, "minecraft:glass", true); builderProject = sphereBrush.project; assert(sphereBrush.changed && sphereBrush.operationIds.length > 8, "Sphere brush failed."); mark("build.brush-sphere");
  const cylinderBrush = createCylinderBrush(builderProject, [20, 70, 0], 3, 5, "minecraft:stone", false); builderProject = cylinderBrush.project; assert(cylinderBrush.changed && cylinderBrush.operationIds.length > 3, "Cylinder brush failed."); mark("build.brush-cylinder");
  const mirroredLayer = mirrorWorldEditLayer(builderProject, "x", 0); builderProject = mirroredLayer.project; assert(mirroredLayer.changed, "Builder layer mirror failed."); mark("build.layer-mirror");
  const duplicatedLayer = duplicateWorldEditLayer(builderProject, [40, 0, 0]); builderProject = duplicatedLayer.project; assert(duplicatedLayer.changed, "Builder layer duplication failed."); mark("build.layer-duplicate");
  const blueprint = exportWorldEditBlueprint(builderProject, "Acceptance Blueprint"); assert(blueprint.includes("Acceptance Blueprint"), "Blueprint export failed."); mark("build.blueprint-export");
  const importedBlueprint = importWorldEditBlueprint(clearWorldEditOperations(project), blueprint, [80, 70, 80]); assert(importedBlueprint.changed && importedBlueprint.operationIds.length > 0, "Blueprint import failed."); mark("build.blueprint-import");
  const buildAnalysis = analyzeWorldEditSelection(importedBlueprint.project); assert(buildAnalysis.operations > 0 && buildAnalysis.estimatedBlocks > 0 && Boolean(buildAnalysis.bounds), "Builder selection analysis failed."); mark("build.selection-analyze");

  let modelResult = createVoxelModel(project, "Acceptance Model"); project = modelResult.project; const modelId = modelResult.modelId!; assert(Boolean(modelId), "Voxel model creation failed."); mark("model.create");
  let cubeResult = addVoxelCube(project, modelId, { position: [0, 0, 0], size: [1, 1, 1], color: "#ff0000", materialName: "red" }); project = cubeResult.project; const cubeId = cubeResult.cubeIds[0]; assert(Boolean(cubeId), "Voxel cube creation failed."); mark("model.add-cube");
  project = updateVoxelCube(project, modelId, cubeId, { size: [2, 1, 1] }).project; assert(project.creationSuite.models.find((model) => model.id === modelId)?.cubes[0].size[0] === 2, "Voxel cube update failed."); mark("model.update-cube");
  const removable = addVoxelCube(project, modelId, { position: [10, 0, 0] }); project = removable.project; project = removeVoxelCube(project, modelId, removable.cubeIds[0]).project; assert(!project.creationSuite.models.find((model) => model.id === modelId)?.cubes.some((cube) => cube.id === removable.cubeIds[0]), "Voxel cube removal failed."); mark("model.remove-cube");
  project = mirrorVoxelModel(project, modelId, "x", true).project; assert((project.creationSuite.models.find((model) => model.id === modelId)?.cubes.length ?? 0) >= 2, "Voxel mirror failed."); mark("model.mirror");
  project = arrayVoxelModel(project, modelId, 2, [0, 0, 3]).project; assert((project.creationSuite.models.find((model) => model.id === modelId)?.cubes.length ?? 0) >= 4, "Voxel array failed."); mark("model.array");
  project = optimizeVoxelModel(project, modelId).project; mark("model.optimize");
  for (const primitive of VOXEL_PRIMITIVE_KINDS) { const result = addVoxelPrimitive(project, modelId, primitive, { position: [0, 2, 0], size: [2, 2, 2] }); project = result.project; assert(result.changed && result.cubeIds.length > 0, `Voxel primitive ${primitive} failed.`); mark(`model.primitive.${primitive}`); }
  const duplicate = duplicateVoxelModel(project, modelId); project = duplicate.project; assert(duplicate.changed && duplicate.modelId !== modelId, "Voxel model duplication failed."); mark("model.duplicate");
  project = transformVoxelModel(project, duplicate.modelId!, [2, 0, 0], [1.2, 1, 1]).project; mark("model.transform");
  project = recolorVoxelModel(project, duplicate.modelId!, "#00ff88", "emerald").project; assert(project.creationSuite.models.find((model) => model.id === duplicate.modelId)?.cubes.every((cube) => cube.color === "#00ff88"), "Voxel recolor failed."); mark("model.recolor");
  project = centerVoxelModelOrigin(project, duplicate.modelId!).project; mark("model.center-origin");
  const adjacentA = addVoxelCube(project, duplicate.modelId!, { position: [100, 0, 0], size: [1, 1, 1], color: "#123456", materialName: "merge" }); project = adjacentA.project;
  project = addVoxelCube(project, duplicate.modelId!, { position: [101, 0, 0], size: [1, 1, 1], color: "#123456", materialName: "merge" }).project;
  const beforeMerge = project.creationSuite.models.find((model) => model.id === duplicate.modelId)!.cubes.length;
  project = mergeAdjacentVoxelCubes(project, duplicate.modelId!).project; assert(project.creationSuite.models.find((model) => model.id === duplicate.modelId)!.cubes.length < beforeMerge, "Adjacent voxel merge failed."); mark("model.merge-adjacent");
  for (const template of VOXEL_MODEL_TEMPLATE_IDS) { const result = createVoxelModelTemplate(project, template); project = result.project; assert(result.changed && result.cubeIds.length > 0, `Voxel template ${template} failed.`); mark(`model.template.${template}`); }
  const worldModel = createVoxelModelFromWorldBox(project, "World Sample", [0, -64, 0], [1, 128, 1]); project = worldModel.project; assert(worldModel.changed && worldModel.cubeIds.length > 0, "World selection did not create a voxel model."); mark("model.from-world");
  const model = project.creationSuite.models.find((candidate) => candidate.id === modelId)!;
  const obj = compileVoxelModelToObj(model); assert(obj.includes("v ") && obj.includes("f "), "OBJ compilation produced no geometry."); mark("model.obj");
  const synced = syncVoxelModelToScene(project, modelId); project = synced.project; assert(synced.changed && project.scene.importedObjects.some((object) => object.id === project.creationSuite.models.find((candidate) => candidate.id === modelId)?.sceneObjectId), "Voxel model did not sync to renderer scene."); mark("model.scene-sync");
  assert(createVoxelModelManifest(project.creationSuite.models.find((candidate) => candidate.id === modelId)!).includes("Acceptance Model"), "Voxel model manifest failed."); mark("model.manifest");
  const autoRig = autoRigVoxelModel(project, modelId, "steve", "Acceptance Custom Rig", [2, 80, 2]); project = autoRig.project; const simpleRigId = autoRig.characterId!; assert(autoRig.changed && autoRig.assignedCubes > 0, "Voxel model auto-rigging failed."); mark("rig.simple-auto");
  const riggedCube = project.scene.characters.find((entry) => entry.id === simpleRigId)!.customGeometry!.cubes[0];
  const rebound = rebindRiggedCube(project, simpleRigId, riggedCube.id, "body"); project = rebound.project; assert(project.scene.characters.find((entry) => entry.id === simpleRigId)?.customGeometry?.cubes[0].boneId === "body", "Rigged cube rebind failed."); mark("rig.simple-rebind");
  project = updateRiggedCube(project, simpleRigId, riggedCube.id, { color: "#3366ff", position: [0.1, 0.2, 0.3] }).project; assert(project.scene.characters.find((entry) => entry.id === simpleRigId)?.customGeometry?.cubes[0].color === "#3366ff", "Rigged cube update failed."); mark("rig.simple-update");
  project = setRiggedGeometryVisible(project, simpleRigId, false).project; assert(project.scene.characters.find((entry) => entry.id === simpleRigId)?.customGeometry?.hideDefaultGeometry === false, "Rig geometry display toggle failed."); mark("rig.simple-display");
  project = refreshRiggedGeometryFromModel(project, simpleRigId).project; assert((project.scene.characters.find((entry) => entry.id === simpleRigId)?.customGeometry?.cubes.length ?? 0) > 0, "Rig geometry refresh failed."); mark("rig.simple-refresh");
  const simpleRigReport = validateSimpleRig(project, simpleRigId); assert(simpleRigReport.valid && simpleRigReport.cubes > 0, "Simple rig validation failed."); mark("rig.simple-validate");
  assert(exportSimpleRigManifest(project, simpleRigId).includes("Acceptance Custom Rig"), "Simple rig export failed."); mark("rig.simple-export");
  const detached = detachRiggedGeometry(project, simpleRigId); assert(detached.changed && !detached.project.scene.characters.find((entry) => entry.id === simpleRigId)?.customGeometry, "Simple rig detach failed."); mark("rig.simple-detach");
  const deleteTarget = duplicate.modelId!; project = deleteVoxelModel(project, deleteTarget).project; assert(!project.creationSuite.models.some((candidate) => candidate.id === deleteTarget), "Voxel model deletion failed."); mark("model.delete");

  catalog = listMinecraftEntityCatalog(project);
  const steve = catalog.find((entry) => entry.id === "steve")!; const alex = catalog.find((entry) => entry.id === "alex")!; const zombie = catalog.find((entry) => entry.id === "zombie")!;
  const spawnedSteve = spawnCatalogEntity(project, steve, [0, 80, 0]); project = spawnedSteve.project;
  const spawnedAlex = spawnCatalogEntity(project, alex, [0, 80, 0]); project = spawnedAlex.project;
  const spawnedZombie = spawnCatalogEntity(project, zombie, [3, 80, 0]); project = spawnedZombie.project;
  assert(spawnedSteve.changed && spawnedAlex.changed && spawnedZombie.changed, "Ready-made rigs did not spawn."); mark("rig.spawn");
  const rigIds = [spawnedSteve.affectedCharacterIds[0], spawnedAlex.affectedCharacterIds[0], spawnedZombie.affectedCharacterIds[0]];
  let groupResult = createRigGroup(project, "Acceptance Group", rigIds); project = groupResult.project; const groupId = groupResult.groupId!; assert(Boolean(groupId), "Rig group creation failed."); mark("rig.group-create");
  groupResult = updateRigGroup(project, groupId, { staggerFrames: 3, mirrorAlternating: true, speed: 1.25 }); project = groupResult.project; assert(project.creationSuite.rigGroups.find((group) => group.id === groupId)?.staggerFrames === 3, "Rig group update failed."); mark("rig.group-update");
  groupResult = applyPresetToRigGroup(project, groupId, RIG_ANIMATION_PRESETS[1].id, 12); project = groupResult.project; assert(groupResult.changed && groupResult.affectedTrackIds.length > 0, "Multi-rig preset did not create tracks."); mark("rig.preset");
  project = synchronizeRigGroupPose(project, groupId, rigIds[0]).project; mark("rig.sync-pose");
  project = mirrorRigGroupPose(project, groupId).project; mark("rig.mirror-pose");
  project = offsetRigGroupAnimation(project, groupId, 5).project; mark("rig.offset");
  assert(createRigGroupManifest(project, groupId).includes("Acceptance Group"), "Rig group manifest failed."); mark("rig.manifest");
  const crowd = spawnRigCrowd(project, zombie, { count: 4, origin: [6, 80, 0], columns: 2, groupName: "Zombie Crowd" }); project = crowd.project; assert(crowd.changed && crowd.affectedCharacterIds.length === 4, "Crowd spawn failed."); mark("rig.crowd");
  for (const formation of RIG_GROUP_FORMATIONS) { const arranged = arrangeRigGroup(project, groupId, formation, [0, 80, 0], 2); project = arranged.project; assert(arranged.changed, `Rig formation ${formation} failed.`); mark(`rig.formation.${formation}`); }
  groupResult = animateRigGroupTranslation(project, groupId, [5, 0, -2], 20, 30); project = groupResult.project; assert(groupResult.affectedTrackIds.length === rigIds.length, "Rig group translation did not animate every actor."); mark("rig.translate");
  project = retimeRigGroup(project, groupId, 12, 60, 30, 100).project; mark("rig.retime");
  project = addRigGroupTimingVariation(project, groupId, 4).project; mark("rig.variation");
  project = faceRigGroupTarget(project, groupId, [0, 80, -10]).project; mark("rig.face-target");
  project = { ...project, animation: { ...project.animation, nlaTracks: [...project.animation.nlaTracks, { id: "acceptance_nla", name: "Acceptance NLA", targetId: rigIds[0], clips: [], muted: false }] } };
  const muted = muteRigGroupAnimation(project, groupId, true); project = muted.project; assert(project.animation.nlaTracks.find((track) => track.id === "acceptance_nla")?.muted, "Rig group mute failed."); mark("rig.mute");
  const noAnimation = removeRigGroupAnimation(project, groupId); project = noAnimation.project; assert(noAnimation.changed, "Rig group animation removal failed."); mark("rig.remove-animation");
  const deleteGroup = createRigGroup(project, "Delete Group", [rigIds[0]]); project = deleteGroup.project; project = deleteRigGroup(project, deleteGroup.groupId!).project; assert(!project.creationSuite.rigGroups.some((group) => group.id === deleteGroup.groupId), "Rig group deletion failed."); mark("rig.group-delete");

  project = { ...project, scene: { ...project.scene, characters: project.scene.characters.map((character) => rigIds.slice(0, 2).includes(character.id) ? { ...character, transform: { ...character.transform, position: [0, 60, 0] } } : character) } };
  project = setCollisionStudioEnabled(project, true); assert(project.creationSuite.collisions.enabled, "Collision Studio enable failed."); mark("collision.enable");
  project = setWorldCollisionEnabled(project, true); mark("collision.world-toggle"); project = setEntityCollisionEnabled(project, true); mark("collision.entity-toggle"); project = setCollisionVisualization(project, true); mark("collision.visualization");
  project = createDefaultCollisionProfiles(project); assert(project.creationSuite.collisions.profiles.length >= project.scene.characters.length, "Default collision profiles were not generated."); mark("collision.default-profiles");
  project = upsertCollisionProfile(project, rigIds[0], { size: [0.9, 2, 0.9], layer: 1 }); assert(project.creationSuite.collisions.profiles.find((profile) => profile.entityId === rigIds[0])?.layer === 1, "Custom collision profile failed."); mark("collision.custom-profile");
  assert(Boolean(getCollisionAabb(project, rigIds[0])), "Collision AABB was not computed."); mark("collision.aabb");
  const collisionAnalysis = analyzeCollisions(project); assert(collisionAnalysis.testedEntities > 0 && collisionAnalysis.contacts.length > 0, "Collision analysis found no expected overlap/world contact."); mark("collision.analyze");
  const timelineCollision = analyzeCollisionTimeline(project, 0, 30, 10); assert(timelineCollision.sampledFrames === 4 && timelineCollision.collisionFrames.length > 0, "Animation collision preflight failed."); mark("collision.timeline-analyze");
  const bakedCollision = bakeCollisionAvoidance(project, 0, 30, 10); project = bakedCollision.project; assert(bakedCollision.changed && bakedCollision.affectedTrackIds.length > 0, "Collision avoidance bake created no position tracks."); mark("collision.timeline-bake");
  assert(exportCollisionTimelineReport(project, 0, 30, 10).includes("minemotion-collision-timeline-v1"), "Collision timeline export failed."); mark("collision.timeline-export");
  project = snapEntityToWorld(project, rigIds[0]); mark("collision.snap"); project = snapAllEntitiesToWorld(project); mark("collision.snap-all");
  project = resolveEntityCollisions(project); assert(analyzeCollisions(project).contacts.length <= collisionAnalysis.contacts.length, "Collision resolution made contacts worse."); mark("collision.resolve");
  project = synchronizeCollisionHelpers(project); assert(project.world?.sceneOverrides?.markers.some((marker) => marker.id.startsWith("collision_profile:")), "Collision helpers were not synchronized."); mark("collision.helpers");
  assert(exportCollisionManifest(project).includes("minemotion-collision-studio-v1"), "Collision manifest failed."); mark("collision.manifest");
  project = removeCollisionProfile(project, rigIds[0]); assert(!project.creationSuite.collisions.profiles.some((profile) => profile.entityId === rigIds[0]), "Collision profile removal failed."); mark("collision.remove-profile");

  const vfxStart = project.animation.currentFrame;
  for (const preset of QUICK_VFX_PRESET_IDS) { const inserted = insertQuickVfx(project, preset, { frame: vfxStart, targetObjectId: rigIds[0], intensity: 0.8 }); project = inserted.project; assert(inserted.changed && inserted.effectIds.length > 0, `Quick VFX ${preset} failed.`); mark(`vfx.${preset}`); }
  project = addQuickVfxFavorite(project, "tnt-explosion", "Big TNT", 1.2, 0.8); assert(project.creationSuite.quickVfxFavorites.length === 1, "Quick VFX favorite add failed."); mark("vfx.favorite-add");
  const favoriteInsert = insertQuickVfxFavorite(project, project.creationSuite.quickVfxFavorites[0].id, vfxStart + 20, rigIds[0]); project = favoriteInsert.project; assert(favoriteInsert.changed, "Quick VFX favorite insert failed."); mark("vfx.favorite-insert");
  project = removeEffectsAtFrame(project, vfxStart + 20, 0); mark("vfx.remove-at-frame");
  project = removeQuickVfxFavorite(project, "quick_vfx_tnt-explosion"); assert(project.creationSuite.quickVfxFavorites.length === 0, "Quick VFX favorite removal failed."); mark("vfx.favorite-remove");
  assert(exportQuickVfxCatalog(project).includes("horror-presence"), "Quick VFX catalog export failed."); mark("vfx.catalog-export");

  for (const finish of STUDIO_FINISH_IDS) { project = applyStudioFinish(project, finish); assert(project.postProcessing.enabled, `Studio finish ${finish} failed.`); mark(`post.finish.${finish}`); }
  project = addPostStackLayer(project, "cinematic-warm", 0.6); assert(project.creationSuite.postStack.length === 1, "Post stack add failed."); mark("post.stack-add");
  const layerId = project.creationSuite.postStack[0].id; project = updatePostStackLayer(project, layerId, { weight: 0.4, name: "Warm layer" }); assert(project.creationSuite.postStack[0].weight === 0.4, "Post stack update failed."); mark("post.stack-update");
  project = addPostStackLayer(project, "dream-glow", 0.25); project = movePostStackLayer(project, layerId, 1); assert(project.creationSuite.postStack[1].id === layerId, "Post stack move failed."); mark("post.stack-move");
  const evaluatedPost = evaluatePostStack(project); assert(evaluatedPost.bloomIntensity >= 0, "Post stack evaluation failed."); mark("post.stack-evaluate");
  project = removePostStackLayer(project, layerId); assert(project.creationSuite.postStack.length === 1, "Post stack removal failed."); mark("post.stack-remove");
  project = flattenPostStack(project); assert(project.creationSuite.postStack.length === 0, "Post stack flatten failed."); mark("post.stack-flatten");
  project = createPostStackFromFinish(project, "golden-hour"); assert(project.creationSuite.postStack.length === 1, "Finish-to-stack failed."); mark("post.finish-stack");
  assert(exportPostFinishManifest(project).includes("minemotion-post-finish-v1"), "Post manifest failed."); mark("post.manifest");
  project = clearPostStack(project); assert(project.creationSuite.postStack.length === 0, "Post stack clear failed."); mark("post.stack-clear");

  const performance = analyzeMinecraftStudioPerformance(project, "balanced"); assert(performance.score >= 0 && performance.score <= 100, "Performance analysis score is invalid."); mark("performance.analyze");
  project = applyMinecraftStudioPerformanceTarget(project, "low-end"); assert(project.creationSuite.worldStudio.area.maxActiveChunks <= 49, "Performance target did not bound active chunks."); mark("performance.target");
  project = optimizeAllVoxelModels(project); mark("performance.models");
  project = disableOffAreaEffects(project); mark("performance.effects");
  project = autoOptimizeMinecraftStudio(project, "balanced"); mark("performance.auto");
  assert(exportOptimizationReport(project, "balanced").includes("minemotion-studio-performance-v1"), "Performance report export failed."); mark("performance.report");

  const packageRig = autoRigVoxelModel(project, modelId, "alex", "Package Simple Rig", [4, 80, 4]); project = packageRig.project;
  const creationPackage = createMinecraftStudioPackage(project, "balanced"); assert(creationPackage.entries.some((entry) => entry.path.endsWith(".obj")), "Creation package omitted OBJ models."); mark("package.create");
  assert(creationPackage.entries.some((entry) => entry.path === "world/streaming-plan.json"), "Creation package omitted streaming plan."); mark("package.streaming");
  assert(creationPackage.entries.some((entry) => entry.path.endsWith(".mmblueprint.json")), "Creation package omitted active blueprint."); mark("package.blueprint");
  assert(creationPackage.entries.some((entry) => entry.path.endsWith(".simple-rig.json")), "Creation package omitted simple rigs."); mark("package.simple-rigs");
  assert(creationPackage.entries.some((entry) => entry.path.startsWith("mods/") && entry.path.endsWith("-assets.json")), "Creation package omitted mod asset reports."); mark("package.mod-assets");
  assert(serializeMinecraftStudioPackage(project).includes("minemotion-minecraft-creation-suite-v1"), "Creation package serialization failed."); mark("package.serialize");
  const reopenedSuite = sanitizeMinecraftCreationSuite(JSON.parse(JSON.stringify(project.creationSuite)));
  assert(reopenedSuite.worldStudio.seed === project.creationSuite.worldStudio.seed && reopenedSuite.models.length === project.creationSuite.models.length && reopenedSuite.collisions.enabled === project.creationSuite.collisions.enabled, "Creation Suite persistence round-trip failed."); mark("persistence.roundtrip");
  const packageCharacter = packageRig.characterId ? project.scene.characters.find((entry) => entry.id === packageRig.characterId) : null;
  assert(packageCharacter?.customGeometry && packageCharacter.customGeometry.cubes.length > 0, "Acceptance simple rig was not available for persistence validation.");
  const reopenedCharacter = sanitizeCharacterRig(JSON.parse(JSON.stringify(packageCharacter)));
  assert(reopenedCharacter.customGeometry?.sourceModelId === packageCharacter?.customGeometry?.sourceModelId && reopenedCharacter.customGeometry?.cubes.length === packageCharacter?.customGeometry?.cubes.length && reopenedCharacter.customGeometry?.cubes.every((cube) => cube.size.every((entry) => Number.isFinite(entry) && entry > 0)) === true, "Custom voxel rig geometry did not survive sanitization and reload."); mark("persistence.custom-rig");

  const expected = new Set(MINECRAFT_CREATION_FEATURE_SEEDS.map((feature) => feature.acceptanceId));
  const missing = [...expected].filter((id) => !covered.has(id));
  assert(missing.length === 0, `Creation Suite acceptance did not execute: ${missing.join(", ")}`);
  return {
    project,
    creationFeatures: MINECRAFT_CREATION_FEATURE_SEEDS.length,
    chunks: project.world?.importedChunks?.length ?? 0,
    models: project.creationSuite.models.length,
    rigs: project.scene.characters.length,
    effects: project.effects.instances.length
  };
}
