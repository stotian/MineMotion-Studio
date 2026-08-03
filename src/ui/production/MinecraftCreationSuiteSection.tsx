import { useMemo, useState } from "react";
import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { downloadBrowserBlob } from "../../export/BrowserDownload";
import { useLocalization } from "../../localization/LocalizationContext";
import { configureWorldStudio, buildSeedProxyArea, createBlankStudioStage, createWorldStudioManifest } from "../../minecraft/studio/MinecraftWorldStudio";
import { analyzeModCompatibility, listMinecraftEntityCatalog, parseModManifest, removeModDescriptor, setModEnabled, upsertModDescriptor } from "../../minecraft/studio/ModAssetCatalog";
import type { MinecraftModLoader, MinecraftWorldSourceMode, StudioBiomePreset, WorldEditOperationKind } from "../../minecraft/studio/MinecraftStudioTypes";
import { addWorldEditOperation, bakeWorldEdits, clearWorldEditOperations, createWorldEditManifest, removeWorldEditOperation, updateWorldEditOperation } from "../../minecraft/studio/WorldEditLayer";
import { analyzeWorldEditSelection, createCylinderBrush, createLineBrush, createMinecraftStructure, createSphereBrush, duplicateWorldEditLayer, exportWorldEditBlueprint, importWorldEditBlueprint, mirrorWorldEditLayer, MINECRAFT_STRUCTURE_TEMPLATE_IDS, type MinecraftStructureTemplateId } from "../../minecraft/studio/MinecraftBuilderAdvanced";
import { addVoxelCube, arrayVoxelModel, compileVoxelModelToObj, createVoxelModel, createVoxelModelManifest, deleteVoxelModel, mirrorVoxelModel, optimizeVoxelModel, syncVoxelModelToScene } from "../../minecraft/studio/VoxelModeling";
import { addVoxelPrimitive, createVoxelModelTemplate, duplicateVoxelModel, mergeAdjacentVoxelCubes, VOXEL_MODEL_TEMPLATE_IDS, VOXEL_PRIMITIVE_KINDS, type VoxelModelTemplateId, type VoxelPrimitiveKind } from "../../minecraft/studio/VoxelModelingAdvanced";
import { applyPresetToRigGroup, createRigGroup, createRigGroupManifest, deleteRigGroup, mirrorRigGroupPose, offsetRigGroupAnimation, spawnCatalogEntity, synchronizeRigGroupPose, updateRigGroup } from "../../minecraft/studio/MultiRigAnimator";
import { RIG_ANIMATION_PRESETS } from "../../rigs/AnimationPresetLibrary";
import { addRigGroupTimingVariation, animateRigGroupTranslation, arrangeRigGroup, faceRigGroupTarget, RIG_GROUP_FORMATIONS, spawnRigCrowd, type RigGroupFormation } from "../../minecraft/studio/MultiRigStudio";
import { analyzeCollisions, createDefaultCollisionProfiles, exportCollisionManifest, resolveEntityCollisions, setCollisionStudioEnabled, setCollisionVisualization, setEntityCollisionEnabled, setWorldCollisionEnabled, snapAllEntitiesToWorld, synchronizeCollisionHelpers } from "../../minecraft/studio/CollisionStudio";
import { analyzeCollisionTimeline, bakeCollisionAvoidance, exportCollisionTimelineReport } from "../../minecraft/studio/CollisionAnimationBaker";
import { addQuickVfxFavorite, exportQuickVfxCatalog, insertQuickVfx, QUICK_VFX_PRESET_IDS, type QuickVfxPresetId } from "../../minecraft/studio/QuickVfxStudio";
import { addPostStackLayer, applyStudioFinish, clearPostStack, createPostStackFromFinish, exportPostFinishManifest, flattenPostStack, STUDIO_FINISH_IDS, type StudioFinishId } from "../../minecraft/studio/PostFinishStudio";
import { analyzeMinecraftStudioPerformance, autoOptimizeMinecraftStudio, exportOptimizationReport, STUDIO_PERFORMANCE_TARGETS, type StudioPerformanceTarget } from "../../minecraft/studio/MinecraftStudioOptimization";
import { serializeMinecraftStudioPackage } from "../../minecraft/studio/MinecraftStudioPackage";
import { analyzeWorldStreaming, exportWorldStreamingManifest } from "../../minecraft/studio/WorldStreamingStudio";
import { activateModResourcePack, bindImportedAssetsToMod, createModBlockPaletteProp, discoverImportedModAssets, exportModAssetUsageManifest, insertModAssetIntoScene } from "../../minecraft/studio/ModAssetBridge";
import { autoRigVoxelModel, detachRiggedGeometry, exportSimpleRigManifest, refreshRiggedGeometryFromModel, setRiggedGeometryVisible, validateSimpleRig } from "../../minecraft/studio/SimpleRiggingStudio";

interface MinecraftCreationSuiteSectionProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

const LOADERS: MinecraftModLoader[] = ["vanilla", "fabric", "forge", "neoforge", "quilt"];
const SOURCE_MODES: MinecraftWorldSourceMode[] = ["imported-save", "seed-proxy", "blank-stage"];
const BIOMES: StudioBiomePreset[] = ["plains", "forest", "desert", "snow", "nether", "end"];
const EDIT_KINDS: WorldEditOperationKind[] = ["set", "erase", "fill", "replace", "clone"];

