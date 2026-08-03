import { describe, expect, it } from "vitest";
import { createCharacter, createInitialProject } from "../../project/ProjectStore";
import { buildDirectorSequence } from "./DirectorSequenceBuilder";
import { prepareDialogueSequence } from "./DialogueDirector";
import {
  analyzeStudioQuality,
  autoPolishStudioProject,
  createStudioQualityReportMarkdown,
  evaluateTakeQuality,
  markQualityReadyShots
} from "./StudioQualityControl";

function createDirectedProject() {
  const initial = createInitialProject();
  const first = initial.scene.characters[0];
  const second = createCharacter("Quality Alex", [3, 1.05, -1]);
  const cast = { ...initial, scene: { ...initial.scene, characters: [first, second] } };
  const prepared = prepareDialogueSequence(cast, {
    firstCharacterId: first.id,
    secondCharacterId: second.id,
    startFrame: 0,
    secondsPerShot: 1,
    stageActors: true
  });
  return buildDirectorSequence(prepared.project, prepared.blueprint).project;
}

describe("StudioQualityControl", () => {
  it("scores production departments and improves repeatable defects", () => {
    const directed = createDirectedProject();
    const degraded = {
      ...directed,
      scene: {
        ...directed.scene,
        lights: [],
        cameras: directed.scene.cameras.map((camera) => ({ ...camera, metadata: {} }))
      },
      lighting: { ...directed.lighting, shadowsEnabled: false, ambientIntensity: 1.8 },
      production: {
        ...directed.production,
        shots: directed.production.shots.map((shot) => ({
          ...shot,
          approved: true,
          rating: 4,
          outputName: shot.outputName || shot.name,
          renderPasses: shot.renderPasses.includes("beauty") ? shot.renderPasses : (["beauty", ...shot.renderPasses] as typeof shot.renderPasses)
        }))
      }
    };

    const before = analyzeStudioQuality(degraded);
    const polished = autoPolishStudioProject(degraded);

    expect(before.categories.map((category) => category.id)).toEqual(["camera", "takes", "lighting", "continuity", "audio", "render"]);
    expect(before.issues.some((issue) => issue.id.startsWith("camera-profile"))).toBe(true);
    expect(before.issues.some((issue) => issue.id === "lighting-empty")).toBe(true);
    expect(polished.changed).toBe(true);
    expect(polished.report.overallScore).toBeGreaterThan(before.overallScore);
    expect(polished.project.scene.lights.some((light) => light.visible && light.intensity > 0)).toBe(true);
  });

  it("tracks take approval, shot readiness and exports a report", () => {
    const directed = createDirectedProject();
    const unapproved = directed.production.shots.map((shot) => ({ ...shot, approved: false }));
    expect(evaluateTakeQuality(unapproved).issues.some((issue) => issue.id.startsWith("take-approved"))).toBe(true);

    const readyInput = {
      ...directed,
      production: {
        ...directed.production,
        shots: directed.production.shots.map((shot) => ({ ...shot, approved: true, status: "planned" as const }))
      }
    };
    const marked = markQualityReadyShots(readyInput, 0);
    const markdown = createStudioQualityReportMarkdown(marked.project);

    expect(marked.changed).toBe(true);
    expect(marked.project.production.shots.some((shot) => shot.status === "ready")).toBe(true);
    expect(markdown).toContain("## Categories");
    expect(markdown).toContain("## Shot readiness");
  });
});
