import * as THREE from "three";

// Blender-like reference grid: a large ground plane of fine + bold lines that
// fade radially toward the horizon (giving an "infinite" feel), plus coloured
// X (red) and Z (blue) axis lines through the origin.
const RADIUS = 140; // half-extent of the grid in world units
const MINOR_STEP = 1; // fine lines every 1 unit
const MAJOR_STEP = 8; // bold lines every 8 units (one Minecraft "chunk"-ish)

const MINOR_COLOR = new THREE.Color("#333a47");
const MAJOR_COLOR = new THREE.Color("#4a5468");
const AXIS_X_COLOR = new THREE.Color("#b6473f"); // red-ish, X
const AXIS_Z_COLOR = new THREE.Color("#3f6bb6"); // blue-ish, Z

/** Radial fade so distant lines dissolve into the background. */
function fadeAt(x: number, z: number): number {
  const d = Math.sqrt(x * x + z * z) / RADIUS;
  return Math.max(0, 1 - d * d);
}

/**
 * Builds a set of grid lines (parallel to X and Z) at `step` spacing, skipping
 * any that coincide with the coloured axes, with per-vertex alpha baked into the
 * colour so the material can fade them out toward the edges.
 */
function buildGridLines(step: number, color: THREE.Color, y: number): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (x1: number, z1: number, x2: number, z2: number) => {
    const a1 = fadeAt(x1, z1);
    const a2 = fadeAt(x2, z2);
    positions.push(x1, y, z1, x2, y, z2);
    colors.push(color.r * a1, color.g * a1, color.b * a1);
    colors.push(color.r * a2, color.g * a2, color.b * a2);
  };
  for (let i = -RADIUS; i <= RADIUS; i += step) {
    if (i === 0) continue; // origin lines are drawn as coloured axes
    push(i, -RADIUS, i, RADIUS); // lines parallel to Z
    push(-RADIUS, i, RADIUS, i); // lines parallel to X
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.raycast = () => {};
  return lines;
}

function buildAxis(color: THREE.Color, axis: "x" | "z", y: number): THREE.LineSegments {
  const positions =
    axis === "x"
      ? [-RADIUS, y, 0, RADIUS, y, 0]
      : [0, y, -RADIUS, 0, y, RADIUS];
  const colors: number[] = [];
  for (let v = 0; v < 2; v += 1) {
    const along = v === 0 ? -RADIUS : RADIUS;
    const a = fadeAt(axis === "x" ? along : 0, axis === "z" ? along : 0);
    colors.push(color.r * a, color.g * a, color.b * a);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  });
  const line = new THREE.LineSegments(geometry, material);
  line.raycast = () => {};
  return line;
}

export function createGridFloor(): THREE.Group {
  const group = new THREE.Group();
  group.name = "Grid Floor";
  group.add(buildGridLines(MINOR_STEP, MINOR_COLOR, 0.0));
  group.add(buildGridLines(MAJOR_STEP, MAJOR_COLOR, 0.005));
  group.add(buildAxis(AXIS_X_COLOR, "x", 0.01));
  group.add(buildAxis(AXIS_Z_COLOR, "z", 0.01));
  return group;
}
