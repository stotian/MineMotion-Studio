import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

  lookThrough(position: [number, number, number]): void {
    this.camera.position.set(position[0], position[1], position[2]);
    this.controls.target.set(0, 2, 0);
    this.controls.update();
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}

