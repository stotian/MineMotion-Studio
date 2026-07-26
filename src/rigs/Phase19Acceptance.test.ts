import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { HistoryStack } from "../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../project/ProjectAutosave";
import { ProjectSerializer } from "../project/ProjectSerializer";
import { createInitialProject } from "../project/ProjectStore";
import { createMineMotionPackageData } from "../project/package/MineMotionPackage";
import { PackageReader } from "../project/package/PackageReader";
import { createFinalCameraFrame } from "../rendering/export/FinalCameraRenderer";
import { syncCinematicTimeline } from "../project/CinematicTimeline";
import { sampleProjectAnimationWithVfxTiming } from "../vfx/runtime/VfxAnimationSampling";
import { createDefaultSteveRig } from "./DefaultSteveRig";
import { setProjectCharacterExpression } from "./expressions/ExpressionOverlayController";

describe("Phase 19 acceptance", () => {
  it("keeps a composite rig state through save, migration, package, autosave, and history", () => {
    const initial = createInitialProject();
    const character = initial.scene.characters[0];
    const expressed = setProjectCharacterExpression(
      initial,
      character.id,
      { enabled: true, preset: "confidence", intensity: 0.7 }
    ).project;
    expressed.scene.characters[0].attachments![0].visible = true;
    expressed.animation.tracks = [{
      id: `${character.id}:bone.rotation.rightForearm`,
      targetId: character.id,
      property: "bone.rotation.rightForearm",
      keyframes: [
        { id: "acceptance_0", frame: 0, value: [0, 0, 0] },
        { id: "acceptance_12", frame: 12, value: [0, 0, 90] }
      ]
    }];
    const composite = syncCinematicTimeline(expressed);
    expect(composite.animation.timelineTracks.find(
      (lane) => lane.id === "track_rig_main"
    )?.items).toHaveLength(1);

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, composite);
    const candidates = [
      ProjectSerializer.parse(ProjectSerializer.serialize(composite)),
      ProjectSerializer.parse(ProjectSerializer.serializeLegacyV9(composite)),
      PackageReader.parse(JSON.stringify(createMineMotionPackageData(composite))),
      loadProjectAutosave(storage)!.project
    ];
    for (const candidate of candidates) {
      const restored = candidate.scene.characters[0];
      expect(restored.expression).toEqual({
        enabled: true,
        preset: "confidence",
        intensity: 0.7
      });
      expect(restored.attachments?.[0].visible).toBe(true);
      expect(candidate.animation.timelineTracks.find(
        (lane) => lane.id === "track_rig_main"
      )?.items[0]).toMatchObject({
        targetId: restored.id,
        boneId: "rightForearm",
        startFrame: 0,
        durationFrames: 12
      });
    }

    const history = new HistoryStack<typeof initial>();
    history.push(initial, "Before Phase 19 composite");
    const undone = history.undo(composite)!;
    expect(undone.scene.characters[0].expression).toBeUndefined();
    expect(history.redo(undone)?.scene.characters[0].expression?.preset)
      .toBe("confidence");
  });

  it("matches production preview and final-export rig sampling", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.expression = {
      enabled: true,
      preset: "surprise",
      intensity: 1
    };
    character.attachments![0].visible = true;
    project.animation.tracks = [{
      id: `${character.id}:bone.rotation.rightForearm`,
      targetId: character.id,
      property: "bone.rotation.rightForearm",
      keyframes: [
        { frame: 0, value: [0, 0, 0] },
        { frame: 12, value: [0, 0, 75] }
      ]
    }];

    const preview = sampleProjectAnimationWithVfxTiming(project, 12);
    const finalFrame = createFinalCameraFrame(
      project,
      project.exportSettings,
      12
    );
    const exported = sampleProjectAnimationWithVfxTiming(finalFrame, 12);
    const previewRig = createDefaultSteveRig(preview.scene.characters[0]);
    const exportRig = createDefaultSteveRig(exported.scene.characters[0]);
    previewRig.updateMatrixWorld(true);
    exportRig.updateMatrixWorld(true);

    for (const rig of [previewRig, exportRig]) {
      expect(rig.getObjectByName("Expression Overlay")?.children)
        .toHaveLength(5);
      expect(rig.getObjectByName("Sword Placeholder")).toBeDefined();
    }
    const previewSword = previewRig.getObjectByName("Sword Placeholder")!
      .getWorldPosition(new THREE.Vector3());
    const exportSword = exportRig.getObjectByName("Sword Placeholder")!
      .getWorldPosition(new THREE.Vector3());
    expect(exportSword.toArray()).toEqual(previewSword.toArray());
    expect(exported.scene.characters[0].boneRotations.rightForearm)
      .toEqual([0, 0, 75]);
    expect(finalFrame.animation.currentFrame).toBe(12);
    expect(finalFrame.animation.isPlaying).toBe(false);
  });
});
