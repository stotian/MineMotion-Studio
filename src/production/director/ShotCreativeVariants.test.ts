import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { sanitizeProductionData } from "../ShotManager";
import {
  annotateShotCreativeVariant,
  applyShotCreativeVariant,
  captureShotCreativeVariant,
  chooseHighestRatedShotVariant,
  compareShotCreativeVariants,
  createShotVariantManifest,
  duplicateShotCreativeVariant,
  rateShotCreativeVariant,
  updateShotCreativeVariant
} from "./ShotCreativeVariants";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { createShowcaseSequenceBlueprint } from "./ShowcaseDirector";

function createShotProject() {
  const initial = createInitialProject();
  return buildDirectorSequence(initial, createShowcaseSequenceBlueprint(initial, {
    subjectId: initial.scene.characters[0].id,
    startFrame: 0,
    secondsPerShot: 1
  })).project;
}

describe("ShotCreativeVariants", () => {
  it("captures, applies, updates and compares non-destructive shot looks", () => {
    let project = createShotProject();
    const shot = project.production.shots[0];
    const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId)!;
    const first = captureShotCreativeVariant(project, shot.id, "Natural");
    project = first.project;
    const firstId = first.variantId!;

    project = {
      ...project,
      scene: {
        ...project.scene,
        cameras: project.scene.cameras.map((candidate) => candidate.id === camera.id ? { ...candidate, focalLength: 85, fov: 24 } : candidate)
      },
      lighting: { ...project.lighting, ambientIntensity: 0.25 }
    };
    const second = captureShotCreativeVariant(project, shot.id, "Dramatic");
    project = rateShotCreativeVariant(second.project, shot.id, second.variantId!, 5).project;
    project = annotateShotCreativeVariant(project, shot.id, second.variantId!, "Portrait direction").project;

    expect(compareShotCreativeVariants(project, shot.id)).toHaveLength(2);
    expect(applyShotCreativeVariant(project, shot.id, firstId).project.scene.cameras.find((candidate) => candidate.id === camera.id)?.focalLength).not.toBe(85);
    expect(chooseHighestRatedShotVariant(project, shot.id).project.scene.cameras.find((candidate) => candidate.id === camera.id)?.focalLength).toBe(85);

    const duplicated = duplicateShotCreativeVariant(project, shot.id, second.variantId!);
    expect(duplicated.project.production.shots[0].creativeVariants).toHaveLength(3);
    const updated = updateShotCreativeVariant(duplicated.project, shot.id, firstId);
    expect(updated.changed).toBe(true);
  });

  it("survives serialization and exports a compact manifest", () => {
    const project = createShotProject();
    const shot = project.production.shots[0];
    const captured = captureShotCreativeVariant(project, shot.id, "Persisted").project;
    const restored = sanitizeProductionData(JSON.parse(JSON.stringify(captured.production)), captured);
    const manifest = JSON.parse(createShotVariantManifest({ ...captured, production: restored }, shot.id)) as { variants: unknown[] };

    expect(restored.shots[0].creativeVariants).toHaveLength(1);
    expect(manifest.variants).toHaveLength(1);
  });
});
