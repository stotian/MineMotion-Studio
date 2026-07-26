import { describe, expect, it } from "vitest";
import { Animator } from "../../animation/Animator";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import { getRigDefinition } from "../MinecraftRigPresets";
import { BlockbenchImporter } from "./BlockbenchImporter";
import {
  resolveBlockbenchBoneMappings,
  sanitizeBlockbenchBoneMappingOverrides
} from "./BlockbenchMapping";
import {
  bakeBlockbenchAnimation,
  setBlockbenchBoneMapping
} from "./BlockbenchMappingController";
import { BbmodelParser } from "./BbmodelParser";

const RAW_MODEL = JSON.stringify({
  name: "Mapped Player",
  meta: { format_version: "4.12", model_format: "free" },
  elements: [],
  outliner: [
    {
      uuid: "group-root",
      name: "root",
      children: [
        { uuid: "group-torso", name: "torso", children: [] },
        { uuid: "group-head", name: "head", children: [] },
        { uuid: "group-left-arm", name: "left_arm", children: [] },
        { uuid: "group-custom", name: "custom limb", children: [] }
      ]
    }
  ],
  animations: [{
    uuid: "animation-wave",
    name: "Wave",
    length: 1,
    snapping: 20,
    animators: {
      "group-head": {
        name: "head",
        type: "bone",
        keyframes: [
          {
            channel: "rotation",
            time: 0,
            interpolation: "linear",
            data_points: [{ x: 0, y: "10", z: 0 }]
          },
          {
            channel: "rotation",
            time: 1,
            interpolation: "catmullrom",
            data_points: [{ x: 0, y: 25, z: 0 }]
          },
          {
            channel: "rotation",
            time: 0.25,
            interpolation: "linear",
            data_points: [{ x: "query.anim_time", y: 0, z: 0 }]
          }
        ]
      },
      "group-custom": {
        name: "custom limb",
        type: "bone",
        keyframes: [{
          channel: "rotation",
          time: 0.5,
          interpolation: "step",
          data_points: [{ x: -20, y: 0, z: 0 }]
        }]
      },
      "unknown-group": {
        name: "unknown",
        type: "bone",
        keyframes: [{
          channel: "rotation",
          time: 0.25,
          data_points: [{ x: "query.anim_time", y: 0, z: 0 }]
        }]
      }
    }
  }]
});

