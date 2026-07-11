import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type {
  CameraEntity,
  CharacterEntity,
  MineMotionProject,
  ObjEntity,
  TransformData
} from "../project/ProjectFile";
import { ChunkMeshBuilder as PresetChunkMeshBuilder } from "../minecraft/ChunkMeshBuilder";
import { ChunkMeshBuilder as ImportedChunkMeshBuilder } from "../minecraft/mesh/ChunkMeshBuilder";
import { createDefaultSteveRig } from "../rigs/DefaultSteveRig";
import { createSolidMaterial } from "./MinecraftMaterialSystem";
import { SkySystem } from "./SkySystem";
import { createGridFloor } from "./GridFloor";
import { CameraController } from "./CameraController";
import type { ViewportSettings } from "../settings/AppSettings";
import type { EffectInstance } from "../effects/EffectTypes";
import { getEffectProgress, isEffectActive } from "../effects/EffectTypes";

export interface SceneRendererOptions {
  container: HTMLElement;
  onSelectObject: (objectId: string | null) => void;
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
  private readonly sceneRoot = new THREE.Group();
  private readonly gridFloor = createGridFloor();
  private readonly selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0xf7d56b);
  private animationFrame = 0;
  private selectedObjectId: string | null = null;
  private project: MineMotionProject | null = null;
  private readonly objLoader = new OBJLoader();

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
    this.scene.add(this.gridFloor);
    this.scene.add(this.sceneRoot);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.animate();
  }

  renderProject(
    project: MineMotionProject,
    selectedObjectId: string | null,
    viewportSettings?: ViewportSettings
  ): void {
    this.project = project;
    this.selectedObjectId = selectedObjectId;
    if (viewportSettings) {
      this.applyViewportSettings(viewportSettings);
    }
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

    this.rebuildSceneRoot(project);
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
    this.renderer.dispose();
    this.options.container.innerHTML = "";
  }

  private rebuildSceneRoot(project: MineMotionProject): void {
    this.sceneRoot.clear();
    const activeResourcePack = project.assets.resourcePacks.find(
      (pack) => pack.id === project.minecraftResources.activeResourcePackId
    );
    const materialContext = {
      resourcePack: activeResourcePack,
      settings: project.minecraftResources
    };

    const importedChunks = project.world?.importedChunks ?? [];
    if (importedChunks.length > 0) {
      const imported = ImportedChunkMeshBuilder.buildImportedChunks(
        importedChunks,
        {
          ...(project.world?.renderOptions ?? {
            showChunkBorders: true,
            showWorldOrigin: true
          }),
          materialContext
        }
      );
      imported.object.name = `Imported World: ${project.world?.sourceName ?? "Minecraft World"}`;
      this.sceneRoot.add(imported.object);
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
        this.sceneRoot.add(terrain);
      }
    }

    for (const character of project.scene.characters) {
      if (!character.visible) continue;
      this.sceneRoot.add(this.createCharacterObject(character));
    }

    for (const camera of project.scene.cameras) {
      if (!camera.visible) continue;
      if (this.gridFloor.userData.hideCameras) continue;
      this.sceneRoot.add(this.createCameraObject(camera));
    }

    for (const obj of project.scene.importedObjects) {
      if (!obj.visible) continue;
      this.sceneRoot.add(this.createObjObject(project, obj));
    }

    for (const effect of project.effects.instances) {
      if (!isEffectActive(effect, project.animation.currentFrame)) continue;
      const object = this.createWorldEffectObject(effect, project.animation.currentFrame);
      if (object) {
        this.sceneRoot.add(object);
      }
    }
  }

  private createCharacterObject(character: CharacterEntity): THREE.Group {
    const group = createDefaultSteveRig(character);
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

    const helper = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ConeGeometry(0.9, 1.4, 4)),
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
    const asset = project.assets.obj.find((item) => item.id === obj.assetId);
    let object: THREE.Object3D;

    if (!asset) {
      object = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        createSolidMaterial("#9aa3ad")
      );
    } else {
      object = this.objLoader.parse(asset.rawObj);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = createSolidMaterial("#aab2bd");
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }

    object.name = obj.name;
    this.applyTransform(object, obj.transform);
    this.markSelectable(object, obj.id, "obj");
    return object;
  }

  private createWorldEffectObject(
    effect: EffectInstance,
    frame: number
  ): THREE.Object3D | null {
    const progress = getEffectProgress(effect, frame);
    const color = effect.parameters.color ?? "#ffffff";
    const alpha = effect.parameters.alpha ?? 0.8;

    if (effect.type === "lightningStrike") {
      const points: THREE.Vector3[] = [];
      const height = Math.max(2, effect.parameters.radius ?? 3);
      const seed = effect.id
        .split("")
        .reduce((sum, character) => sum + character.charCodeAt(0), 0);
      for (let index = 0; index <= 8; index += 1) {
        const t = index / 8;
        const offset = index === 0 || index === 8
          ? 0
          : Math.sin(seed + index * 1.7) * 0.24;
        points.push(
          new THREE.Vector3(
            effect.position[0] + offset,
            effect.position[1] + height * (1 - t),
            effect.position[2] + Math.cos(seed + index * 2.1) * 0.18
          )
        );
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: alpha * (1 - progress * 0.35)
      });
      const line = new THREE.Line(geometry, material);
      line.name = effect.name;
      return line;
    }

    if (effect.type === "shockwave") {
      const radius = Math.max(0.2, (effect.parameters.radius ?? 4) * progress);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035, 8, 96),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: alpha * (1 - progress)
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(...effect.position);
      ring.name = effect.name;
      return ring;
    }

    if (effect.type === "glowBurst") {
      const group = new THREE.Group();
      const count = Math.max(4, Math.round(effect.parameters.count ?? 18));
      const radius = (effect.parameters.radius ?? 2) * Math.max(0.15, progress);
      const size = effect.parameters.size ?? 0.16;
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: alpha * (1 - progress * 0.8)
      });
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const vertical = Math.sin(index * 1.618) * radius * 0.45;
        const particle = new THREE.Mesh(
          new THREE.BoxGeometry(size, size, size),
          material
        );
        particle.position.set(
          effect.position[0] + Math.cos(angle) * radius,
          effect.position[1] + vertical + 1,
          effect.position[2] + Math.sin(angle) * radius
        );
        group.add(particle);
      }
      group.name = effect.name;
      return group;
    }

    return null;
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
    this.gridFloor.visible = settings.gridEnabled;
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
    this.controller.update();
    if (this.project) {
      this.updateSelectionBox();
    }
    this.renderer.render(this.scene, this.controller.camera);
  };
}
