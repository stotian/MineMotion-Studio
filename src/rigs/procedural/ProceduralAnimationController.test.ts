import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import {
  createDefaultProceduralAnimationSettings
} from "./ProceduralAnimation";
import { bakeProceduralAnimation } from "./ProceduralAnimationController";

describe("procedural animation baking", () => {
  it("adds one reusable clip and editable global tracks in one project result", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    project.animation.currentFrame = 12;
    const result = bakeProceduralAnimation(
      project,
      character.id,
      createDefaultProceduralAnimationSettings("idle")
    );

    expect(result.changed).toBe(true);
    expect(result.historyLabel).toBe("Generate idle animation");
    expect(result.project).not.toBe(project);
    expect(project.animation.clips).toEqual([]);
    expect(result.project.animation.clips).toHaveLength(1);
    expect(result.project.animation.tracks).toHaveLength(4);
    expect(result.project.animation.tracks[0].keyframes[0].frame).toBe(12);
    expect(result.project.animation.tracks[0].keyframes.at(-1)?.frame).toBe(60);
    expect(result.project.animation.timelineTracks.find(
      (track) => track.id === "track_rig_main"
    )?.items.length).toBeGreaterThan(0);

    const repeated = bakeProceduralAnimation(
      result.project,
      character.id,
      createDefaultProceduralAnimationSettings("idle")
    );
    expect(repeated.project.animation.clips).toHaveLength(1);
    expect(repeated.project.animation.tracks.every((track) =>
      new Set(track.keyframes.map((keyframe) => keyframe.frame)).size ===
        track.keyframes.length
    )).toBe(true);
  });

  it("round-trips generated keys and restores the atomic result through history", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const generated = bakeProceduralAnimation(
      project,
      character.id,
      createDefaultProceduralAnimationSettings("idle")
    ).project;
    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(generated));
    expect(reloaded.animation.clips[0].name).toBe("Procedural Idle");
    expect(reloaded.animation.tracks).toHaveLength(4);

    const history = new HistoryStack<typeof project>();
    history.push(project, "Before procedural generation");
    expect(history.undo(generated)?.animation.tracks).toEqual([]);
  });

  it("fails without mutation for missing or locked targets", () => {
    const project = createInitialProject();
    const settings = createDefaultProceduralAnimationSettings("idle");
    expect(bakeProceduralAnimation(project, "missing", settings)).toMatchObject({
      project,
      changed: false,
      error: expect.stringContaining("TARGET_MISSING")
    });
    project.scene.characters[0].locked = true;
    expect(bakeProceduralAnimation(
      project,
      project.scene.characters[0].id,
      settings
    )).toMatchObject({
      project,
      changed: false,
      error: expect.stringContaining("TARGET_LOCKED")
    });
  });
});