export function MinecraftCreationSuiteSection({ project, onProjectChange }: MinecraftCreationSuiteSectionProps) {
  const { t } = useLocalization();
  const suite = project.creationSuite;
  const tab = suite.workspace.activeTab;
  const [modManifest, setModManifest] = useState('{"id":"example_mod","name":"Example Mod","version":"1.0","loader":"fabric","namespace":"example","entities":["example:mob"],"blocks":["example:block"],"assets":["example:model"]}');
  const [feedback, setFeedback] = useState("");
  const [editKind, setEditKind] = useState<WorldEditOperationKind>("fill");
  const [from, setFrom] = useState<Vector3Tuple>([0, 64, 0]);
  const [to, setTo] = useState<Vector3Tuple>([3, 67, 3]);
  const [destination, setDestination] = useState<Vector3Tuple>([6, 64, 0]);
  const [blockName, setBlockName] = useState("minecraft:stone");
  const [matchBlockName, setMatchBlockName] = useState("minecraft:dirt");
  const [structureTemplate, setStructureTemplate] = useState<MinecraftStructureTemplateId>("village-house");
  const [blueprintJson, setBlueprintJson] = useState("");
  const [modelName, setModelName] = useState("Minecraft Prop");
  const [primitive, setPrimitive] = useState<VoxelPrimitiveKind>("cube");
  const [template, setTemplate] = useState<VoxelModelTemplateId>("sword");
  const [entityId, setEntityId] = useState("steve");
  const [crowdCount, setCrowdCount] = useState(6);
  const [formation, setFormation] = useState<RigGroupFormation>("grid");
  const [animationPreset, setAnimationPreset] = useState(RIG_ANIMATION_PRESETS[1]?.id ?? RIG_ANIMATION_PRESETS[0]?.id ?? "walk-cycle");
  const [vfxPreset, setVfxPreset] = useState<QuickVfxPresetId>("tnt-explosion");
  const [finishId, setFinishId] = useState<StudioFinishId>("clean-film");
  const [performanceTarget, setPerformanceTarget] = useState<StudioPerformanceTarget>("balanced");
  const [simpleRigId, setSimpleRigId] = useState("");
  const selectedModel = suite.models.find((model) => model.id === suite.workspace.selectedModelId) ?? suite.models[0] ?? null;
  const selectedGroup = suite.rigGroups.find((group) => group.id === suite.workspace.selectedRigGroupId) ?? suite.rigGroups[0] ?? null;
  const entityCatalog = useMemo(() => listMinecraftEntityCatalog(project), [project]);
  const selectedEntity = entityCatalog.find((entry) => entry.id === entityId) ?? entityCatalog[0] ?? null;
  const modReport = useMemo(() => analyzeModCompatibility(project), [project]);
  const collisionReport = useMemo(() => analyzeCollisions(project), [project]);
  const collisionTimelineReport = useMemo(() => analyzeCollisionTimeline(project, 0, project.animation.durationFrames, Math.max(1, Math.round(project.animation.fps / 2))), [project]);
  const performanceReport = useMemo(() => analyzeMinecraftStudioPerformance(project, performanceTarget), [project, performanceTarget]);
  const streamingReport = useMemo(() => analyzeWorldStreaming(project), [project]);
  const simpleRigCharacters = useMemo(() => project.scene.characters.filter((character) => Boolean(character.customGeometry)), [project]);
  const selectedSimpleRig = simpleRigCharacters.find((character) => character.id === simpleRigId) ?? simpleRigCharacters[0] ?? null;
  const selectedSimpleRigReport = selectedSimpleRig ? validateSimpleRig(project, selectedSimpleRig.id) : null;
  const buildSelectionReport = useMemo(() => analyzeWorldEditSelection(project), [project]);

  const apply = (next: MineMotionProject, label: string, message?: string) => {
    if (next === project) {
      if (message) setFeedback(message);
      return;
    }
    onProjectChange(next, label);
    if (message) setFeedback(message);
  };
  const setTab = (nextTab: typeof tab) => apply({ ...project, creationSuite: { ...suite, workspace: { ...suite.workspace, activeTab: nextTab } } }, `Open ${nextTab} Creation Suite tab`);
  const downloadText = (content: string, filename: string, type = "application/json") => downloadBrowserBlob(new Blob([content], { type }), filename);

  const buildProxy = () => {
    const prepared = configureWorldStudio(project, { sourceMode: "seed-proxy" });
    const result = buildSeedProxyArea(prepared);
    apply(result.project, "Build bounded Minecraft seed proxy", t("creation.feedback.worldBuilt", { chunks: result.chunksBuilt, blocks: result.blocksBuilt }));
  };
  const createBlank = () => {
    const prepared = configureWorldStudio(project, { sourceMode: "blank-stage" });
    const result = createBlankStudioStage(prepared);
    apply(result.project, "Create blank Minecraft stage", t("creation.feedback.blankStage"));
  };
  const importManifest = () => {
    try {
      const descriptor = parseModManifest(modManifest, suite.worldStudio.loader);
      apply(upsertModDescriptor(project, descriptor), "Import safe mod asset manifest", t("creation.feedback.modImported", { name: descriptor.name }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    }
  };
  const addEdit = () => {
    const next = addWorldEditOperation(project, { kind: editKind, from, to, destination, blockName, matchBlockName });
    apply(next, `Add ${editKind} world edit`, t("creation.feedback.editAdded", { kind: editKind }));
  };
  const createModel = () => {
    const result = createVoxelModel(project, modelName);
    apply(result.project, "Create voxel model", t("creation.feedback.modelCreated"));
  };
  const addPrimitive = () => {
    if (!selectedModel) return;
    const result = addVoxelPrimitive(project, selectedModel.id, primitive, { position: [0, 0, 0], size: [2, 2, 2], color: "#8f98a3", materialName: "minecraft" });
    apply(result.project, `Add ${primitive} voxel primitive`, t("creation.feedback.primitiveAdded", { primitive }));
  };
  const createTemplate = () => {
    const result = createVoxelModelTemplate(project, template);
    apply(result.project, `Create ${template} voxel template`, t("creation.feedback.templateCreated", { template }));
  };
  const spawnEntity = () => {
    if (!selectedEntity) return;
    const result = spawnCatalogEntity(project, selectedEntity, [0, 1.05, 0]);
    apply(result.project, `Spawn ${selectedEntity.name} rig`, t("creation.feedback.entitySpawned", { name: selectedEntity.name }));
  };
  const spawnCrowd = () => {
    if (!selectedEntity) return;
    const result = spawnRigCrowd(project, selectedEntity, { count: crowdCount, origin: [0, 1.05, 0], groupName: `${selectedEntity.name} Crowd` });
    apply(result.project, `Spawn ${selectedEntity.name} crowd`, t("creation.feedback.crowdSpawned", { count: result.affectedCharacterIds.length }));
  };
  const groupAll = () => {
    const result = createRigGroup(project, "Scene Cast", project.scene.characters.map((character) => character.id));
    apply(result.project, "Create rig group from scene cast", t("creation.feedback.groupCreated"));
  };
  const insertVfx = () => {
    const target = project.scene.characters[0];
    const result = insertQuickVfx(project, vfxPreset, { frame: project.animation.currentFrame, targetObjectId: target?.id ?? "", position: target?.transform.position ?? [0, 1, 0] });
    if (result.changed) apply(result.project, `Insert ${vfxPreset} Quick VFX`, t("creation.feedback.vfxInserted", { count: result.effectIds.length }));
    else setFeedback(result.error ?? t("creation.feedback.noChange"));
  };

  return (
    <section className="director-studio-pro minecraft-creation-suite">
      <div className="section-heading-row">
        <div>
          <h3>{t("creation.title")}</h3>
          <p>{t("creation.subtitle")}</p>
        </div>
        <div className="director-status-pill">{t("creation.summary", { chunks: project.world?.importedChunks?.length ?? 0, models: suite.models.length, rigs: project.scene.characters.length, effects: project.effects.instances.length })}</div>
      </div>

      <div className="production-toolbar compact creation-tabs">
        {(["world", "build", "model", "rig", "collision", "finish"] as const).map((entry) => (
          <button type="button" key={entry} className={tab === entry ? "active" : ""} onClick={() => setTab(entry)}>{t(`creation.tab.${entry}`)}</button>
        ))}
      </div>

      {feedback && <p className="success-note">{feedback}</p>}

      {tab === "world" && <div className="director-choreography">
        <h4>{t("creation.world.title")}</h4>
        <p>{t("creation.world.exactNote")}</p>
        <div className="form-grid three-columns">
          <label>{t("creation.world.sourceMode")}
            <select value={suite.worldStudio.sourceMode} onChange={(event) => apply(configureWorldStudio(project, { sourceMode: event.target.value as MinecraftWorldSourceMode }), "Change world source mode")}>
              {SOURCE_MODES.map((mode) => <option key={mode} value={mode}>{t(`creation.world.source.${mode}`)}</option>)}
            </select>
          </label>
          <label>{t("creation.world.seed")}<input value={suite.worldStudio.seed} onChange={(event) => apply(configureWorldStudio(project, { seed: event.target.value }), "Update Minecraft seed")} /></label>
          <label>{t("creation.world.version")}<input value={suite.worldStudio.minecraftVersion} onChange={(event) => apply(configureWorldStudio(project, { minecraftVersion: event.target.value }), "Update Minecraft version")} /></label>
          <label>{t("creation.world.loader")}
            <select value={suite.worldStudio.loader} onChange={(event) => apply(configureWorldStudio(project, { loader: event.target.value as MinecraftModLoader }), "Update mod loader")}>
              {LOADERS.map((loader) => <option key={loader} value={loader}>{loader}</option>)}
            </select>
          </label>
          <label>{t("creation.world.biome")}
            <select value={suite.worldStudio.biomePreset} onChange={(event) => apply(configureWorldStudio(project, { biomePreset: event.target.value as StudioBiomePreset }), "Update proxy biome")}>
              {BIOMES.map((biome) => <option key={biome} value={biome}>{biome}</option>)}
            </select>
          </label>
          <label>{t("creation.world.radius")}<input type="number" min={0} max={32} value={suite.worldStudio.area.radiusChunks} onChange={(event) => apply(configureWorldStudio(project, { area: { radiusChunks: Number(event.target.value) || 0 } }), "Update world area radius")} /></label>
          <label>{t("creation.world.maxChunks")}<input type="number" min={1} max={1024} value={suite.worldStudio.area.maxActiveChunks} onChange={(event) => apply(configureWorldStudio(project, { area: { maxActiveChunks: Number(event.target.value) || 1 } }), "Update active chunk budget")} /></label>
          <label>{t("creation.world.centerX")}<input type="number" value={suite.worldStudio.area.centerChunkX} onChange={(event) => apply(configureWorldStudio(project, { area: { centerChunkX: Number(event.target.value) || 0 } }), "Update world center X")} /></label>
          <label>{t("creation.world.centerZ")}<input type="number" value={suite.worldStudio.area.centerChunkZ} onChange={(event) => apply(configureWorldStudio(project, { area: { centerChunkZ: Number(event.target.value) || 0 } }), "Update world center Z")} /></label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={buildProxy}>{t("creation.world.buildProxy")}</button>
          <button type="button" onClick={createBlank}>{t("creation.world.blankStage")}</button>
          <button type="button" onClick={() => downloadText(createWorldStudioManifest(project), "minemotion-world-studio.json")}>{t("creation.exportManifest")}</button>
          <button type="button" onClick={() => downloadText(exportWorldStreamingManifest(project), "minemotion-world-streaming.json")}>{t("creation.world.streamingExport")}</button>
        </div>
        <p>{t("creation.world.streamingSummary", { selected: streamingReport.selectedChunks, total: streamingReport.sourceChunks, blocks: streamingReport.selectedBlocks })}</p>
        <h4>{t("creation.mods.title")}</h4>
        <textarea rows={5} value={modManifest} onChange={(event) => setModManifest(event.target.value)} aria-label={t("creation.mods.manifest")} />
        <div className="production-toolbar compact">
          <button type="button" onClick={importManifest}>{t("creation.mods.import")}</button>
          <span>{t("creation.mods.compatibility", { compatible: modReport.compatible.length, incompatible: modReport.incompatible.length, entities: modReport.entityCount })}</span>
        </div>
        <div className="render-job-list">
          {suite.worldStudio.mods.map((mod) => <article className="render-job" key={mod.id}>
            <div><strong>{mod.name}</strong><span>{mod.version} · {mod.loader} · {mod.entityIds.length} entities · {mod.blockIds.length} blocks</span></div>
            <div className="render-job-actions">
              <button type="button" onClick={() => apply(setModEnabled(project, mod.id, !mod.enabled), "Toggle mod manifest")}>{mod.enabled ? t("common.enabled") : t("common.disabled")}</button>
              <button type="button" onClick={() => { const result = bindImportedAssetsToMod(project, mod.id); apply(result.project, "Bind imported mod assets", t("creation.mods.bound", { assets: discoverImportedModAssets(result.project, mod.id).discovered.length })); }}>{t("creation.mods.bindAssets")}</button>
              <button type="button" onClick={() => { const result = activateModResourcePack(project, mod.id); apply(result.project, "Activate mod resource pack", result.warnings[0]); }}>{t("creation.mods.activatePack")}</button>
              <button type="button" onClick={() => { const result = createModBlockPaletteProp(project, mod.id); apply(result.project, "Create mod block palette", result.warnings[0]); }}>{t("creation.mods.palette")}</button>
              <button type="button" onClick={() => { const asset = discoverImportedModAssets(project, mod.id).discovered.find((entry) => entry.kind === "obj"); if (!asset) { setFeedback(t("creation.mods.noDirectAsset")); return; } const result = insertModAssetIntoScene(project, mod.id, asset.id); apply(result.project, "Insert mod asset", result.warnings[0]); }}>{t("creation.mods.insertAsset")}</button>
              <button type="button" onClick={() => downloadText(exportModAssetUsageManifest(project, mod.id), `${safeName(mod.name)}-assets.json`)}>{t("creation.mods.exportAssets")}</button>
              <button type="button" onClick={() => apply(removeModDescriptor(project, mod.id), "Remove mod manifest")}>{t("creation.remove")}</button>
            </div>
          </article>)}
        </div>
      </div>}

      {tab === "build" && <div className="director-choreography">
        <h4>{t("creation.build.title")}</h4>
        <p>{t("creation.build.subtitle")}</p>
        <div className="form-grid three-columns">
          <label>{t("creation.build.operation")}<select value={editKind} onChange={(event) => setEditKind(event.target.value as WorldEditOperationKind)}>{EDIT_KINDS.map((kind) => <option value={kind} key={kind}>{kind}</option>)}</select></label>
          <label>{t("creation.build.structure")}<select value={structureTemplate} onChange={(event) => setStructureTemplate(event.target.value as MinecraftStructureTemplateId)}>{MINECRAFT_STRUCTURE_TEMPLATE_IDS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
          <VectorFields label={t("creation.build.from")} value={from} onChange={setFrom} />
          <VectorFields label={t("creation.build.to")} value={to} onChange={setTo} />
          {editKind === "clone" && <VectorFields label={t("creation.build.destination")} value={destination} onChange={setDestination} />}
          {editKind !== "erase" && <label>{t("creation.build.block")}<input value={blockName} onChange={(event) => setBlockName(event.target.value)} /></label>}
          {editKind === "replace" && <label>{t("creation.build.match")}<input value={matchBlockName} onChange={(event) => setMatchBlockName(event.target.value)} /></label>}
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={addEdit}>{t("creation.build.add")}</button>
          <button type="button" disabled={suite.worldEdits.length === 0} onClick={() => apply(bakeWorldEdits(project), "Bake world edits")}>{t("creation.build.bake")}</button>
          <button type="button" disabled={suite.worldEdits.length === 0} onClick={() => apply(clearWorldEditOperations(project), "Clear world edits")}>{t("creation.clear")}</button>
          <button type="button" onClick={() => downloadText(createWorldEditManifest(project), "minemotion-world-edits.json")}>{t("creation.exportManifest")}</button>
          <button type="button" onClick={() => { const size: Vector3Tuple = [Math.abs(to[0] - from[0]) + 1, Math.abs(to[1] - from[1]) + 1, Math.abs(to[2] - from[2]) + 1]; const result = createMinecraftStructure(project, structureTemplate, from, { width: size[0], height: size[1], depth: size[2], blockName, accentBlockName: matchBlockName }); apply(result.project, "Create Minecraft structure", result.warnings[0]); }}>{t("creation.build.createStructure")}</button>
          <button type="button" onClick={() => { const result = createLineBrush(project, from, to, blockName); apply(result.project, "Create line brush", result.warnings[0]); }}>{t("creation.build.lineBrush")}</button>
          <button type="button" onClick={() => { const radius = Math.max(1, Math.round(Math.abs(to[0] - from[0]) / 2)); const result = createSphereBrush(project, from, radius, blockName, true); apply(result.project, "Create sphere brush", result.warnings[0]); }}>{t("creation.build.sphereBrush")}</button>
          <button type="button" onClick={() => { const radius = Math.max(1, Math.round(Math.abs(to[0] - from[0]) / 2)); const height = Math.max(1, Math.abs(to[1] - from[1]) + 1); const result = createCylinderBrush(project, from, radius, height, blockName, false); apply(result.project, "Create cylinder brush", result.warnings[0]); }}>{t("creation.build.cylinderBrush")}</button>
          <button type="button" disabled={suite.worldEdits.length === 0} onClick={() => apply(mirrorWorldEditLayer(project, "x", from[0]).project, "Mirror builder layer")}>{t("creation.build.mirrorLayer")}</button>
          <button type="button" disabled={suite.worldEdits.length === 0} onClick={() => apply(duplicateWorldEditLayer(project, destination).project, "Duplicate builder layer")}>{t("creation.build.duplicateLayer")}</button>
          <button type="button" disabled={suite.worldEdits.length === 0} onClick={() => { const content = exportWorldEditBlueprint(project, project.projectName); setBlueprintJson(content); downloadText(content, `${safeName(project.projectName)}.mmblueprint.json`); }}>{t("creation.build.exportBlueprint")}</button>
        </div>
        <p>{t("creation.build.selectionSummary", { operations: buildSelectionReport.operations, blocks: buildSelectionReport.estimatedBlocks })}</p>
        <textarea rows={4} value={blueprintJson} onChange={(event) => setBlueprintJson(event.target.value)} placeholder={t("creation.build.blueprintPlaceholder")} />
        <div className="production-toolbar compact"><button type="button" disabled={!blueprintJson.trim()} onClick={() => { try { const result = importWorldEditBlueprint(project, blueprintJson, destination); apply(result.project, "Import Minecraft blueprint", result.warnings[0] ?? result.blueprintName); } catch (error) { setFeedback(error instanceof Error ? error.message : String(error)); } }}>{t("creation.build.importBlueprint")}</button></div>
        <div className="render-job-list">
          {suite.worldEdits.map((operation) => <article className={`render-job ${operation.enabled ? "" : "render-job-cancelled"}`} key={operation.id}>
            <div><strong>{operation.name}</strong><span>{operation.kind} · {operation.from.join(", ")} → {operation.to.join(", ")}</span></div>
            <div className="render-job-actions">
              <button type="button" onClick={() => apply(updateWorldEditOperation(project, operation.id, { enabled: !operation.enabled }), "Toggle world edit")}>{operation.enabled ? t("common.enabled") : t("common.disabled")}</button>
              <button type="button" onClick={() => apply(removeWorldEditOperation(project, operation.id), "Remove world edit")}>{t("creation.remove")}</button>
            </div>
          </article>)}
        </div>
      </div>}

      {tab === "model" && <div className="director-choreography">
        <h4>{t("creation.model.title")}</h4>
        <div className="form-grid three-columns">
          <label>{t("creation.model.name")}<input value={modelName} onChange={(event) => setModelName(event.target.value)} /></label>
          <label>{t("creation.model.selected")}
            <select value={selectedModel?.id ?? ""} onChange={(event) => apply({ ...project, creationSuite: { ...suite, workspace: { ...suite.workspace, selectedModelId: event.target.value || null, activeTab: "model" } } }, "Select voxel model")}>
              <option value="">{t("common.none")}</option>{suite.models.map((model) => <option key={model.id} value={model.id}>{model.name} ({model.cubes.length})</option>)}
            </select>
          </label>
          <label>{t("creation.model.primitive")}<select value={primitive} onChange={(event) => setPrimitive(event.target.value as VoxelPrimitiveKind)}>{VOXEL_PRIMITIVE_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label>
          <label>{t("creation.model.template")}<select value={template} onChange={(event) => setTemplate(event.target.value as VoxelModelTemplateId)}>{VOXEL_MODEL_TEMPLATE_IDS.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={createModel}>{t("creation.model.create")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(addVoxelCube(project, selectedModel.id).project, "Add voxel cube")}>{t("creation.model.addCube")}</button>
          <button type="button" disabled={!selectedModel} onClick={addPrimitive}>{t("creation.model.addPrimitive")}</button>
          <button type="button" onClick={createTemplate}>{t("creation.model.createTemplate")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(mirrorVoxelModel(project, selectedModel.id, "x", true).project, "Mirror voxel model")}>{t("creation.model.mirror")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(arrayVoxelModel(project, selectedModel.id, 3, [3, 0, 0]).project, "Array voxel model")}>{t("creation.model.array")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(mergeAdjacentVoxelCubes(project, selectedModel.id).project, "Merge voxel cubes")}>{t("creation.model.merge")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(optimizeVoxelModel(project, selectedModel.id).project, "Optimize voxel model")}>{t("creation.optimize")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(duplicateVoxelModel(project, selectedModel.id).project, "Duplicate voxel model")}>{t("creation.duplicate")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(syncVoxelModelToScene(project, selectedModel.id).project, "Sync voxel model to scene")}>{t("creation.model.sync")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && downloadText(compileVoxelModelToObj(selectedModel), `${safeName(selectedModel.name)}.obj`, "text/plain")}>{t("creation.model.exportObj")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && downloadText(createVoxelModelManifest(selectedModel), `${safeName(selectedModel.name)}.model.json`)}>{t("creation.exportManifest")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => selectedModel && apply(deleteVoxelModel(project, selectedModel.id).project, "Delete voxel model")}>{t("creation.remove")}</button>
        </div>
        {selectedModel && <p>{t("creation.model.summary", { cubes: selectedModel.cubes.length, linked: selectedModel.sceneObjectId ? t("common.enabled") : t("common.disabled") })}</p>}
      </div>}

      {tab === "rig" && <div className="director-choreography">
        <h4>{t("creation.rig.title")}</h4>
        <div className="form-grid three-columns">
          <label>{t("creation.rig.entity")}<select value={selectedEntity?.id ?? ""} onChange={(event) => setEntityId(event.target.value)}>{entityCatalog.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.source}</option>)}</select></label>
          <label>{t("creation.rig.crowdCount")}<input type="number" min={1} max={128} value={crowdCount} onChange={(event) => setCrowdCount(Math.max(1, Number(event.target.value) || 1))} /></label>
          <label>{t("creation.rig.group")}<select value={selectedGroup?.id ?? ""} onChange={(event) => apply({ ...project, creationSuite: { ...suite, workspace: { ...suite.workspace, selectedRigGroupId: event.target.value || null, activeTab: "rig" } } }, "Select rig group")}><option value="">{t("common.none")}</option>{suite.rigGroups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.characterIds.length})</option>)}</select></label>
          <label>{t("creation.rig.animation")}<select value={animationPreset} onChange={(event) => setAnimationPreset(event.target.value)}>{RIG_ANIMATION_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <label>{t("creation.rig.formation")}<select value={formation} onChange={(event) => setFormation(event.target.value as RigGroupFormation)}>{RIG_GROUP_FORMATIONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
        </div>
        <div className="form-grid three-columns">
          <label>{t("creation.rig.simpleRig")}<select value={selectedSimpleRig?.id ?? ""} onChange={(event) => setSimpleRigId(event.target.value)}><option value="">{t("common.none")}</option>{simpleRigCharacters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
          <label>{t("creation.rig.sourceModel")}<select value={selectedModel?.id ?? ""} onChange={(event) => apply({ ...project, creationSuite: { ...suite, workspace: { ...suite.workspace, selectedModelId: event.target.value || null, activeTab: "rig" } } }, "Select source voxel model")}><option value="">{t("common.none")}</option>{suite.models.map((model) => <option key={model.id} value={model.id}>{model.name} ({model.cubes.length})</option>)}</select></label>
          <span>{selectedSimpleRigReport ? t("creation.rig.simpleSummary", { cubes: selectedSimpleRigReport.cubes, bones: selectedSimpleRigReport.emptyBoneIds.length, valid: selectedSimpleRigReport.valid ? t("common.enabled") : t("common.disabled") }) : t("creation.rig.simpleEmpty")}</span>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedModel} onClick={() => { if (!selectedModel) return; const result = autoRigVoxelModel(project, selectedModel.id, "steve", `${selectedModel.name} Rig`); apply(result.project, "Auto-rig voxel model", result.warnings[0]); if (result.characterId) setSimpleRigId(result.characterId); }}>{t("creation.rig.autoRigSteve")}</button>
          <button type="button" disabled={!selectedModel} onClick={() => { if (!selectedModel) return; const result = autoRigVoxelModel(project, selectedModel.id, "alex", `${selectedModel.name} Slim Rig`); apply(result.project, "Auto-rig voxel model", result.warnings[0]); if (result.characterId) setSimpleRigId(result.characterId); }}>{t("creation.rig.autoRigAlex")}</button>
          <button type="button" disabled={!selectedSimpleRig} onClick={() => selectedSimpleRig && apply(refreshRiggedGeometryFromModel(project, selectedSimpleRig.id).project, "Refresh simple rig geometry")}>{t("creation.rig.refreshGeometry")}</button>
          <button type="button" disabled={!selectedSimpleRig} onClick={() => selectedSimpleRig && apply(setRiggedGeometryVisible(project, selectedSimpleRig.id, !(selectedSimpleRig.customGeometry?.hideDefaultGeometry ?? true)).project, "Toggle rig geometry display")}>{t("creation.rig.toggleGeometry")}</button>
          <button type="button" disabled={!selectedSimpleRig} onClick={() => selectedSimpleRig && downloadText(exportSimpleRigManifest(project, selectedSimpleRig.id), `${safeName(selectedSimpleRig.name)}.simple-rig.json`)}>{t("creation.rig.exportSimple")}</button>
          <button type="button" disabled={!selectedSimpleRig} onClick={() => selectedSimpleRig && apply(detachRiggedGeometry(project, selectedSimpleRig.id).project, "Detach simple rig geometry")}>{t("creation.rig.detachGeometry")}</button>
        </div>
        <div className="production-toolbar compact">
          <button type="button" disabled={!selectedEntity} onClick={spawnEntity}>{t("creation.rig.spawn")}</button>
          <button type="button" disabled={!selectedEntity} onClick={spawnCrowd}>{t("creation.rig.spawnCrowd")}</button>
          <button type="button" disabled={project.scene.characters.length === 0} onClick={groupAll}>{t("creation.rig.groupAll")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(updateRigGroup(project, selectedGroup.id, { defaultPresetId: animationPreset, staggerFrames: 2, mirrorAlternating: true }).project, "Configure rig group")}>{t("creation.rig.configure")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(applyPresetToRigGroup(project, selectedGroup.id, animationPreset, project.animation.currentFrame).project, "Animate rig group")}>{t("creation.rig.animate")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(arrangeRigGroup(project, selectedGroup.id, formation).project, "Arrange rig group")}>{t("creation.rig.arrange")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(animateRigGroupTranslation(project, selectedGroup.id, [0, 0, -8], project.animation.currentFrame, project.animation.fps * 2).project, "Move rig group")}>{t("creation.rig.move")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(addRigGroupTimingVariation(project, selectedGroup.id, 4).project, "Add rig timing variation")}>{t("creation.rig.variation")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(synchronizeRigGroupPose(project, selectedGroup.id).project, "Synchronize rig poses")}>{t("creation.rig.syncPose")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(mirrorRigGroupPose(project, selectedGroup.id).project, "Mirror rig poses")}>{t("creation.rig.mirrorPose")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(offsetRigGroupAnimation(project, selectedGroup.id, 5).project, "Offset rig animation")}>{t("creation.rig.offset")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(faceRigGroupTarget(project, selectedGroup.id, [0, 1, -10]).project, "Face rig group target")}>{t("creation.rig.face")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && downloadText(createRigGroupManifest(project, selectedGroup.id), `${safeName(selectedGroup.name)}.rig-group.json`)}>{t("creation.exportManifest")}</button>
          <button type="button" disabled={!selectedGroup} onClick={() => selectedGroup && apply(deleteRigGroup(project, selectedGroup.id).project, "Delete rig group")}>{t("creation.remove")}</button>
        </div>
      </div>}

      {tab === "collision" && <div className="director-choreography">
        <h4>{t("creation.collision.title")}</h4>
        <div className="production-toolbar compact">
          <button type="button" onClick={() => apply(setCollisionStudioEnabled(project, !suite.collisions.enabled), "Toggle Collision Studio")}>{suite.collisions.enabled ? t("creation.collision.disable") : t("creation.collision.enable")}</button>
          <button type="button" onClick={() => apply(setWorldCollisionEnabled(project, !suite.collisions.worldCollision), "Toggle world collision")}>{t("creation.collision.world")}: {suite.collisions.worldCollision ? t("common.enabled") : t("common.disabled")}</button>
          <button type="button" onClick={() => apply(setEntityCollisionEnabled(project, !suite.collisions.entityCollision), "Toggle entity collision")}>{t("creation.collision.entities")}: {suite.collisions.entityCollision ? t("common.enabled") : t("common.disabled")}</button>
          <button type="button" onClick={() => apply(setCollisionVisualization(project, !suite.collisions.visualize), "Toggle collision helpers")}>{t("creation.collision.helpers")}: {suite.collisions.visualize ? t("common.enabled") : t("common.disabled")}</button>
          <button type="button" onClick={() => apply(createDefaultCollisionProfiles(project), "Create collision profiles")}>{t("creation.collision.profiles")}</button>
          <button type="button" disabled={!suite.collisions.enabled} onClick={() => apply(snapAllEntitiesToWorld(project), "Snap all entities to world")}>{t("creation.collision.snap")}</button>
          <button type="button" disabled={!suite.collisions.enabled} onClick={() => apply(resolveEntityCollisions(project), "Resolve scene collisions")}>{t("creation.collision.resolve")}</button>
          <button type="button" onClick={() => apply(synchronizeCollisionHelpers(project), "Synchronize collision helpers")}>{t("creation.collision.syncHelpers")}</button>
          <button type="button" onClick={() => downloadText(exportCollisionManifest(project), "minemotion-collisions.json")}>{t("creation.exportManifest")}</button>
          <button type="button" disabled={!suite.collisions.enabled} onClick={() => { const result = bakeCollisionAvoidance(project, 0, project.animation.durationFrames); apply(result.project, "Bake collision avoidance", result.report.warnings[0]); }}>{t("creation.collision.bakeTimeline")}</button>
          <button type="button" onClick={() => downloadText(exportCollisionTimelineReport(project), "minemotion-collision-timeline.json")}>{t("creation.collision.exportTimeline")}</button>
        </div>
        <p>{t("creation.collision.summary", { entities: collisionReport.testedEntities, contacts: collisionReport.contacts.length, profiles: suite.collisions.profiles.length })}</p>
        <p>{t("creation.collision.timelineSummary", { frames: collisionTimelineReport.sampledFrames, collisionFrames: collisionTimelineReport.collisionFrames.length, peak: collisionTimelineReport.peakContacts })}</p>
        {collisionReport.warnings.map((warning) => <p className="warning-note" key={warning}>{warning}</p>)}
      </div>}

      {tab === "finish" && <div className="director-choreography">
        <h4>{t("creation.finish.title")}</h4>
        <div className="form-grid three-columns">
          <label>{t("creation.vfx.preset")}<select value={vfxPreset} onChange={(event) => setVfxPreset(event.target.value as QuickVfxPresetId)}>{QUICK_VFX_PRESET_IDS.map((preset) => <option key={preset} value={preset}>{preset}</option>)}</select></label>
          <label>{t("creation.post.finish")}<select value={finishId} onChange={(event) => setFinishId(event.target.value as StudioFinishId)}>{STUDIO_FINISH_IDS.map((finish) => <option key={finish} value={finish}>{finish}</option>)}</select></label>
          <label>{t("creation.performance.target")}<select value={performanceTarget} onChange={(event) => setPerformanceTarget(event.target.value as StudioPerformanceTarget)}>{STUDIO_PERFORMANCE_TARGETS.map((target) => <option key={target} value={target}>{target}</option>)}</select></label>
        </div>
        <div className="production-toolbar compact">
          <button type="button" onClick={insertVfx}>{t("creation.vfx.insert")}</button>
          <button type="button" onClick={() => apply(addQuickVfxFavorite(project, vfxPreset), "Save Quick VFX favorite")}>{t("creation.vfx.favorite")}</button>
          <button type="button" onClick={() => downloadText(exportQuickVfxCatalog(project), "minemotion-vfx-catalog.json")}>{t("creation.vfx.export")}</button>
          <button type="button" onClick={() => apply(applyStudioFinish(project, finishId), "Apply Studio finish")}>{t("creation.post.apply")}</button>
          <button type="button" onClick={() => apply(createPostStackFromFinish(project, finishId), "Create finish post stack")}>{t("creation.post.stackFromFinish")}</button>
          <button type="button" onClick={() => apply(addPostStackLayer(project, "cinematic-warm", 0.4), "Add post stack layer")}>{t("creation.post.addLayer")}</button>
          <button type="button" disabled={suite.postStack.length === 0} onClick={() => apply(flattenPostStack(project), "Flatten post stack")}>{t("creation.post.flatten")}</button>
          <button type="button" disabled={suite.postStack.length === 0} onClick={() => apply(clearPostStack(project), "Clear post stack")}>{t("creation.clear")}</button>
          <button type="button" onClick={() => downloadText(exportPostFinishManifest(project), "minemotion-post-finish.json")}>{t("creation.post.export")}</button>
          <button type="button" onClick={() => apply(autoOptimizeMinecraftStudio(project, performanceTarget), "Optimize Minecraft Studio project")}>{t("creation.performance.optimize")}</button>
          <button type="button" onClick={() => downloadText(exportOptimizationReport(project, performanceTarget), "minemotion-performance-report.json")}>{t("creation.performance.export")}</button>
          <button type="button" onClick={() => downloadText(serializeMinecraftStudioPackage(project, performanceTarget), "minemotion-creation-suite.mmcreation.json")}>{t("creation.package.export")}</button>
        </div>
        <p className={`${performanceReport.level === "good" ? "success" : "warning"}-note`}>{t("creation.performance.summary", { score: performanceReport.score, level: performanceReport.level, warnings: performanceReport.warnings.length })}</p>
        <div className="render-job-list">
          {suite.postStack.map((layer) => <article className="render-job" key={layer.id}><div><strong>{layer.name}</strong><span>{layer.presetId} · {Math.round(layer.weight * 100)}%</span></div></article>)}
        </div>
      </div>}
    </section>
  );
}

function VectorFields({ label, value, onChange }: { label: string; value: Vector3Tuple; onChange: (value: Vector3Tuple) => void }) {
  return <fieldset className="vector-fields"><legend>{label}</legend>{(["X", "Y", "Z"] as const).map((axis, index) => <label key={axis}>{axis}<input type="number" value={value[index]} onChange={(event) => { const next = [...value] as Vector3Tuple; next[index] = Number(event.target.value) || 0; onChange(next); }} /></label>)}</fieldset>;
}
function safeName(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "minemotion-asset"; }
