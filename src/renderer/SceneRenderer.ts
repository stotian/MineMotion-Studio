import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type {
  CameraEntity,
  CharacterEntity,
  MineMotionProject,
  ObjEntity,
  TransformData
} from "../project/ProjectFile";
import { ChunkMeshBuilder } from "../minecraft/ChunkMeshBuilder";
import { createDefaultSteveRig } from "../rigs/DefaultSteveRig";
import { createSolidMaterial } from "./MinecraftMaterialSystem";
import { SkySystem } from "./SkySystem";
import { createGridFloor } from "./GridFloor";
import { CameraController } from "./CameraController";

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
    this.scene.add(createGridFloor());
    this.scene.add(this.sceneRoot);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.animate();
  }

  renderProject(project: MineMotionProject, selectedObjectId: string | null): void {
    this.project = project;
    this.selectedObjectId = selectedObjectId;
    SkySystem.apply(
      this.scene,
      this.ambientLight,
      this.directionalLight,
      project.sky.preset,
      project.sky.customColor
    );

    this.rebuildSceneRoot(project);
    this.updateSelectionBox();
  }

  lookThroughCamera(camera: CameraEntity): void {
    this.controller.lookThrough(camera.transform.position);
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

    const terrain = ChunkMeshBuilder.buildInstancedChunk(
      ChunkMeshBuilder.createDemoChunk()
    );
    terrain.name = project.world
      ? `Imported World Placeholder: ${project.world.sourceName}`
      : "Demo Minecraft Terrain";
    this.sceneRoot.add(terrain);

    for (const character of project.scene.characters) {
      if (!character.visible) continue;
      this.sceneRoot.add(this.createCharacterObject(character));
    }

    for (const camera of project.scene.cameras) {
      if (!camera.visible) continue;
      this.sceneRoot.add(this.createCameraObject(camera));
    }

    for (const obj of project.scene.importedObjects) {
      if (!obj.visible) continue;
      this.sceneRoot.add(this.createObjObject(project, obj));
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

  private markSelectable(
    object: THREE.Object3D,
    objectId: string,
    objectType: string
  ): void {
    object.userData.objectId = objectId;
    object.userData.objectType = objectType;
    object.traverse((child) => {
      child.userData.objectId = objectId;
      child.userData.objectType = objectType;
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