describe("Blockbench mapping", () => {
  it("maps only reliable exact and alias names and preserves manual fallback", () => {
    const model = BbmodelParser.parse(RAW_MODEL);
    const definition = getRigDefinition("steve");
    const automatic = resolveBlockbenchBoneMappings(model, definition);

    expect(automatic.entries.map((entry) => [
      entry.sourceName,
      entry.targetBoneId,
      entry.method
    ])).toEqual([
      ["root", "root", "exact"],
      ["torso", "body", "alias"],
      ["head", "head", "exact"],
      ["left_arm", "leftArm", "exact"],
      ["custom limb", null, "unmapped"]
    ]);

    const manual = resolveBlockbenchBoneMappings(model, definition, [{
      rigPresetId: "steve",
      sourceGroupId: "group-custom",
      targetBoneId: "rightArm"
    }]);
    expect(manual.entries.at(-1)).toMatchObject({
      targetBoneId: "rightArm",
      method: "manual",
      confidence: 1
    });
    const disabled = resolveBlockbenchBoneMappings(model, definition, [{
      rigPresetId: "steve",
      sourceGroupId: "group-head",
      targetBoneId: null
    }]);
    expect(disabled.entries.find((entry) =>
      entry.sourceGroupId === "group-head")).toMatchObject({
      targetBoneId: null,
      method: "manual"
    });
  });

  it("fails ambiguous automatic targets and sanitizes hostile overrides", () => {
    const model = BbmodelParser.fromJson({
      elements: [],
      outliner: [
        { uuid: "first", name: "head", children: [] },
        { uuid: "second", name: "Head", children: [] }
      ]
    });
    const report = resolveBlockbenchBoneMappings(
      model,
      getRigDefinition("steve")
    );
    expect(report.entries.every((entry) =>
      entry.method === "conflict" && entry.targetBoneId === null)).toBe(true);
    expect(report.warnings).toContain(
      "BLOCKBENCH_MAPPING_CONFLICT: Multiple source groups resolved to the same rig bone."
    );

    expect(sanitizeBlockbenchBoneMappingOverrides(model, [
      {
        rigPresetId: "steve",
        sourceGroupId: "first",
        targetBoneId: "head"
      },
      {
        rigPresetId: "steve",
        sourceGroupId: "second",
        targetBoneId: "head"
      },
      {
        rigPresetId: "unknown",
        sourceGroupId: "second",
        targetBoneId: "body"
      }
    ])).toEqual([{
      rigPresetId: "steve",
      sourceGroupId: "first",
      targetBoneId: "head"
    }]);
  });

  it("stores manual mapping and bakes a converted clip atomically", async () => {
    const imported = await BlockbenchImporter.fromFile(
      new File([RAW_MODEL], "mapped.bbmodel")
    );
    const initial = createInitialProject();
    const character = initial.scene.characters[0];
    initial.assets.blockbench = [imported.asset];
    initial.rigs.blockbenchModels = [imported.asset];

    const mapped = setBlockbenchBoneMapping(
      initial,
      imported.asset.id,
      character.rigPreset,
      "group-custom",
      "rightArm"
    );
    expect(mapped).toMatchObject({
      changed: true,
      historyLabel: "Map Blockbench bone",
      error: null
    });
    expect(mapped.project.assets.blockbench[0].boneMappings).toEqual(
      mapped.project.rigs.blockbenchModels[0].boneMappings
    );

    const baked = bakeBlockbenchAnimation(
      mapped.project,
      imported.asset.id,
      character.id,
      "animation-wave"
    );
    expect(baked).toMatchObject({
      changed: true,
      historyLabel: "Apply Blockbench animation",
      error: null
    });
    expect(baked.warnings).toContain(
      "BLOCKBENCH_INTERPOLATION_APPROXIMATED: Unsupported interpolation was imported as linear."
    );
    expect(baked.warnings).toContain(
      "BLOCKBENCH_ANIMATION_VALUE_UNSUPPORTED: Non-numeric rotation expressions were skipped."
    );
    const clip = baked.project.animation.clips.find((entry) =>
      entry.name === "Wave"
    );
    expect(clip?.durationFrames).toBe(24);
    expect(clip?.tracks.map((track) => track.property)).toEqual([
      "bone.rotation.head",
      "bone.rotation.rightArm"
    ]);
    expect(clip?.tracks[1].keyframes[0]).toMatchObject({
      frame: 12,
      value: [-20, 0, 0],
      interpolation: "constant"
    });
    expect(baked.project.animation.tracks.some((track) =>
      track.targetId === character.id &&
      track.property === "bone.rotation.rightArm" &&
      track.keyframes.some((keyframe) => keyframe.frame === 12)
    )).toBe(true);
    expect(
      Animator.sampleProject(baked.project, 12)
        .scene.characters[0].boneRotations.rightArm
    ).toEqual([-20, 0, 0]);
    expect(bakeBlockbenchAnimation(
      baked.project,
      imported.asset.id,
      character.id,
      "animation-wave"
    )).toMatchObject({
      changed: false,
      error: "BLOCKBENCH_ANIMATION_UNCHANGED"
    });

    const history = new HistoryStack<typeof initial>();
    history.push(initial, mapped.historyLabel!);
    history.push(mapped.project, baked.historyLabel!);
    expect(history.undo(baked.project)?.assets.blockbench[0].boneMappings)
      .toEqual(mapped.project.assets.blockbench[0].boneMappings);

    const packaged = PackageReader.parse(JSON.stringify(
      createMineMotionPackageData(baked.project)
    ));
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(baked.project)
    );
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, baked.project);
    const autosaved = loadProjectAutosave(storage)!.project;
    const reloaded = ProjectSerializer.parse(
      ProjectSerializer.serialize(baked.project)
    );
    for (const candidate of [reloaded, packaged, schema9, autosaved]) {
      expect(candidate.assets.blockbench[0].boneMappings).toEqual([{
        rigPresetId: "steve",
        sourceGroupId: "group-custom",
        targetBoneId: "rightArm"
      }]);
      expect(candidate.animation.clips.some((entry) => entry.name === "Wave"))
        .toBe(true);
      expect(
        Animator.sampleProject(candidate, 12)
          .scene.characters[0].boneRotations.rightArm
      ).toEqual([-20, 0, 0]);
    }
  });

  it("rejects locked targets, invalid mappings, expressions, and no-op remaps", async () => {
    const imported = await BlockbenchImporter.fromFile(
      new File([RAW_MODEL], "mapped.bbmodel")
    );
    const project = createInitialProject();
    project.assets.blockbench = [imported.asset];
    project.rigs.blockbenchModels = [imported.asset];
    const character = project.scene.characters[0];

    expect(setBlockbenchBoneMapping(
      project,
      imported.asset.id,
      character.rigPreset,
      "missing",
      "head"
    ).error).toMatch(/^BLOCKBENCH_MAPPING_GROUP_MISSING/);

    const mapped = setBlockbenchBoneMapping(
      project,
      imported.asset.id,
      character.rigPreset,
      "group-custom",
      "rightArm"
    );
    expect(setBlockbenchBoneMapping(
      mapped.project,
      imported.asset.id,
      character.rigPreset,
      "group-custom",
      "rightArm"
    ).error).toBe("BLOCKBENCH_MAPPING_UNCHANGED");

    const locked = {
      ...mapped.project,
      scene: {
        ...mapped.project.scene,
        characters: mapped.project.scene.characters.map((entry) =>
          entry.id === character.id ? { ...entry, locked: true } : entry
        )
      }
    };
    expect(bakeBlockbenchAnimation(
      locked,
      imported.asset.id,
      character.id,
      "animation-wave"
    ).error).toMatch(/^BLOCKBENCH_ANIMATION_TARGET_LOCKED/);
  });
});
