import * as THREE from "three";
import type {
  RendererLayerVisibility,
  ThreeSceneLayerId
} from "./RendererLayers";
import {
  EMPTY_RENDERER_CULLING_SUMMARY,
  evaluateRendererCulling,
  type RendererCullingEntry,
  type RendererCullingSummary
} from "./RendererCulling";

interface ThreeCullingObject {
  object: THREE.Object3D;
  entry: RendererCullingEntry;
}

export type ThreeCullingRegistration =
  Omit<RendererCullingEntry, "center" | "radius"> &
  Partial<Pick<RendererCullingEntry, "center" | "radius">>;

const THREE_SCENE_LAYERS = Object.freeze([
  "world",
  "characters",
  "props",
  "vfx",
  "helpers"
] as const);

export class ThreeCullingAdapter {
  private readonly frustum = new THREE.Frustum();
  private readonly viewProjection = new THREE.Matrix4();
  private readonly objects: ThreeCullingObject[] = [];
  private readonly entries: RendererCullingEntry[] = [];
  private enabledLayers: ReadonlySet<ThreeSceneLayerId> =
    new Set(THREE_SCENE_LAYERS);
  private currentSummary: RendererCullingSummary =
    EMPTY_RENDERER_CULLING_SUMMARY;

  get summary(): RendererCullingSummary {
    return this.currentSummary;
  }

  setLayerVisibility(visibility: RendererLayerVisibility): void {
    this.enabledLayers = new Set(
      THREE_SCENE_LAYERS.filter((layer) => visibility[layer])
    );
  }

  register(object: THREE.Object3D, entry: ThreeCullingRegistration): void {
    object.updateWorldMatrix(true, true);
    let center = entry.center;
    let radius = entry.radius;
    if (!center || radius === undefined) {
      const bounds = new THREE.Box3().setFromObject(object);
      if (bounds.isEmpty()) return;
      const sphere = bounds.getBoundingSphere(new THREE.Sphere());
      center = [sphere.center.x, sphere.center.y, sphere.center.z];
      radius = sphere.radius;
    }
    const frozenEntry = Object.freeze({ ...entry, center, radius });
    this.objects.push({ object, entry: frozenEntry });
    this.entries.push(frozenEntry);
  }

  update(
    camera: THREE.PerspectiveCamera,
    selectedId: string | null,
    allowSelectedOverride: boolean
  ): void {
    for (const item of this.objects) item.object.visible = true;
    camera.updateMatrixWorld();
    this.viewProjection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.viewProjection);
    const evaluation = evaluateRendererCulling(this.entries, {
      cameraPosition: [
        camera.position.x,
        camera.position.y,
        camera.position.z
      ],
      maximumDistance: camera.far,
      frustumPlanes: this.frustum.planes.map((plane) => [
        plane.normal.x,
        plane.normal.y,
        plane.normal.z,
        plane.constant
      ]),
      enabledLayers: this.enabledLayers,
      selectedId,
      allowSelectedOverride
    });
    evaluation.decisions.forEach((decision, index) => {
      const item = this.objects[index];
      if (item) item.object.visible = decision.visible;
    });
    this.currentSummary = evaluation.summary;
  }

  reset(): void {
    this.objects.length = 0;
    this.entries.length = 0;
    this.currentSummary = EMPTY_RENDERER_CULLING_SUMMARY;
  }
}
