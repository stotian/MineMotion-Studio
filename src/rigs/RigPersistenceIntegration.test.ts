import { describe, expect, it } from "vitest";
import { HistoryStack } from "../history/HistoryStack";
import { loadProjectAutosave, saveProjectAutosave } from "../project/ProjectAutosave";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createInitialProject } from "../project/ProjectStore";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
import { PackageReader } from "../project/package/PackageReader";
import { getRigTimelineItems } from "./RigSerializer";

describe("rig persistence integration", () => {
  it("keeps one authoritative timeline with a legacy projection across every current persistence path", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneKeyframes = [{
      id: "bone:rightArm",
      boneId: "rightArm",
      keyframes: [{ frame: 24, rotation: [-75, 10, 20], interpolation: "easeOut" }]
    }];
    character.attachments = [{
      id: "attachment_test_sword",
      name: "Test Sword",
      pointId: "rightHand",
      kind: "placeholder_sword",
      visible: true
    }];
    project.rigs.savedPoses = [{
      id: "pose_test",
      name: "Test Pose",
      description: "Persistence fixture.",
      boneRotations: { rightArm: [-75, 10, 20] }
    }];

    const serialized = ProjectSerializer.serialize(project);
    const reloaded = ProjectSerializer.parse(serialized);
    expect(reloaded.animation.tracks).toHaveLength(1);
    expect(reloaded.animation.tracks[0]).toMatchObject({
      targetId: character.id,
      property: "bone.rotation.rightArm",
      keyframes: [{ frame: 24, value: [-75, 10, 20], interpolation: "ease-out" }]
    });
    expect(reloaded.scene.characters[0].boneKeyframes?.[0].keyframes[0].rotation).toEqual([-75, 10, 20]);
    expect(reloaded.scene.characters[0].attachments?.[0].name).toBe("Test Sword");
    expect(reloaded.rigs.savedPoses[0].boneRotations.rightArm).toEqual([-75, 10, 20]);
    expect(getRigTimelineItems(reloaded)[0]).toMatchObject({ boneId: "rightArm", startFrame: 24 });
    expect(reloaded.animation.timelineTracks.find((lane) => lane.id === "track_rig_main")?.items[0]).toMatchObject({ boneId: "rightArm" });

    const packageReloaded = PackageReader.parse(JSON.stringify(createMineMotionPackageData(reloaded)));
    expect(packageReloaded.animation.tracks[0].keyframes[0].value).toEqual([-75, 10, 20]);

    const storage = new Map<string, string>();
    const autosaveStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); }
    };
    saveProjectAutosave(autosaveStorage, reloaded);
    expect(loadProjectAutosave(autosaveStorage)?.project.animation.tracks[0].property).toBe("bone.rotation.rightArm");

    const history = new HistoryStack<typeof reloaded>();
    history.push(reloaded, "Rig checkpoint");
    const withoutTracks = { ...reloaded, animation: { ...reloaded.animation, tracks: [] } };
    expect(history.undo(withoutTracks)?.animation.tracks[0].keyframes[0].value).toEqual([-75, 10, 20]);

    const schema9 = ProjectSerializer.parse(ProjectSerializer.serializeLegacyV9(reloaded));
    expect(schema9.animation.tracks[0].property).toBe("bone.rotation.rightArm");
    expect(schema9.scene.characters[0].boneKeyframes?.[0].keyframes[0].rotation).toEqual([-75, 10, 20]);
  });
});
