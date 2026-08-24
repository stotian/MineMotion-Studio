import * as THREE from "three";

// Blender-like reference grid: a large ground plane of fine + bold lines that
// fade out toward the horizon (giving an "infinite" feel), plus coloured
// X (red) and Z (blue) axis lines through the origin.
const RADIUS = 140; // half-extent of the grid in world units
const MINOR_STEP = 1; // fine lines every 1 unit
const MAJOR_STEP = 8; // bold lines every 8 units

// Blender's own grid colour is #545454 at 50% alpha over a #3d3d3d ground
// (space_view3d.grid = 0x54545480), i.e. LIGHTER than the floor. Emphasis
// lines are the same hue drawn at full strength.
const MINOR_COLOR = new THREE.Color("#545454");
const MAJOR_COLOR = new THREE.Color("#6a6a6a");
/** Blender's grid alpha; the radial fade multiplies into this. */
const GRID_ALPHA = 0.5;
const AXIS_X_COLOR = new THREE.Color("#c1524f"); // red, X
const AXIS_Z_COLOR = new THREE.Color("#4a7ec4"); // blue, Z

/**
 * Radial fade so distant lines dissolve into the background. This is applied as
 * real per-vertex alpha (RGBA colour attribute), not baked into RGB — baking it
 * would darken lines toward black, which shows up as a dark haze on the grey
 * viewport background instead of fading away.
 */
function fadeAt(x: number, z: number, alpha = 1): number {
  const d = Math.sqrt(x * x + z * z) / RADIUS;
  return Math.max(0, 1 - d * d) * alpha;
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
/**
 * How many segments each grid line is cut into. A line drawn as ONE segment has
 * both endpoints out at the rim, where the fade is zero — so it interpolates
 * from invisible to invisible and never appears, whatever its colour. Cutting
 * it up lets the alpha rise towards the middle, which is the whole effect.
 */
const SEGMENTS = 24;

function buildGridLines(
  step: number,
  color: THREE.Color,
  y: number
): THREE.LineSegments {
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (x1: number, z1: number, x2: number, z2: number) => {
    positions.push(x1, y, z1, x2, y, z2);
    colors.push(color.r, color.g, color.b, fadeAt(x1, z1, GRID_ALPHA));
    colors.push(color.r, color.g, color.b, fadeAt(x2, z2, GRID_ALPHA));
  };
  /** Emits one grid line as SEGMENTS pieces so the fade can vary along it. */
  const pushLine = (
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number
  ) => {
    for (let s = 0; s < SEGMENTS; s += 1) {
      const t0 = s / SEGMENTS;
      const t1 = (s + 1) / SEGMENTS;
      push(
        fromX + (toX - fromX) * t0,
        fromZ + (toZ - fromZ) * t0,
        fromX + (toX - fromX) * t1,
        fromZ + (toZ - fromZ) * t1
      );
    }
  };
  for (let i = -RADIUS; i <= RADIUS; i += step) {
    if (i === 0) continue; // origin lines are drawn as coloured axes
    pushLine(i, -RADIUS, i, RADIUS); // parallel to Z
    pushLine(-RADIUS, i, RADIUS, i); // parallel to X
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
  // Subdivided for the same reason as the grid lines: the two rim endpoints
  // are fully faded, so an undivided line would never be drawn.
  const positions: number[] = [];
  const colors: number[] = [];
  const total = SEGMENTS * 2;
  for (let s = 0; s < total; s += 1) {
    const a0 = -RADIUS + (2 * RADIUS * s) / total;
    const a1 = -RADIUS + (2 * RADIUS * (s + 1)) / total;
    const p = (along: number): [number, number, number] =>
      axis === "x" ? [along, y, 0] : [0, y, along];
    positions.push(...p(a0), ...p(a1));
    colors.push(color.r, color.g, color.b, fadeAt(Math.abs(a0), 0));
    colors.push(color.r, color.g, color.b, fadeAt(Math.abs(a1), 0));
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
