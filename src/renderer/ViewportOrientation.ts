import * as THREE from "three";

/** Camera basis vectors, in screen space, driving the navigation gizmo. */
export interface ViewportOrientation {
  /** World +X, +Y, +Z expressed in camera space (x right, y up, z toward viewer). */
  x: [number, number, number];
  y: [number, number, number];
  z: [number, number, number];
}

const inverse = new THREE.Quaternion();
const axis = new THREE.Vector3();

/**
 * Expresses the world axes in camera space, which is what the gizmo draws:
 * each world axis is rotated by the inverse of the camera rotation.
 *
 * Note this is the inverse (not the camera's own basis): the camera's columns
 * would give the camera axes in world space, i.e. the opposite mapping.
 */
export function computeViewportOrientation(
  cameraQuaternion: THREE.Quaternion
): ViewportOrientation {
  inverse.copy(cameraQuaternion).invert();
  const project = (x: number, y: number, z: number): [number, number, number] => {
    axis.set(x, y, z).applyQuaternion(inverse);
    return [axis.x, axis.y, axis.z];
  };
  return {
    x: project(1, 0, 0),
    y: project(0, 1, 0),
    z: project(0, 0, 1)
  };
}
