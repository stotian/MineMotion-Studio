import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { sampleProjectAnimationWithVfxTiming } from "../../vfx/runtime/VfxAnimationSampling";
import {
  createDefaultProceduralAnimationSettings,
  PROCEDURAL_ANIMATION_KINDS
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

  it("preserves every generator through save, package, autosave, schema 9, and production sampling", () => {
    let project = createInitialProject();
    const targetId = project.scene.characters[0].id;
    let startFrame = 0;
    for (const kind of PROCEDURAL_ANIMATION_KINDS) {
      project = {
        ...project,
        animation: { ...project.animation, currentFrame: startFrame }
      };
      const result = bakeProceduralAnimation(
        project,
        targetId,
        createDefaultProceduralAnimationSettings(kind)
      );
      expect(result.changed).toBe(true);
      project = result.project;
      startFrame += result.project.animation.clips.at(-1)!.durationFrames + 2;
    }
    expect(project.animation.clips).toHaveLength(
      PROCEDURAL_ANIMATION_KINDS.length
    );

    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(project))
    );
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(project)
    );
    for (const candidate of [reloaded, packaged, schema9]) {
      expect(candidate.animation.clips.map((clip) => clip.name)).toEqual(
        project.animation.clips.map((clip) => clip.name)
      );
      expect(candidate.animation.tracks).toEqual(project.animation.tracks);
    }

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, project);
    expect(loadProjectAutosave(storage)?.project.animation.clips).toEqual(
      reloaded.animation.clips
    );

    const sampled = sampleProjectAnimationWithVfxTiming(project, 24);
    expect(sampled.scene.characters[0].boneRotations.body[0])
      .toBeGreaterThan(0);
  });
});
