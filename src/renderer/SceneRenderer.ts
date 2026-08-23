import * as THREE from "three";
import type {
  CameraEntity,
  CharacterEntity,
  LightEntity,
  MineMotionProject,
  ObjEntity,
  TransformData
} from "../project/ProjectFile";
import { ChunkMeshBuilder as PresetChunkMeshBuilder } from "../minecraft/ChunkMeshBuilder";
import { ChunkMeshBuilder as ImportedChunkMeshBuilder } from "../minecraft/mesh/ChunkMeshBuilder";
import {
  createDefaultSteveRig,
  SteveRigTextureCache
} from "../rigs/DefaultSteveRig";
import {
  createMinecraftMaterialContextSignature,
  createSolidMaterial,
  MinecraftMaterialCache
} from "./MinecraftMaterialSystem";
import { SkySystem } from "./SkySystem";
import { WeatherSystem } from "./WeatherSystem";
import { createWorldStagingObjects } from "./WorldStagingRenderer";
import { applyWorldEditOperations } from "../minecraft/studio/WorldEditLayer";
import { getStreamedChunksForRender } from "../minecraft/studio/WorldStreamingStudio";
import { createGridFloor } from "./GridFloor";
import { computeViewportOrientation } from "./ViewportOrientation";
import { CameraController } from "./CameraController";
import { disposeThreeObjectTree } from "./ThreeResourceDisposal";
import type { ViewportSettings } from "../settings/AppSettings";
import { isSafeVfxColor } from "../vfx/core/VfxParameter";
import {
  getPreparedVfxNumber,
  getPreparedVfxString,
  prepareProjectVfxFrame,
  shouldIncludeProjectVfx,
  type PreparedProjectVfxEffect
} from "../vfx/runtime/VfxProjectFrame";
import type { VfxPrimitiveEvaluation } from "../vfx/primitives/VfxPrimitiveTypes";
import type { SampledMotionPath } from "../rigs/motion/MotionPathSampler";
import { createMotionPathObject } from "./MotionPathRenderer";
import { PerformanceMonitor } from "../performance/PerformanceMonitor";
import {
  collectProjectComplexityMetrics,
  readBrowserHeapMetrics,
  sanitizeRendererFrameInfo,
  type RendererMetricsSnapshot
} from "../performance/RendererMetrics";
import {
  resolveRendererLayerVisibility,
  tagThreeObjectLayer,
  type RendererLayerVisibility
} from "./RendererLayers";
import { ThreeCullingAdapter, type ThreeCullingRegistration } from "./ThreeCullingAdapter";
import { VfxResourcePool } from "./VfxResourcePool";
import {
  collectRenderedObjAssetIds,
  ObjAssetCache
} from "./ObjAssetCache";
import type { MinecraftMaterialContext } from "./MinecraftMaterialSystem";
import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type { BuildSequenceSettings } from "../experimental/buildsequencer/BuildSequenceTypes";
import { deriveBuildSequence } from "../experimental/buildsequencer/BuildSequencerSession";
import { applyBuildReveal, revealFrameByCoord } from "../experimental/buildsequencer/BuildRevealApplication";

export type { ViewportOrientation } from "./ViewportOrientation";

export interface SceneRendererOptions {
  container: HTMLElement;
  onSelectObject: (objectId: string | null) => void;
  onMetrics?: (metrics: RendererMetricsSnapshot) => void;
  /** Fires only when the camera orientation actually changes. */
  onOrientation?: (orientation: ViewportOrientation) => void;
}

/**
 * Snapshot of everything about a character that requires rebuilding its
 * geometry/materials/skin texture from scratch. Deliberately excludes
 * `boneRotations` and `transform`, which change every frame during
 * animation playback but never require a geometry rebuild - only a bone
 * rotation / group transform update.
 */
interface CharacterStructuralFingerprint {
  rigPreset: string;
  attachments: CharacterEntity["attachments"];
  customGeometry: CharacterEntity["customGeometry"];
  skin: CharacterEntity["skin"];
  objAssets: MineMotionProject["assets"]["obj"];
}

interface CharacterRegistryEntry {
  root: THREE.Group;
  bones: Map<string, THREE.Object3D>;
  fingerprint: CharacterStructuralFingerprint;
}

/**
 * Only the presence of the helper marker sphere depends on anything other
 * than the light's own (always-updated) transform/color/intensity, so this
 * is the only field that needs to gate a full rebuild.
 */
interface LightStructuralFingerprint {
  helpersVisible: boolean;
}

interface LightRegistryEntry {
  root: THREE.Group;
  point: THREE.PointLight;
  fingerprint: LightStructuralFingerprint;
}

interface PropStructuralFingerprint {
  assetId: string;
  objAssets: MineMotionProject["assets"]["obj"];
}

interface PropRegistryEntry {
  root: THREE.Object3D;
  fingerprint: PropStructuralFingerprint;
}

interface CameraHelperRegistryEntry {
  root: THREE.Group;
}

/**
 * Snapshot of everything that affects the Minecraft world/terrain meshes.
 * None of these fields change during pure animation playback (blocks don't
 * animate), so when this signature is unchanged we can keep the existing
 * chunk/terrain meshes instead of rebuilding them every frame.
 */
interface WorldStructuralSignature {
  world: MineMotionProject["world"] | null;
  worldEdits: MineMotionProject["creationSuite"]["worldEdits"];
  resourcePacks: MineMotionProject["assets"]["resourcePacks"];
  minecraftResources: MineMotionProject["minecraftResources"];
  hiddenChunkIds: readonly string[] | null;
  renderOptions: unknown;
  showChunkBorders: boolean;
  showWorldOrigin: boolean;
  terrainPreset: string;
  materialContextSignature: string;
  captureBlockPositions: boolean;
}

function isSameCharacterFingerprint(
  a: CharacterStructuralFingerprint,
  b: CharacterStructuralFingerprint
): boolean {
  return (
    a.rigPreset === b.rigPreset &&
    a.attachments === b.attachments &&
    a.customGeometry === b.customGeometry &&
    a.skin === b.skin &&
    a.objAssets === b.objAssets
  );
}

function isSameLightFingerprint(
  a: LightStructuralFingerprint,
  b: LightStructuralFingerprint
): boolean {
  return a.helpersVisible === b.helpersVisible;
}

function isSamePropFingerprint(
  a: PropStructuralFingerprint,
  b: PropStructuralFingerprint
): boolean {
  return a.assetId === b.assetId && a.objAssets === b.objAssets;
}

