import * as THREE from "three";

// Blender-like reference grid: a large ground plane of fine + bold lines that
// fade out toward the horizon (giving an "infinite" feel), plus coloured
// X (red) and Z (blue) axis lines through the origin.
const RADIUS = 140; // half-extent of the grid in world units
const MINOR_STEP = 1; // fine lines every 1 unit
const MAJOR_STEP = 8; // bold lines every 8 units

// Tuned against the grey viewport background: grid lines read as slightly
// darker grey, axes keep Blender's colour convention (X red, Z blue).
const MINOR_COLOR = new THREE.Color("#2f2f2f");
const MAJOR_COLOR = new THREE.Color("#282828");
const AXIS_X_COLOR = new THREE.Color("#a83a3a"); // red, X
const AXIS_Z_COLOR = new THREE.Color("#2f5fa8"); // blue, Z

/**
 * Radial fade so distant lines dissolve into the background. This is applied as
 * real per-vertex alpha (RGBA colour attribute), not baked into RGB — baking it
 * would darken lines toward black, which shows up as a dark haze on the grey
 * viewport background instead of fading away.
 */
function fadeAt(x: number, z: number): number {
  const d = Math.sqrt(x * x + z * z) / RADIUS;
  return Math.max(0, 1 - d * d);
}

function gridMaterial(): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  });
}

/**
 * Builds grid lines (parallel to X and Z) at `step` spacing, skipping the ones
 * that coincide with the coloured axes.
 */
function buildGridLines(
  step: number,
  color: THREE.Color,
  y: number
): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (x1: number, z1: number, x2: number, z2: number) => {
    positions.push(x1, y, z1, x2, y, z2);
    colors.push(color.r, color.g, color.b, fadeAt(x1, z1));
    colors.push(color.r, color.g, color.b, fadeAt(x2, z2));
  };
  for (let i = -RADIUS; i <= RADIUS; i += step) {
    if (i === 0) continue; // origin lines are drawn as coloured axes
    push(i, -RADIUS, i, RADIUS); // parallel to Z
    push(-RADIUS, i, RADIUS, i); // parallel to X
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
  const lines = new THREE.LineSegments(geometry, gridMaterial());
  lines.raycast = () => {};
  return lines;
}

function buildAxis(
  color: THREE.Color,
  axis: "x" | "z",
  y: number
): THREE.LineSegments {
  // Split at the origin into two segments: a single -RADIUS..+RADIUS line would
  // have both endpoints at the fully-faded rim and interpolate to invisible.
  const positions =
    axis === "x"
      ? [-RADIUS, y, 0, 0, y, 0, 0, y, 0, RADIUS, y, 0]
      : [0, y, -RADIUS, 0, y, 0, 0, y, 0, 0, y, RADIUS];
  const rim = fadeAt(RADIUS, 0); // 0 at the edge
  const centre = fadeAt(0, 0); // 1 at the origin
  const colors: number[] = [];
  for (const alpha of [rim, centre, centre, rim]) {
    colors.push(color.r, color.g, color.b, alpha);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));
  const line = new THREE.LineSegments(geometry, gridMaterial());
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
