import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CameraEntity } from "../project/ProjectFile";

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  constructor(
    renderer: THREE.WebGLRenderer,
    container: HTMLElement
  ) {
    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      1000
    );
    this.camera.position.set(10, 8, 12);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 2, 0);
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 120;
    this.controls.update();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  lookThrough(camera: CameraEntity): void {
    this.camera.position.set(...camera.transform.position);
    this.camera.fov = camera.fov;
    this.camera.near = camera.near;
    this.camera.far = camera.far;
    const rotation = new THREE.Euler(
      THREE.MathUtils.degToRad(camera.transform.rotation[0]),
      THREE.MathUtils.degToRad(camera.transform.rotation[1]),
      THREE.MathUtils.degToRad(camera.transform.rotation[2]),
      "YXZ"
    );
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation);
    this.controls.target.copy(this.camera.position).add(forward);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  focusBox(box: THREE.Box3): void {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const radius = Math.max(size.x, size.y, size.z, 8);
    this.controls.target.copy(center);
    this.camera.position.set(
      center.x + radius * 0.85,
      center.y + radius * 0.55,
      center.z + radius * 0.85
    );
    this.camera.near = Math.max(0.1, radius / 2000);
    this.camera.far = Math.max(1000, radius * 8);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  /** Dolly toward (<1) or away from (>1) the orbit target. */
  dolly(factor: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      this.controls.minDistance,
      this.controls.maxDistance
    );
    this.camera.position
      .copy(this.controls.target)
      .add(offset.setLength(distance));
    this.controls.update();
  }

  /**
   * Snaps the view down a world axis, the way clicking a Blender gizmo ball
   * does. Keeps the current orbit distance and target.
   */
  viewAlongAxis(axis: "x" | "y" | "z", sign: 1 | -1): void {
    const distance = this.camera.position.distanceTo(this.controls.target);
    const direction = new THREE.Vector3(
      axis === "x" ? sign : 0,
      axis === "y" ? sign : 0,
      axis === "z" ? sign : 0
    );
    // A perfectly vertical view is degenerate against the up vector, so nudge
    // it a hair off-axis.
    if (axis === "y") direction.z += sign * 1e-3;
    this.camera.position
      .copy(this.controls.target)
      .addScaledVector(direction, distance);
    // update() re-derives the spherical angles and re-applies the polar clamps.
    this.controls.update();
  }

  update(): void {
    this.controls.update();
  }

  applySpeeds({
    orbitSpeed,
    panSpeed,
    zoomSpeed
  }: {
    orbitSpeed: number;
    panSpeed: number;
    zoomSpeed: number;
  }): void {
    this.controls.rotateSpeed = orbitSpeed;
    this.controls.panSpeed = panSpeed;
    this.controls.zoomSpeed = zoomSpeed;
  }

  dispose(): void {
    this.controls.dispose();
  }
}