function isSameWorldSignature(
  a: WorldStructuralSignature,
  b: WorldStructuralSignature
): boolean {
  return (
    a.world === b.world &&
    a.worldEdits === b.worldEdits &&
    a.resourcePacks === b.resourcePacks &&
    a.minecraftResources === b.minecraftResources &&
    a.hiddenChunkIds === b.hiddenChunkIds &&
    a.renderOptions === b.renderOptions &&
    a.showChunkBorders === b.showChunkBorders &&
    a.showWorldOrigin === b.showWorldOrigin &&
    a.terrainPreset === b.terrainPreset &&
    a.materialContextSignature === b.materialContextSignature &&
    a.captureBlockPositions === b.captureBlockPositions
  );
}

function applyBoneRotation(object: THREE.Object3D, rotation: Vector3Tuple | undefined): void {
  const [x, y, z] = rotation ?? [0, 0, 0];
  object.rotation.set(
    THREE.MathUtils.degToRad(x),
    THREE.MathUtils.degToRad(y),
    THREE.MathUtils.degToRad(z)
  );
}

/**
 * Collects the bone pivot objects (created by DefaultSteveRig) keyed by
 * bone id, so their rotation can be updated directly on the fast path
 * without traversing/rebuilding the whole rig. Pivots are always
 * THREE.Group instances tagged with userData.objectType "rigBone"; other
 * objects (the bone's visible mesh, attached custom cubes) share the same
 * boneId but are THREE.Mesh instances, so the Group check disambiguates
 * them reliably.
 */
function collectRigBoneObjects(root: THREE.Object3D): Map<string, THREE.Object3D> {
  const bones = new Map<string, THREE.Object3D>();
  root.traverse((child) => {
    if (
      child instanceof THREE.Group &&
      child.userData.objectType === "rigBone" &&
      typeof child.userData.boneId === "string" &&
      !bones.has(child.userData.boneId)
    ) {
      bones.set(child.userData.boneId, child);
    }
  });
  return bones;
}

