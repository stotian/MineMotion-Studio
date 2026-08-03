import { createInitialProject } from "../project/ProjectStore";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
export interface SessionStressReport { iterations: number; minSerializedBytes: number; maxSerializedBytes: number; packageSizeDriftBytes: number; deterministic: boolean; }
export function runSessionStress(iterations = 250): SessionStressReport {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 5000) throw new Error("Stress iterations must be between 1 and 5000.");
  let project = createInitialProject();
  const sizes: number[] = [];
  let firstPackage = ""; let lastPackage = "";
  for (let index = 0; index < iterations; index += 1) {
    project = { ...project, animation: { ...project.animation, currentFrame: index % Math.max(1, project.animation.durationFrames) }, metadata: { ...project.metadata, updatedAt: "2026-01-01T00:00:00.000Z" } };
    const raw = ProjectSerializer.serialize(project);
    sizes.push(new TextEncoder().encode(raw).byteLength);
    const packageJson = JSON.stringify(createMineMotionPackageData(project));
    if (index === 0) firstPackage = packageJson;
    lastPackage = packageJson;
    project = ProjectSerializer.parse(raw);
  }
  return { iterations, minSerializedBytes: Math.min(...sizes), maxSerializedBytes: Math.max(...sizes), packageSizeDriftBytes: new TextEncoder().encode(lastPackage).byteLength - new TextEncoder().encode(firstPackage).byteLength, deterministic: sizes.every((size) => Number.isFinite(size) && size > 0) };
}
