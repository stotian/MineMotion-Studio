import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";

// Pure helper: the axis-aligned bounds of the thing worth showcasing — the
// imported Minecraft world blocks when present, otherwise the placed scene
// objects. Used to auto-fit the isometric turntable's centre and orbit radius.

export interface BuildBounds {
  center: Vector3Tuple;
  /** Half-extents of the bounding box. */
  half: Vector3Tuple;
  /** A camera orbit distance that comfortably frames the bounds. */
  radius: number;
}

const FALLBACK: BuildBounds = { center: [0, 2, 0], half: [1, 1, 1], radius: 12 };

export function computeBuildBounds(project: MineMotionProject): BuildBounds {
  const points: Vector3Tuple[] = [];
  for (const chunk of project.world?.importedChunks ?? []) {
    for (const block of chunk.blocks) points.push([block.x + 0.5, block.y + 0.5, block.z + 0.5]);
  }
  if (points.length === 0) {
    for (const entity of project.scene.characters) points.push(entity.transform.position);
    for (const entity of project.scene.importedObjects) points.push(entity.transform.position);
  }
  if (points.length === 0) return FALLBACK;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const [x, y, z] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const half: Vector3Tuple = [(maxX - minX) / 2, (maxY - minY) / 2, (maxZ - minZ) / 2];
  const center: Vector3Tuple = [minX + half[0], minY + half[1], minZ + half[2]];
  // Frame the widest horizontal span plus the height, with headroom.
  const horizontal = Math.hypot(half[0], half[2]);
  const radius = Math.max(4, (Math.max(horizontal, half[1]) + 2) * 1.6);
  return { center, half, radius };
}
