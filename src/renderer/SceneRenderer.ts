import * as THREE from "three";
import type {
  CameraEntity,
  CharacterEntity,
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
import { createGridFloor } from "./GridFloor";
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
import { ThreeCullingAdapter } from "./ThreeCullingAdapter";
import { VfxResourcePool } from "./VfxResourcePool";
import {
  collectRenderedObjAssetIds,
  ObjAssetCache
} from "./ObjAssetCache";

export interface SceneRendererOptions {
  container: HTMLElement;
  onSelectObject: (objectId: string | null) => void;
  onMetrics?: (metrics: RendererMetricsSnapshot) => void;
}

export class SceneRenderer {
  private readonly scene = new THREE.Scene();
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });
  private readonly ambientLight = new THREE.AmbientLight("#ffffff", 0.7);
  private readonly directionalLight = new THREE.DirectionalLight("#ffffff", 1);
  private readonly controller: CameraController;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly culling = new ThreeCullingAdapter();
  private readonly vfxResources = new VfxResourcePool();
  private readonly minecraftMaterials = new MinecraftMaterialCache();
  private readonly skinTextures = new SteveRigTextureCache();
  private readonly objAssets = new ObjAssetCache();
  private readonly sceneRoot = new THREE.Group();
  private readonly gridFloor = createGridFloor();
  private readonly selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0xf7d56b);
  private animationFrame = 0;
  private selectedObjectId: string | null = null;
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
    options.container.appendChild(this.renderer.domElement);

    this.controller = new CameraController(this.renderer, options.container);

    this.directionalLight.position.set(8, 16, 10);
    this.directionalLight.castShadow = true;
    this.scene.add(this.ambientLight, this.directionalLight);
    tagThreeObjectLayer(this.gridFloor, "helpers");
    this.scene.add(this.gridFloor);
    this.scene.add(this.sceneRoot);
    this.selectionBox.visible = false;
    tagThreeObjectLayer(this.selectionBox, "helpers");
    this.scene.add(this.selectionBox);

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.animate();
  }

  renderProject(
    project: MineMotionProject,
    selectedObjectId: string | null,
    viewportSettings?: ViewportSettings,
    motionPath: SampledMotionPath | null = null
  ): void {
    this.project = project;
    this.selectedObjectId = selectedObjectId;
    this.layerVisibility = resolveRendererLayerVisibility({
      mode: project.renderSettings.renderPreviewEnabled ? "final" : "editor",
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

    this.rebuildSceneRoot(
      project,
      project.renderSettings.renderPreviewEnabled ? null : motionPath
    );
    this.updateSelectionBox();
  }

  lookThroughCamera(camera: CameraEntity): void {
    this.controller.lookThrough(camera);
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
    this.controller.dispose();
    disposeThreeObjectTree(this.sceneRoot);
    this.vfxResources.dispose();
    this.minecraftMaterials.clear();
    this.skinTextures.clear();
    this.objAssets.clear();
    this.materialContextSignature = null;
    disposeThreeObjectTree(this.gridFloor);
    disposeThreeObjectTree(this.selectionBox);
    this.scene.clear();
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.performanceMonitor.reset();
    this.culling.reset();
    this.project = null;
  }

  private rebuildSceneRoot(
    project: MineMotionProject,
    motionPath: SampledMotionPath | null
  ): void {
    disposeThreeObjectTree(this.sceneRoot);
    this.vfxResources.beginFrame();
    this.culling.reset();
    const activeResourcePack = project.assets.resourcePacks.find(
      (pack) => pack.id === project.minecraftResources.activeResourcePackId
    );
    const materialContext = {
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

    const importedChunks = project.world?.importedChunks ?? [];
    if (importedChunks.length > 0) {
      const imported = ImportedChunkMeshBuilder.buildImportedChunks(
        importedChunks,
        {
          ...(project.world?.renderOptions ?? {
            showChunkBorders: true,
            showWorldOrigin: true
          }),
          showChunkBorders:
            this.layerVisibility.helpers &&
            (project.world?.renderOptions?.showChunkBorders ?? true),
          showWorldOrigin:
            this.layerVisibility.helpers &&
            (project.world?.renderOptions?.showWorldOrigin ?? true),
          materialContext
        }
      );
      imported.object.name = `Imported World: ${project.world?.sourceName ?? "Minecraft World"}`;
      this.sceneRoot.add(imported.object);
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
        this.culling.register(renderedChunk.object, {
          id: `chunk:${index}:${renderedChunk.chunkX},${renderedChunk.chunkZ}`,
          selectionId: "world",
          layer: "world",
          chunk: [renderedChunk.chunkX, renderedChunk.chunkZ],
          ...(renderedChunk.object.children.length === 0
            ? logicalBounds
            : {})
        });
      });
      if (imported.helpers) {
        tagThreeObjectLayer(imported.helpers, "helpers");
        this.culling.register(imported.helpers, {
          id: "world:helpers",
          selectionId: "world",
          layer: "helpers"
        });
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
        terrain.name = project.world
          ? `Imported World Placeholder: ${project.world.sourceName}`
          : `${project.projectSettings.terrainPreset} terrain`;
        tagThreeObjectLayer(terrain, "world");
        this.sceneRoot.add(terrain);
        this.culling.register(terrain, {
          id: "world",
          layer: "world"
        });
      }
    }

    for (const character of project.scene.characters) {
      if (!character.visible) continue;
      const object = this.createCharacterObject(project, character);
      tagThreeObjectLayer(object, "characters");
      this.sceneRoot.add(object);
      this.culling.register(object, {
        id: character.id,
        layer: "characters"
      });
    }

    if (this.layerVisibility.helpers) {
      for (const camera of project.scene.cameras) {
        if (!camera.visible) continue;
        if (this.gridFloor.userData.hideCameras) continue;
        const object = this.createCameraObject(camera);
        tagThreeObjectLayer(object, "helpers");
        this.sceneRoot.add(object);
        this.culling.register(object, {
          id: `camera-helper:${camera.id}`,
          selectionId: camera.id,
          layer: "helpers"
        });
      }
    }

    for (const obj of project.scene.importedObjects) {
      if (!obj.visible) continue;
      const object = this.createObjObject(project, obj);
      tagThreeObjectLayer(object, "props");
      this.sceneRoot.add(object);
      this.culling.register(object, {
        id: obj.id,
        layer: "props"
      });
    }
    if (this.layerVisibility.helpers && motionPath) {
      const pathObject = createMotionPathObject(motionPath);
      if (pathObject) {
        tagThreeObjectLayer(pathObject, "helpers");
        this.sceneRoot.add(pathObject);
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
          this.sceneRoot.add(group);
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
        this.sceneRoot.add(object);
        this.culling.register(object, {
          id: effect.evaluation.instanceId,
          layer: "vfx"
        });
      }
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
    const selected = this.findObjectById(this.selectedObjectId);
    if (!selected) {
      this.selectionBox.visible = false;
      return;
    }

    this.selectionBox.setFromObject(selected);
    this.selectionBox.visible = true;
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

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const now = performance.now();
    const frame = this.performanceMonitor.sample(now);
    this.controller.update();
    if (this.project) {
      this.culling.update(
        this.controller.camera,
        this.selectedObjectId,
        this.layerVisibility.helpers
      );
      this.updateSelectionBox();
    }
    this.renderer.render(this.scene, this.controller.camera);
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
