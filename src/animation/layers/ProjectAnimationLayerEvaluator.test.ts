import { describe, expect, it } from "vitest";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import type { ReusableAnimationClip } from "../../project/ProjectFile";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { addClipToAnimationLayer, updateNlaLayer } from "../editor/NlaTracks";
import { createNlaLayerTrack } from "./AnimationLayerNlaAdapter";
import { sampleProjectWithAnimationLayers } from "./ProjectAnimationLayerEvaluator";

function positionClip(id: string, value: [number, number, number]): ReusableAnimationClip {
  return {
    id,
    name: id,
    description: "",
    targetType: "character",
    durationFrames: 10,
    tracks: [{
      property: "transform.position",
      keyframes: [{ frame: 0, value }, { frame: 10, value }]
    }],
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

describe("project animation layer evaluation", () => {
  it("evaluates NLA layers after authoritative global tracks without mutating the source", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    project.animation.tracks.push({
      id: `${character.id}:transform.position`,
      targetId: character.id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 0, 0] },
        { frame: 10, value: [10, 0, 0] }
      ]
    });
    const clip = positionClip("base_clip", [20, 0, 0]);
    project.animation.clips.push(clip);
    project.animation.nlaTracks = addClipToAnimationLayer(
      [],
      clip,
      character.id,
      0,
      "base"
    );
    project.animation.nlaTracks = updateNlaLayer(
      project.animation.nlaTracks,
      project.animation.nlaTracks[0].id,
      { weight: 0.5 }
    );

    const result = sampleProjectWithAnimationLayers(project, 10);
    expect(result.project.scene.characters[0].transform.position).toEqual([15, 0, 0]);
    expect(result.activeLayerIds).toEqual([project.animation.nlaTracks[0].id]);
    expect(project.scene.characters[0].transform.position).toEqual([0, 0.08, 0]);
  });

  it("validates VFX sync references and missing layer targets", () => {
    const project = createInitialProject();
    project.effects.instances.push(
      createEffectInstance("lightningStrike", { id: "effect_valid", startFrame: 0 })
    );
    const vfx = createNlaLayerTrack(project.scene.characters[0].id, "vfxSync");
    vfx.vfxEffectIds = ["effect_valid", "effect_missing"];
    const missing = createNlaLayerTrack("missing_target", "base");
    project.animation.nlaTracks = [vfx, missing];
    const result = sampleProjectWithAnimationLayers(project, 0);
    expect(result.vfxEffectIds).toEqual(["effect_valid"]);
    expect(result.warnings).toContain("ANIMATION_LAYER_TARGET_MISSING: missing_target");
    expect(result.warnings).toContain("ANIMATION_LAYER_VFX_MISSING: effect_missing");
  });

  it("round-trips layer defaults, zero weights, mute, and VFX metadata through schemas 10 and 9", () => {
    const project = createInitialProject();
    const targetId = project.scene.characters[0].id;
    const additive = createNlaLayerTrack(targetId, "additiveMotion");
    additive.weight = 0;
    additive.muted = true;
    const vfx = createNlaLayerTrack(targetId, "vfxSync");
    vfx.vfxEffectIds = ["effect_1"];
    project.animation.nlaTracks = [additive, vfx];

    for (const raw of [
      ProjectSerializer.serialize(project),
      ProjectSerializer.serializeLegacyV9(project)
    ]) {
      const parsed = ProjectSerializer.parse(raw);
      expect(parsed.animation.nlaTracks).toMatchObject([
        {
          layerKind: "additiveMotion",
          blendMode: "additive",
          weight: 0,
          muted: true
        },
        {
          layerKind: "vfxSync",
          blendMode: "metadata",
          vfxEffectIds: ["effect_1"]
        }
      ]);
    }

    const legacy = structuredClone(project);
    legacy.animation.nlaTracks = [{
      id: "legacy_nla",
      name: "NLA Clips",
      targetId,
      clips: []
    }];
    const parsedLegacy = ProjectSerializer.parse(
      JSON.stringify(ProjectSerializer.toSerializableProject(legacy))
    );
    expect(parsedLegacy.animation.nlaTracks[0]).toMatchObject({
      layerKind: "base",
      blendMode: "override",
      weight: 1,
      muted: false
    });
  });

  it("preserves one atomic layered timeline through packages, autosave, and history", () => {
    const project = createInitialProject();
    const targetId = project.scene.characters[0].id;
    const clip = positionClip("persisted_layer_clip", [6, 2, -1]);
    project.animation.clips.push(clip);
    project.animation.nlaTracks = addClipToAnimationLayer(
      [],
      clip,
      targetId,
      8,
      "additiveMotion"
    );
    project.animation.nlaTracks = updateNlaLayer(
      project.animation.nlaTracks,
      project.animation.nlaTracks[0].id,
      { weight: 0.35 }
    );

    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(project))
    );
    expect(packaged.animation.nlaTracks[0]).toMatchObject({
      layerKind: "additiveMotion",
      blendMode: "additive",
      weight: 0.35,
      clips: [{ clipId: clip.id, startFrame: 8 }]
    });

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, packaged);
    const autosaved = loadProjectAutosave(storage)?.project;
    expect(autosaved?.animation.nlaTracks).toEqual(
      packaged.animation.nlaTracks
    );

    const history = new HistoryStack<typeof project>();
    history.push(project, "Layer checkpoint");
    const withoutLayers = {
      ...project,
      animation: { ...project.animation, nlaTracks: [] }
    };
    const restored = history.undo(withoutLayers);
    expect(restored?.animation.nlaTracks[0].layerKind)
      .toBe("additiveMotion");
    expect(history.redo(restored!)?.animation.nlaTracks).toEqual([]);
  });
});
