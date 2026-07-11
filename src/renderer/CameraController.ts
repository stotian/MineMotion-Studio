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
