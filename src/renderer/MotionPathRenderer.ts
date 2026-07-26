import * as THREE from "three";
import {
  MOTION_PATH_LIMITS,
  type MotionPathKind,
  type SampledMotionPath
} from "../rigs/motion/MotionPathSampler";

const PATH_COLORS: Readonly<Record<MotionPathKind, string>> = Object.freeze({
  characterRoot: "#f7d56b",
  leftHand: "#6bb8ff",
  rightHand: "#ff7b72",
  camera: "#67e8d4"
});

export function createMotionPathObject(
  path: SampledMotionPath
): THREE.Group | null {
  if (path.points.length === 0 ||
    path.points.length > MOTION_PATH_LIMITS.maximumPoints ||
    path.points.some((point) => !boundedPoint(point.position))) {
    return null;
  }
  const color = PATH_COLORS[path.kind];
  const group = new THREE.Group();
  group.name = `Motion Path: ${path.subjectName}`;
  group.userData.objectType = "motionPath";

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(
    path.points.map((point) => new THREE.Vector3(...point.position))
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    depthTest: false
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.name = "Motion Path Line";
  line.renderOrder = 1_000;
  group.add(line);

  const keyPoints = path.points.filter((point) => point.keyframe);
  if (keyPoints.length > 0) {
    const keyGeometry = new THREE.BufferGeometry().setFromPoints(
      keyPoints.map((point) => new THREE.Vector3(...point.position))
    );
    const keyMaterial = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.14,
      sizeAttenuation: true,
      depthTest: false
    });
    const points = new THREE.Points(keyGeometry, keyMaterial);
    points.name = "Motion Path Keyframes";
    points.renderOrder = 1_001;
    group.add(points);
  }
  return group;
}

function boundedPoint(value: readonly number[]): boolean {
  return value.length === 3 &&
    value.every((component) =>
      typeof component === "number" &&
      Number.isFinite(component) &&
      Math.abs(component) <= MOTION_PATH_LIMITS.maximumCoordinate
    );
}