export class SceneRenderer {
  private readonly scene = new THREE.Scene();
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  private readonly ambientLight = new THREE.AmbientLight("#ffffff", 0.45);
  private readonly directionalLight = new THREE.DirectionalLight("#ffffff", 2.1);
  private readonly hemisphereLight = new THREE.HemisphereLight("#bcd3ff", "#4a4237", 0.55);
  private readonly controller: CameraController;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly culling = new ThreeCullingAdapter();
  private readonly vfxResources = new VfxResourcePool();
  private readonly minecraftMaterials = new MinecraftMaterialCache();
  private readonly weather = new WeatherSystem();
  private readonly skinTextures = new SteveRigTextureCache();
  private readonly objAssets = new ObjAssetCache();
  private readonly sceneRoot = new THREE.Group();
  private readonly depthPassMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.BasicDepthPacking });
  private readonly normalPassMaterial = new THREE.MeshNormalMaterial({ toneMapped: false });
  private readonly idPassMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private readonly gridFloor = createGridFloor();
  private readonly selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0xf7d56b);
  // Scene content is split into persistent subgroups so that world chunks,
  // character rigs, lights, camera helpers, and props can be kept across
  // frames instead of being destroyed and rebuilt every frame (see
  // updateWorldGroup/updateCharactersGroup/updateLightsGroup/
  // updateCameraHelpersGroup/updatePropsGroup). Only `dynamicGroup` (world
  // staging, motion path, VFX) is still fully rebuilt on every call, since
  // those either change too often to benefit (VFX) or are cheap enough
  // that the added bookkeeping isn't worth it yet (staging/motion path).
  private readonly worldGroup = new THREE.Group();
  private readonly charactersGroup = new THREE.Group();
  private readonly lightsGroup = new THREE.Group();
  private readonly cameraHelpersGroup = new THREE.Group();
  private readonly propsGroup = new THREE.Group();
  private readonly dynamicGroup = new THREE.Group();
  private readonly characterRegistry = new Map<string, CharacterRegistryEntry>();
  private readonly lightRegistry = new Map<string, LightRegistryEntry>();
  private readonly cameraHelperRegistry = new Map<string, CameraHelperRegistryEntry>();
  private readonly propRegistry = new Map<string, PropRegistryEntry>();
  private worldSignature: WorldStructuralSignature | null = null;
  private worldCullingEntries: Array<{
    object: THREE.Object3D;
    registration: ThreeCullingRegistration;
  }> = [];
  // Experimental Build Sequencer reveal (session-only; null when inactive).
  private buildRevealSettings: BuildSequenceSettings | null = null;
  private buildRevealCache: {
    world: MineMotionProject["world"] | null;
    settings: BuildSequenceSettings;
    lookup: Map<string, number>;
  } | null = null;
  private animationFrame = 0;
  private resizeObserver: ResizeObserver | null = null;
  private readonly lastOrientation = new THREE.Quaternion(NaN, NaN, NaN, NaN);
  private selectedObjectId: string | null = null;
  private cachedSelectedObjectId: string | null = null;
  private cachedSelectedObject: THREE.Object3D | null = null;
  private project: MineMotionProject | null = null;
  private readonly performanceMonitor = new PerformanceMonitor();
  private readonly startedAt = performance.now();
  private startupMs: number | null = null;
  private lastMetricsAt = Number.NEGATIVE_INFINITY;
  private activeEffectCount = 0;
  private gridRequestedVisible = true;
  private materialContextSignature: string | null = null;
  private layerVisibility: RendererLayerVisibility =
    resolveRendererLayerVisibility({
      mode: "editor",
      includeVfx: true,
      includePost: true,
      includeOverlays: true
    });

  constructor(private readonly options: SceneRendererOptions) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      options.container.clientWidth,
      options.container.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Blender-like filmic look: ACES tone mapping + sRGB output so highlights
    // roll off smoothly instead of clipping to flat white.
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    options.container.appendChild(this.renderer.domElement);

    this.controller = new CameraController(this.renderer, options.container);

    this.directionalLight.position.set(8, 16, 10);
    this.directionalLight.castShadow = true;
    // Crisper, wider soft shadows (studio key light).
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.bias = -0.0004;
    this.directionalLight.shadow.normalBias = 0.02;
    this.directionalLight.shadow.radius = 4;
    const shadowCam = this.directionalLight.shadow.camera;
    shadowCam.near = 0.5;
    shadowCam.far = 60;
    shadowCam.left = -18;
    shadowCam.right = 18;
    shadowCam.top = 18;
    shadowCam.bottom = -18;
    // Soft sky/ground fill so shadowed sides keep colour (Blender world light).
    this.hemisphereLight.position.set(0, 20, 0);
    this.scene.add(this.ambientLight, this.directionalLight, this.hemisphereLight);
    tagThreeObjectLayer(this.weather.object, "vfx");
    this.scene.add(this.weather.object);
    tagThreeObjectLayer(this.gridFloor, "helpers");
    this.scene.add(this.gridFloor);
    this.worldGroup.name = "World";
    this.charactersGroup.name = "Characters";
    this.lightsGroup.name = "Lights";
    this.cameraHelpersGroup.name = "CameraHelpers";
    this.propsGroup.name = "Props";
    this.dynamicGroup.name = "Dynamic";
    this.sceneRoot.add(
      this.worldGroup,
      this.charactersGroup,
      this.lightsGroup,
      this.cameraHelpersGroup,
      this.propsGroup,
      this.dynamicGroup
    );
    this.scene.add(this.sceneRoot);
    this.selectionBox.visible = false;
    tagThreeObjectLayer(this.selectionBox, "helpers");
    this.scene.add(this.selectionBox);

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    window.addEventListener("resize", this.resize);
    // The container often has zero size at mount (grid still settling) and can
    // change without a window resize (panel drags), so observe it directly —
    // otherwise the canvas stays a thin strip.
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(options.container);
    }
    this.resize();
    this.animate();
  }

  renderProject(
    project: MineMotionProject,
    selectedObjectId: string | null,
    viewportSettings?: ViewportSettings,
    motionPath: SampledMotionPath | null = null,
    buildReveal: BuildSequenceSettings | null = null
  ): void {
    this.buildRevealSettings = buildReveal;
    this.project = project;
    this.selectedObjectId = selectedObjectId;
    this.layerVisibility = resolveRendererLayerVisibility({
      mode: project.renderSettings.renderPreviewEnabled ? "final" : "editor",
      renderPass: project.exportSettings.renderPass,
      includeVfx: shouldIncludeProjectVfx(project),
      includePost:
        !project.renderSettings.renderPreviewEnabled ||
        project.exportSettings.includePostProcessing,
      includeOverlays:
        !project.renderSettings.renderPreviewEnabled ||
        project.exportSettings.includeCinematicBars
    });
    this.culling.setLayerVisibility(this.layerVisibility);
    if (viewportSettings) {
      this.applyViewportSettings(viewportSettings);
    }
    this.gridFloor.visible =
      this.layerVisibility.helpers && this.gridRequestedVisible;
    SkySystem.apply(
      this.scene,
      this.ambientLight,
      this.directionalLight,
      project.sky.preset,
      project.sky.customColor,
      project.lighting,
      project.animation.currentFrame
    );
    this.renderer.shadowMap.enabled = project.lighting.shadowsEnabled;
    this.weather.update(
      project.lighting,
      project.animation.currentFrame,
      this.layerVisibility.vfx
    );

    this.rebuildSceneRoot(
      project,
      project.renderSettings.renderPreviewEnabled ? null : motionPath
    );
    this.applyBuildRevealToWorld(project);
    this.updateSelectionBox();
  }

  // Experimental: reveal the imported build block-by-block over the timeline.
  // The lookup is recomputed only when the world or settings change; each frame
  // just toggles instance visibility for the current frame.
  private applyBuildRevealToWorld(project: MineMotionProject): void {
    const settings = this.buildRevealSettings;
    if (!settings) {
      if (this.buildRevealCache) {
        applyBuildReveal(this.worldGroup, null, 0);
        this.buildRevealCache = null;
      }
      return;
    }
    if (
      !this.buildRevealCache ||
      this.buildRevealCache.world !== (project.world ?? null) ||
      this.buildRevealCache.settings !== settings
    ) {
      const view = deriveBuildSequence(project, settings);
      this.buildRevealCache = {
        world: project.world ?? null,
        settings,
        lookup: revealFrameByCoord(view)
      };
    }
    applyBuildReveal(this.worldGroup, this.buildRevealCache.lookup, project.animation.currentFrame, settings.mode ?? "assemble");
  }

  lookThroughCamera(camera: CameraEntity): void {
    this.controller.lookThrough(camera);
  }

  /** Snaps the viewport camera down a world axis (navigation gizmo). */
  viewAlongAxis(axis: "x" | "y" | "z", sign: 1 | -1): void {
    this.controller.viewAlongAxis(axis, sign);
  }

  /** Dolly the viewport camera toward (<1) or away from (>1) its target. */
  dolly(factor: number): void {
    this.controller.dolly(factor);
  }

  focusImportedWorld(): void {
    const world = this.findObjectById("world");
    if (!world) return;
    const box = new THREE.Box3().setFromObject(world);
    if (box.isEmpty()) return;
    this.controller.focusBox(box);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    window.removeEventListener("resize", this.resize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controller.dispose();
    disposeThreeObjectTree(this.sceneRoot);
    this.vfxResources.dispose();
    this.minecraftMaterials.clear();
    this.weather.dispose();
    this.skinTextures.clear();
    this.objAssets.clear();
    this.materialContextSignature = null;
    disposeThreeObjectTree(this.gridFloor);
    disposeThreeObjectTree(this.selectionBox);
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.depthPassMaterial.dispose();
    this.normalPassMaterial.dispose();
    this.idPassMaterials.forEach((material) => material.dispose());
    this.idPassMaterials.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.performanceMonitor.reset();
    this.culling.reset();
    this.invalidateSelectedObjectCache();
    this.characterRegistry.clear();
    this.lightRegistry.clear();
    this.cameraHelperRegistry.clear();
    this.propRegistry.clear();
    this.worldSignature = null;
    this.worldCullingEntries = [];
    this.project = null;
  }

  private rebuildSceneRoot(
    project: MineMotionProject,
    motionPath: SampledMotionPath | null
  ): void {
    this.vfxResources.beginFrame();
    this.culling.reset();
    // Any structural rebuild below may replace objects the selection cache
    // (see updateSelectionBox) points to. dynamicGroup is always rebuilt, so
    // we invalidate unconditionally rather than trying to track exactly
    // which bucket the current selection lives in - the cost of one extra
    // traverse next frame is negligible next to the rebuild avoided here.
    this.invalidateSelectedObjectCache();
    const activeResourcePack = project.assets.resourcePacks.find(
      (pack) => pack.id === project.minecraftResources.activeResourcePackId
    );
    const materialContext: MinecraftMaterialContext = {
      resourcePack: activeResourcePack,
      settings: project.minecraftResources,
      materialCache: this.minecraftMaterials
    };
    const materialContextSignature =
      createMinecraftMaterialContextSignature(materialContext);
    if (materialContextSignature !== this.materialContextSignature) {
      this.minecraftMaterials.clear();
      this.materialContextSignature = materialContextSignature;
    }
    this.skinTextures.prune(
      project.scene.characters.flatMap((character) =>
        character.visible && character.skin?.metadata.valid
          ? [character.skin.dataUrl]
          : []
      )
    );
    const renderedObjAssetIds = collectRenderedObjAssetIds(project);
    this.objAssets.prune(
      project.assets.obj.filter((asset) => renderedObjAssetIds.has(asset.id))
    );

    this.updateWorldGroup(project, materialContext, materialContextSignature);
    this.updateCharactersGroup(project);

    disposeThreeObjectTree(this.dynamicGroup);

    const staging = createWorldStagingObjects(
      project.world?.sceneOverrides,
      materialContext
    );
    staging.props.visible = this.layerVisibility.props;
    staging.helpers.visible = this.layerVisibility.helpers;
    this.dynamicGroup.add(staging.props, staging.helpers);

    this.updateCameraHelpersGroup(project);
    this.updatePropsGroup(project);
    this.updateLightsGroup(project);
    if (this.layerVisibility.helpers && motionPath) {
      const pathObject = createMotionPathObject(motionPath);
      if (pathObject) {
        tagThreeObjectLayer(pathObject, "helpers");
        this.dynamicGroup.add(pathObject);
        this.culling.register(pathObject, {
          id: `motion-path:${motionPath.kind}`,
          layer: "helpers"
        });
      }
    }

    const prepared = prepareProjectVfxFrame(project, {
      includeVfx: this.layerVisibility.vfx,
      quality: project.renderSettings.renderPreviewEnabled
        ? "export"
        : "preview"
    });
    const preparedEffects = prepared.ok ? prepared.value.effects : [];
    this.activeEffectCount = preparedEffects.length;
    for (const effect of preparedEffects) {
      if (effect.primitives.length > 0) {
        if (effect.evaluation.inputs.renderLayer !== "world") continue;
        const group = new THREE.Group();
        group.name = effect.displayName;
        this.applyTransform(group, effect.evaluation.inputs.transform);
        for (const primitive of effect.primitives) {
          const object = this.createNativePrimitiveObject(primitive);
          if (object) group.add(object);
        }
        if (group.children.length > 0) {
          tagThreeObjectLayer(group, "vfx");
          this.dynamicGroup.add(group);
          this.culling.register(group, {
            id: effect.evaluation.instanceId,
            layer: "vfx"
          });
        }
        continue;
      }
      if (
        effect.type !== "lightningStrike" &&
        effect.type !== "shockwave" &&
        effect.type !== "glowBurst"
      ) {
        continue;
      }
      const particleCount = effect.budget.particles;
      if (effect.type === "glowBurst" && particleCount === 0) continue;
      const object = this.createWorldEffectObject(
        effect,
        particleCount
      );
      if (object) {
        tagThreeObjectLayer(object, "vfx");
        this.dynamicGroup.add(object);
        this.culling.register(object, {
          id: effect.evaluation.instanceId,
          layer: "vfx"
        });
      }
    }
  }

  /**
   * Builds (or reuses) the Minecraft world/terrain meshes. None of the
   * inputs captured in WorldStructuralSignature change during pure
   * animation playback, so on the common case (only currentFrame moved)
   * this skips chunk/instanced-mesh rebuilding entirely and just replays
   * the previous frame's culling registrations against the untouched
   * meshes.
   */
  private updateWorldGroup(
    project: MineMotionProject,
    materialContext: MinecraftMaterialContext,
    materialContextSignature: string
  ): void {
    const world = project.world ?? null;
    const hiddenChunkIds = world?.sceneOverrides?.hiddenChunkIds ?? null;
    const nextSignature: WorldStructuralSignature = {
      world,
      worldEdits: project.creationSuite.worldEdits,
      resourcePacks: project.assets.resourcePacks,
      minecraftResources: project.minecraftResources,
      hiddenChunkIds,
      renderOptions: world?.renderOptions ?? null,
      showChunkBorders: this.layerVisibility.helpers,
      showWorldOrigin: this.layerVisibility.helpers,
      terrainPreset: project.projectSettings.terrainPreset,
      materialContextSignature,
      captureBlockPositions: this.buildRevealSettings !== null
    };

    if (
      this.worldSignature &&
      isSameWorldSignature(this.worldSignature, nextSignature)
    ) {
      for (const entry of this.worldCullingEntries) {
        this.culling.register(entry.object, entry.registration);
      }
      return;
    }

    this.worldSignature = nextSignature;
    disposeThreeObjectTree(this.worldGroup);
    this.worldCullingEntries = [];

    const hiddenChunkIdSet = new Set(hiddenChunkIds ?? []);
    const sourceChunks = getStreamedChunksForRender(project).filter(
      (chunk) => !hiddenChunkIdSet.has(chunk.id)
    );
    const importedChunks = project.creationSuite.worldEdits.some((operation) => operation.enabled)
      ? applyWorldEditOperations(sourceChunks, project.creationSuite.worldEdits).chunks
      : sourceChunks;
    if (importedChunks.length > 0) {
      const imported = ImportedChunkMeshBuilder.buildImportedChunks(
        importedChunks,
        {
          ...(world?.renderOptions ?? {
            showChunkBorders: true,
            showWorldOrigin: true
          }),
          showChunkBorders:
            this.layerVisibility.helpers &&
            (world?.renderOptions?.showChunkBorders ?? true),
          showWorldOrigin:
            this.layerVisibility.helpers &&
            (world?.renderOptions?.showWorldOrigin ?? true),
          materialContext,
          captureBlockPositions: this.buildRevealSettings !== null
        }
      );
      imported.object.name = `Imported World: ${world?.sourceName ?? "Minecraft World"}`;
      this.worldGroup.add(imported.object);
      imported.chunks.forEach((renderedChunk, index) => {
        const source = importedChunks[index];
        tagThreeObjectLayer(renderedChunk.object, "world");
        const halfHeight = Math.max(
          0.5,
          ((source?.maxY ?? 0) - (source?.minY ?? 0) + 1) / 2
        );
        const logicalBounds = {
          center: [
            renderedChunk.chunkX * 16 + 8,
            (source?.minY ?? 0) + halfHeight,
            renderedChunk.chunkZ * 16 + 8
          ] as const,
          radius: Math.hypot(8, halfHeight, 8)
        };
        const registration: ThreeCullingRegistration = {
          id: `chunk:${index}:${renderedChunk.chunkX},${renderedChunk.chunkZ}`,
          selectionId: "world",
          layer: "world",
          chunk: [renderedChunk.chunkX, renderedChunk.chunkZ],
          ...(renderedChunk.object.children.length === 0
            ? logicalBounds
            : {})
        };
        this.worldCullingEntries.push({ object: renderedChunk.object, registration });
        this.culling.register(renderedChunk.object, registration);
      });
      if (imported.helpers) {
        tagThreeObjectLayer(imported.helpers, "helpers");
        const registration: ThreeCullingRegistration = {
          id: "world:helpers",
          selectionId: "world",
          layer: "helpers"
        };
        this.worldCullingEntries.push({ object: imported.helpers, registration });
        this.culling.register(imported.helpers, registration);
      }
    } else {
      const terrainChunk = PresetChunkMeshBuilder.createChunkForPreset(
        project.projectSettings.terrainPreset
      );
      if (terrainChunk) {
        const terrain = PresetChunkMeshBuilder.buildInstancedChunk(
          terrainChunk,
          materialContext
        );
        terrain.name = world
          ? `Imported World Placeholder: ${world.sourceName}`
          : `${project.projectSettings.terrainPreset} terrain`;
        tagThreeObjectLayer(terrain, "world");
        this.worldGroup.add(terrain);
        const registration: ThreeCullingRegistration = {
          id: "world",
          layer: "world"
        };
        this.worldCullingEntries.push({ object: terrain, registration });
        this.culling.register(terrain, registration);
      }
    }
  }

  /**
   * Builds (or reuses) character rig objects. Characters whose structural
   * fingerprint (rig preset, attachments, custom geometry, skin, available
   * OBJ assets) is unchanged since the last call only get their bone
   * rotations and root transform updated in place - the common case while
   * an animation plays back - instead of having their whole rig
   * (geometry, materials, skin texture) rebuilt from scratch.
   */
  private updateCharactersGroup(project: MineMotionProject): void {
    const visibleCharacters = project.scene.characters.filter(
      (character) => character.visible
    );
    const nextIds = new Set(visibleCharacters.map((character) => character.id));

    for (const [id, entry] of this.characterRegistry) {
      if (!nextIds.has(id)) {
        disposeThreeObjectTree(entry.root);
        this.charactersGroup.remove(entry.root);
        this.characterRegistry.delete(id);
      }
    }

    for (const character of visibleCharacters) {
      const fingerprint: CharacterStructuralFingerprint = {
        rigPreset: character.rigPreset,
        attachments: character.attachments,
        customGeometry: character.customGeometry,
        skin: character.skin,
        objAssets: project.assets.obj
      };
      const existing = this.characterRegistry.get(character.id);

      if (existing && isSameCharacterFingerprint(existing.fingerprint, fingerprint)) {
        for (const [boneId, boneObject] of existing.bones) {
          applyBoneRotation(boneObject, character.boneRotations[boneId]);
        }
        this.applyTransform(existing.root, character.transform);
        this.culling.register(existing.root, {
          id: character.id,
          layer: "characters"
        });
        continue;
      }

      if (existing) {
        disposeThreeObjectTree(existing.root);
        this.charactersGroup.remove(existing.root);
        this.characterRegistry.delete(character.id);
      }

      const root = this.createCharacterObject(project, character);
      tagThreeObjectLayer(root, "characters");
      this.charactersGroup.add(root);
      this.characterRegistry.set(character.id, {
        root,
        bones: collectRigBoneObjects(root),
        fingerprint
      });
      this.culling.register(root, {
        id: character.id,
        layer: "characters"
      });
    }
  }

  /**
   * Camera helper geometry never varies (it's a fixed body/lens/frustum
   * shape), so the only thing that ever needs updating for an existing
   * helper is its transform. The registry only needs to track which
   * cameras currently qualify for a helper at all.
   */
  private updateCameraHelpersGroup(project: MineMotionProject): void {
    const shouldShowHelpers =
      this.layerVisibility.helpers && !this.gridFloor.userData.hideCameras;
    const qualifyingCameras = shouldShowHelpers
      ? project.scene.cameras.filter((camera) => camera.visible)
      : [];
    const nextIds = new Set(qualifyingCameras.map((camera) => camera.id));

    for (const [id, entry] of this.cameraHelperRegistry) {
      if (!nextIds.has(id)) {
        disposeThreeObjectTree(entry.root);
        this.cameraHelpersGroup.remove(entry.root);
        this.cameraHelperRegistry.delete(id);
      }
    }

    for (const camera of qualifyingCameras) {
      const existing = this.cameraHelperRegistry.get(camera.id);
      if (existing) {
        this.applyTransform(existing.root, camera.transform);
        this.culling.register(existing.root, {
          id: `camera-helper:${camera.id}`,
          selectionId: camera.id,
          layer: "helpers"
        });
        continue;
      }

      const root = this.createCameraObject(camera);
      tagThreeObjectLayer(root, "helpers");
      this.cameraHelpersGroup.add(root);
      this.cameraHelperRegistry.set(camera.id, { root });
      this.culling.register(root, {
        id: `camera-helper:${camera.id}`,
        selectionId: camera.id,
        layer: "helpers"
      });
    }
  }

  /**
   * Imported OBJ props: `ObjAssetCache.resolve()` already caches the parsed
   * template and only clones the lightweight Object3D wrapper, so the
   * remaining per-frame cost is that clone plus the userData/traverse work
   * in markSelectable. Skipping both when the asset hasn't changed is
   * cheap and safe: only the object's transform can legitimately change
   * from one frame to the next while the referenced asset stays the same.
   */
  private updatePropsGroup(project: MineMotionProject): void {
    const visibleProps = project.scene.importedObjects.filter(
      (obj) => obj.visible
    );
    const nextIds = new Set(visibleProps.map((obj) => obj.id));

    for (const [id, entry] of this.propRegistry) {
      if (!nextIds.has(id)) {
        disposeThreeObjectTree(entry.root);
        this.propsGroup.remove(entry.root);
        this.propRegistry.delete(id);
      }
    }

    for (const obj of visibleProps) {
      const fingerprint: PropStructuralFingerprint = {
        assetId: obj.assetId,
        objAssets: project.assets.obj
      };
      const existing = this.propRegistry.get(obj.id);

      if (existing && isSamePropFingerprint(existing.fingerprint, fingerprint)) {
        this.applyTransform(existing.root, obj.transform);
        this.culling.register(existing.root, {
          id: obj.id,
          layer: "props"
        });
        continue;
      }

      if (existing) {
        disposeThreeObjectTree(existing.root);
        this.propsGroup.remove(existing.root);
        this.propRegistry.delete(obj.id);
      }

      const root = this.createObjObject(project, obj);
      tagThreeObjectLayer(root, "props");
      this.propsGroup.add(root);
      this.propRegistry.set(obj.id, { root, fingerprint });
      this.culling.register(root, {
        id: obj.id,
        layer: "props"
      });
    }
  }

  /**
   * Lights: color/intensity/distance/castShadow are cheap property sets
   * (no reallocation), so they're always refreshed directly on the
   * existing THREE.PointLight rather than gated behind a fingerprint -
   * that keeps light-intensity/color animation curves working exactly as
   * before. The only thing that requires a full rebuild is whether the
   * helper marker sphere should exist at all (layer visibility toggle).
   */
  private updateLightsGroup(project: MineMotionProject): void {
    const visibleLights = project.scene.lights
      .filter((light) => light.visible)
      .slice(0, 16);
    const nextIds = new Set(visibleLights.map((light) => light.id));

    for (const [id, entry] of this.lightRegistry) {
      if (!nextIds.has(id)) {
        disposeThreeObjectTree(entry.root);
        this.lightsGroup.remove(entry.root);
        this.lightRegistry.delete(id);
      }
    }

    for (const light of visibleLights) {
      const fingerprint: LightStructuralFingerprint = {
        helpersVisible: this.layerVisibility.helpers
      };
      const existing = this.lightRegistry.get(light.id);

      if (existing && isSameLightFingerprint(existing.fingerprint, fingerprint)) {
        this.applyTransform(existing.root, light.transform);
        const configuredDistance =
          typeof light.metadata.distance === "number" &&
          Number.isFinite(light.metadata.distance)
            ? Math.max(0, light.metadata.distance)
            : 20;
        existing.point.color.set(light.color);
        existing.point.intensity = Math.max(0, light.intensity);
        existing.point.distance = configuredDistance;
        existing.point.castShadow = light.metadata.castShadow === true;
        this.culling.register(existing.root, {
          id: light.id,
          layer: "props"
        });
        continue;
      }

      if (existing) {
        disposeThreeObjectTree(existing.root);
        this.lightsGroup.remove(existing.root);
        this.lightRegistry.delete(light.id);
      }

      const root = this.createSceneLightObject(light);
      const point = root.children.find(
        (child): child is THREE.PointLight => child instanceof THREE.PointLight
      );
      if (!point) continue;
      this.lightsGroup.add(root);
      this.lightRegistry.set(light.id, { root, point, fingerprint });
      this.culling.register(root, {
        id: light.id,
        layer: "props"
      });
    }
  }

  private createCharacterObject(
    project: MineMotionProject,
    character: CharacterEntity
  ): THREE.Group {
    const group = createDefaultSteveRig(
      character,
      (assetId) => this.createObjAssetObject(project, assetId),
      this.skinTextures
    );
    this.applyTransform(group, character.transform);
    this.markSelectable(group, character.id, "character");
    return group;
  }

  private createSceneLightObject(light: LightEntity): THREE.Group {
    const group = new THREE.Group();
    group.name = light.name;
    const configuredDistance = typeof light.metadata.distance === "number" && Number.isFinite(light.metadata.distance)
      ? Math.max(0, light.metadata.distance)
      : 20;
    const point = new THREE.PointLight(light.color, Math.max(0, light.intensity), configuredDistance, 2);
    point.name = `${light.name} illumination`;
    point.castShadow = light.metadata.castShadow === true;
    if (point.castShadow) {
      point.shadow.mapSize.set(1024, 1024);
      point.shadow.bias = -0.0005;
    }
    group.add(point);
    if (this.layerVisibility.helpers) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshBasicMaterial({ color: light.color, toneMapped: false })
      );
      marker.name = `${light.name} helper`;
      group.add(marker);
    }
    this.applyTransform(group, light.transform);
    this.markSelectable(group, light.id, light.type);
    return group;
  }

  private createCameraObject(camera: CameraEntity): THREE.Group {
    const group = new THREE.Group();
    group.name = camera.name;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.28, 0.25),
      createSolidMaterial("#d9dce5")
    );
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.2, 16),
      createSolidMaterial("#5f6b7b")
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.22;

    const helperSource = new THREE.ConeGeometry(0.9, 1.4, 4);
    const helperGeometry = new THREE.EdgesGeometry(helperSource);
    helperSource.dispose();
    const helper = new THREE.LineSegments(
      helperGeometry,
      new THREE.LineBasicMaterial({ color: "#8cc8ff" })
    );
    helper.rotation.y = Math.PI / 4;
    helper.position.z = -0.8;

    group.add(body, lens, helper);
    this.applyTransform(group, camera.transform);
    this.markSelectable(group, camera.id, "camera");
    return group;
  }

  private createObjObject(
    project: MineMotionProject,
    obj: ObjEntity
  ): THREE.Object3D {
    const object = this.createObjAssetObject(project, obj.assetId) ??
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        createSolidMaterial("#9aa3ad")
      );

    object.name = obj.name;
    this.applyTransform(object, obj.transform);
    this.markSelectable(object, obj.id, "obj");
    return object;
  }

  private createObjAssetObject(
    project: MineMotionProject,
    assetId: string
  ): THREE.Object3D | null {
    const asset = project.assets.obj.find((item) => item.id === assetId);
    if (!asset) return null;
    return this.objAssets.resolve(asset);
  }

  private createWorldEffectObject(
    effect: PreparedProjectVfxEffect,
    particleCount: number
  ): THREE.Object3D | null {
    const progress = effect.evaluation.progress;
    const colorValue = getPreparedVfxString(effect, "color", "#ffffff");
    const color = isSafeVfxColor(colorValue)
      ? colorValue
      : "#ffffff";
    const alpha = getPreparedVfxNumber(effect, "alpha", 0.8);
    const position = effect.evaluation.inputs.transform.position;

    if (effect.type === "lightningStrike") {
      const points: THREE.Vector3[] = [];
      const height = Math.max(2, getPreparedVfxNumber(effect, "radius", 3));
      const seed = effect.evaluation.frameSeed;
      const segments = effect.budget.segments;
      for (let index = 0; index <= segments; index += 1) {
        const t = index / segments;
        const offset = index === 0 || index === segments
          ? 0
          : Math.sin(seed + index * 1.7) * 0.24;
        points.push(
          new THREE.Vector3(
            position[0] + offset,
            position[1] + height * (1 - t),
            position[2] + Math.cos(seed + index * 2.1) * 0.18
          )
        );
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = this.vfxResources.acquireLineMaterial({
        color,
        opacity: alpha * (1 - progress * 0.35)
      });
      const line = new THREE.Line(geometry, material);
      line.name = effect.displayName;
      return line;
    }

    if (effect.type === "shockwave") {
      const radius = Math.max(
        0.2,
        getPreparedVfxNumber(effect, "radius", 4) * progress
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035, 8, effect.budget.segments),
        this.vfxResources.acquireMeshMaterial({
          color,
          opacity: alpha * (1 - progress)
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(...position);
      ring.name = effect.displayName;
      return ring;
    }

    if (effect.type === "glowBurst") {
      const radius =
        getPreparedVfxNumber(effect, "radius", 2) * Math.max(0.15, progress);
      const size = getPreparedVfxNumber(effect, "size", 0.16);
      const geometry = this.vfxResources.getUnitCubeGeometry();
      const material = this.vfxResources.acquireMeshMaterial({
        color,
        opacity: alpha * (1 - progress * 0.8)
      });
      const particles = this.vfxResources.acquireParticleMesh(
        geometry,
        material,
        particleCount
      );
      const matrix = new THREE.Matrix4();
      const particlePosition = new THREE.Vector3();
      const particleRotation = new THREE.Quaternion();
      const particleScale = new THREE.Vector3(size, size, size);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = (index / particleCount) * Math.PI * 2;
        const vertical = Math.sin(index * 1.618) * radius * 0.45;
        particlePosition.set(
          position[0] + Math.cos(angle) * radius,
          position[1] + vertical + 1,
          position[2] + Math.sin(angle) * radius
        );
        matrix.compose(particlePosition, particleRotation, particleScale);
        particles.setMatrixAt(index, matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
      particles.computeBoundingSphere();
      particles.name = effect.displayName;
      return particles;
    }

    return null;
  }

  private createNativePrimitiveObject(
    primitive: VfxPrimitiveEvaluation
  ): THREE.Object3D | null {
    const color = isSafeVfxColor(primitive.color) ? primitive.color : "#ffffff";
    if (primitive.kind === "particle-emitter") {
      if (primitive.particles.length === 0) return null;
      const geometry = this.vfxResources.getUnitCubeGeometry();
      const material = this.vfxResources.acquireMeshMaterial({
        color,
        opacity: Math.max(0, Math.min(1, primitive.particles[0]?.opacity ?? 0))
      });
      const particles = this.vfxResources.acquireParticleMesh(
        geometry,
        material,
        primitive.particles.length
      );
      const matrix = new THREE.Matrix4();
      const particlePosition = new THREE.Vector3();
      const particleRotation = new THREE.Quaternion();
      const particleScale = new THREE.Vector3();
      for (let index = 0; index < primitive.particles.length; index += 1) {
        const sample = primitive.particles[index];
        particlePosition.set(...sample.position);
        particleScale.setScalar(sample.size);
        matrix.compose(
          particlePosition,
          particleRotation,
          particleScale
        );
        particles.setMatrixAt(index, matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
      particles.computeBoundingSphere();
      return particles;
    }

    if (
      primitive.kind === "beam" ||
      primitive.kind === "trail" ||
      primitive.kind === "expanding-ring"
    ) {
      if (primitive.points.length < 2) return null;
      const points = primitive.points.map(
        (sample) => new THREE.Vector3(...sample.position)
      );
      if (primitive.kind === "expanding-ring") points.push(points[0].clone());
      const opacity =
        primitive.kind === "beam"
          ? primitive.opacity
          : primitive.kind === "expanding-ring"
            ? primitive.opacity
            : primitive.points[0]?.opacity ?? 0;
      return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        this.vfxResources.acquireLineMaterial({
          color,
          opacity: Math.max(0, Math.min(1, opacity))
        })
      );
    }

    if (primitive.radius <= 0 || primitive.intensity <= 0) return null;
    const pulse = new THREE.Mesh(
      this.vfxResources.getUnitSphereGeometry(),
      this.vfxResources.acquireMeshMaterial({
        color,
        opacity: Math.max(0, Math.min(0.45, primitive.intensity * 0.18)),
        wireframe: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    pulse.position.set(...primitive.center);
    pulse.scale.setScalar(primitive.radius);
    return pulse;
  }

  private applyTransform(object: THREE.Object3D, transform: TransformData): void {
    object.position.set(
      transform.position[0],
      transform.position[1],
      transform.position[2]
    );
    object.rotation.set(
      THREE.MathUtils.degToRad(transform.rotation[0]),
      THREE.MathUtils.degToRad(transform.rotation[1]),
      THREE.MathUtils.degToRad(transform.rotation[2])
    );
    object.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
  }

  private applyViewportSettings(settings: ViewportSettings): void {
    this.gridRequestedVisible = settings.gridEnabled;
    this.gridFloor.visible =
      this.layerVisibility.helpers && this.gridRequestedVisible;
    this.gridFloor.scale.setScalar(Math.max(0.25, settings.gridSize / 64));
    this.gridFloor.userData.hideCameras = !settings.showCameraObjects;
    const qualityRatio =
      settings.renderQuality === "low"
        ? 1
        : settings.renderQuality === "medium"
          ? Math.min(window.devicePixelRatio, 1.5)
          : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(qualityRatio);
    this.controller.applySpeeds(settings);
  }

  private markSelectable(
    object: THREE.Object3D,
    objectId: string,
    objectType: string
  ): void {
    object.userData.objectId = objectId;
    object.userData.objectType = objectType;
    object.traverse((child) => {
      child.userData.objectId ??= objectId;
      child.userData.objectType ??= objectType;
    });
  }

  private updateSelectionBox(): void {
    if (!this.layerVisibility.helpers) {
      this.selectionBox.visible = false;
      return;
    }
    // Resolving the selected object requires a full scene traverse, which is
    // expensive on large scenes (many Minecraft chunks/objects). This method
    // runs every animation frame (60x/s), so the resolved object is cached
    // and only re-resolved when the selection changes or the scene has been
    // rebuilt (see invalidateSelectedObjectCache()).
    if (this.selectedObjectId !== this.cachedSelectedObjectId) {
      this.cachedSelectedObjectId = this.selectedObjectId;
      this.cachedSelectedObject = this.findObjectById(this.selectedObjectId);
    }
    const selected = this.cachedSelectedObject;
    if (!selected) {
      this.selectionBox.visible = false;
      return;
    }

    this.selectionBox.setFromObject(selected);
    this.selectionBox.visible = true;
  }

  private invalidateSelectedObjectCache(): void {
    this.cachedSelectedObjectId = null;
    this.cachedSelectedObject = null;
  }

  private findObjectById(objectId: string | null): THREE.Object3D | null {
    if (!objectId) {
      return null;
    }

    let found: THREE.Object3D | null = null;
    this.sceneRoot.traverse((child) => {
      if (!found && child.userData.objectId === objectId) {
        found = child;
      }
    });
    return found;
  }

  private handlePointer = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.controller.camera);

    const hits = this.raycaster.intersectObjects(this.sceneRoot.children, true);
    const hit = hits.find((item) => item.object.userData.objectId);
    this.options.onSelectObject(hit?.object.userData.objectId ?? null);
  };

  private resize = (): void => {
    const width = Math.max(1, this.options.container.clientWidth);
    const height = Math.max(1, this.options.container.clientHeight);
    this.renderer.setSize(width, height);
    this.controller.resize(width, height);
  };

  private renderProductionPass(): void {
    const pass = this.project?.exportSettings.renderPass ?? "beauty";
    const finalPreview = this.project?.renderSettings.renderPreviewEnabled === true;
    if (!finalPreview || pass === "beauty") { this.renderer.render(this.scene, this.controller.camera); return; }
    const background = this.scene.background;
    const clearAlpha = this.renderer.getClearAlpha();
    if (pass === "alpha") {
      this.scene.background = null;
      this.renderer.setClearAlpha(0);
      try { this.renderer.render(this.scene, this.controller.camera); }
      finally { this.scene.background = background; this.renderer.setClearAlpha(clearAlpha); }
      return;
    }
    if (pass === "depth") {
      const override = this.scene.overrideMaterial;
      this.scene.background = new THREE.Color(0xffffff);
      this.scene.overrideMaterial = this.depthPassMaterial;
      try { this.renderer.render(this.scene, this.controller.camera); }
      finally { this.scene.overrideMaterial = override; this.scene.background = background; }
      return;
    }
    if (pass === "normals") {
      const override = this.scene.overrideMaterial;
      this.scene.background = new THREE.Color(0x8080ff);
      this.scene.overrideMaterial = this.normalPassMaterial;
      try { this.renderer.render(this.scene, this.controller.camera); }
      finally { this.scene.overrideMaterial = override; this.scene.background = background; }
      return;
    }
    if (pass === "object-id") {
      const restored: Array<{ mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }> = [];
      this.sceneRoot.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        restored.push({ mesh: object, material: object.material });
        const key = stableObjectKey(object);
        let material = this.idPassMaterials.get(key);
        if (!material) { material = new THREE.MeshBasicMaterial({ color: stableIdColor(key), toneMapped: false }); this.idPassMaterials.set(key, material); }
        object.material = material;
      });
      this.scene.background = new THREE.Color(0x000000);
      try { this.renderer.render(this.scene, this.controller.camera); }
      finally { restored.forEach(({ mesh, material }) => { mesh.material = material; }); this.scene.background = background; }
      return;
    }
    this.renderer.render(this.scene, this.controller.camera);
  }

  /**
   * Reports the camera basis to the navigation gizmo, but only when the camera
   * actually rotated — the gizmo is otherwise idle and must not cause React
   * state churn on every animation frame.
   */
  private emitOrientation(): void {
    const onOrientation = this.options.onOrientation;
    if (!onOrientation) return;
    const camera = this.controller.camera;
    if (this.lastOrientation.angleTo(camera.quaternion) < 0.001) return;
    this.lastOrientation.copy(camera.quaternion);

    onOrientation(computeViewportOrientation(camera.quaternion));
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const now = performance.now();
    const frame = this.performanceMonitor.sample(now);
    this.controller.update();
    if (this.project) {
      this.minecraftMaterials.updateAnimations(
        (this.project.animation.currentFrame /
          Math.max(1, this.project.animation.fps)) * 1000
      );
      this.culling.update(
        this.controller.camera,
        this.selectedObjectId,
        this.layerVisibility.helpers
      );
      this.updateSelectionBox();
    }
    this.renderProductionPass();
    this.emitOrientation();
    if (this.project && this.options.onMetrics &&
      (this.startupMs === null || now - this.lastMetricsAt >= 500)) {
      if (this.startupMs === null) {
        this.startupMs = Math.max(0, now - this.startedAt);
      }
      let sceneObjects = 0;
      this.sceneRoot.traverse(() => {
        sceneObjects += 1;
      });
      const info = this.renderer.info;
      const runtimePerformance = performance as Performance & {
        memory?: unknown;
      };
      this.options.onMetrics({
        startupMs: this.startupMs,
        elapsedMs: Math.max(0, now - this.startedAt),
        frame,
        renderer: sanitizeRendererFrameInfo({
          calls: info.render.calls,
          triangles: info.render.triangles,
          points: info.render.points,
          lines: info.render.lines,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
          programs: info.programs?.length ?? 0
        }),
        heap: readBrowserHeapMetrics(runtimePerformance.memory),
        project: collectProjectComplexityMetrics(
          this.project,
          sceneObjects,
          this.activeEffectCount
        ),
        culling: this.culling.summary
      });
      this.lastMetricsAt = now;
    }
  };
}

function stableObjectKey(object: THREE.Object3D): string {
  let current: THREE.Object3D | null = object;
  while (current) { if (typeof current.userData.objectId === "string") return current.userData.objectId; if (current.name) return current.name; current = current.parent; }
  return object.uuid;
}
function stableIdColor(value: string): number {
  let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  const color = hash & 0xffffff; return color === 0 ? 0x010101 : color;
}
