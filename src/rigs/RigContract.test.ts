import { describe, expect, it } from "vitest";
import { Animator } from "../animation/Animator";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createInitialProject } from "../project/ProjectStore";
import { getRigDefinition, validateMinecraftRigPresetCatalog } from "./MinecraftRigPresets";
import {
  reconcileRigAnimation,
  sanitizeRigAttachments,
  sanitizeRigVector,
  validateRigDefinition
} from "./RigContract";
import { createDefaultCharacterAttachments } from "./RigInstance";

describe("rig contract consolidation", () => {
  it("validates every existing Steve, Alex, generic, and mob definition", () => {
    expect(validateMinecraftRigPresetCatalog()).toEqual([]);
    const invalid = structuredClone(getRigDefinition("steve"));
    invalid.bones[0].parentId = "head";
    expect(validateRigDefinition(invalid).map((entry) => entry.code)).toContain("RIG_BONE_CYCLE");
  });

  it("repairs non-finite vectors and bounds attachment data", () => {
    expect(sanitizeRigVector([1, Number.NaN, 3], [4, 5, 6])).toEqual([4, 5, 6]);
    const definition = getRigDefinition("steve");
    const sanitized = sanitizeRigAttachments([
      { id: "safe", name: "Sword", pointId: "rightHand", kind: "placeholder_sword", visible: true },
      { id: "bad-point", name: "Bad", pointId: "tail", kind: "placeholder_sword", visible: true },
      { id: "bad-obj", name: "OBJ", pointId: "leftHand", kind: "obj", visible: true }
    ], definition, createDefaultCharacterAttachments());
    expect(sanitized).toEqual([
      { id: "safe", name: "Sword", pointId: "rightHand", kind: "placeholder_sword", visible: true }
    ]);
  });

  it("migrates legacy character bone tracks into the authoritative timeline", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneKeyframes = [{
      id: "bone:head",
      boneId: "head",
      keyframes: [
        { frame: 0, rotation: [0, 0, 0], interpolation: "linear" },
        { frame: 10, rotation: [20, 30, 0], interpolation: "easeInOut" }
      ]
    }];

    const reloaded = ProjectSerializer.parse(JSON.stringify(project));
    const track = reloaded.animation.tracks.find((entry) => entry.property === "bone.rotation.head");
    expect(track?.targetId).toBe(character.id);
    expect(track?.keyframes.map((entry) => [entry.frame, entry.value, entry.interpolation])).toEqual([
      [0, [0, 0, 0], "linear"],
      [10, [20, 30, 0], "ease-in-out"]
    ]);
    expect(reloaded.scene.characters[0].boneKeyframes?.[0].keyframes[1]).toMatchObject({
      frame: 10,
      rotation: [20, 30, 0],
      interpolation: "easeInOut"
    });
    expect(Animator.sampleProject(reloaded, 10).scene.characters[0].boneRotations.head).toEqual([20, 30, 0]);
  });

  it("keeps global timeline values authoritative and supplements missing legacy frames", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneKeyframes = [{
      id: "bone:head",
      boneId: "head",
      keyframes: [
        { frame: 5, rotation: [1, 1, 1], interpolation: "linear" },
        { frame: 8, rotation: [8, 8, 8], interpolation: "constant" }
      ]
    }];
    const globalTrack = {
      id: "custom-track-id",
      targetId: character.id,
      property: "bone.rotation.head" as const,
      keyframes: [{ frame: 5, value: [5, 5, 5] as [number, number, number], interpolation: "ease-out" as const }]
    };
    const positionTrack = {
      id: "position-track",
      targetId: character.id,
      property: "transform.position" as const,
      keyframes: [{ frame: 0, value: [0, 1, 0] as [number, number, number] }]
    };
    const scaleTrack = {
      id: "scale-track",
      targetId: character.id,
      property: "transform.scale" as const,
      keyframes: [{ frame: 0, value: [1, 1, 1] as [number, number, number] }]
    };
    const reconciled = reconcileRigAnimation(
      [character],
      [positionTrack, globalTrack, scaleTrack],
      project.animation.durationFrames
    );
    expect(reconciled.tracks.map((track) => track.id)).toEqual([
      "position-track",
      "custom-track-id",
      "scale-track"
    ]);
    expect(reconciled.tracks[1].keyframes.map((entry) => [entry.frame, entry.value])).toEqual([
      [5, [5, 5, 5]],
      [8, [8, 8, 8]]
    ]);
    expect(reconciled.characters[0].boneKeyframes?.[0].keyframes.map((entry) => entry.interpolation)).toEqual([
      "easeOut",
      "constant"
    ]);
  });
});
