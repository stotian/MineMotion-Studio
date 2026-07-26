import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { Animator } from "../../animation/Animator";
import { HistoryStack } from "../../history/HistoryStack";
import type { MineMotionProject } from "../../project/ProjectFile";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject, createObjEntity } from "../../project/ProjectStore";
import {
  bakeProjectLookAt,
  previewProjectLookAt
} from "./LookAtController";
import { createLookAtControl } from "./LookAtControl";

describe("production look-at controller", () => {
  it("previews without tracks and bakes only the camera rotation track at a sampled frame", () => {
    const project = createInitialProject();
    const camera = project.scene.cameras[0];
    const target = createObjEntity("asset", "Moving Target");
    project.scene.importedObjects.push(target);
    project.animation.tracks.push({
      id: `${target.id}:transform.position`,
      targetId: target.id,
      property: "transform.position",
      keyframes: [
        { frame: 0, value: [0, 1, 0] },
        { frame: 20, value: [8, 5, -4] }
      ]
    });
    const control = {
      ...createLookAtControl({ kind: "camera" as const, id: camera.id }, target.id),
      enabled: true
    };
    const sampled = Animator.sampleProject(project, 10);
    const preview = previewProjectLookAt(sampled, control);
    expect(preview.project).not.toBe(sampled);
    expect(sampled.scene.cameras[0].transform.rotation).toEqual(camera.transform.rotation);
    expect(preview.project.animation.tracks).toEqual(sampled.animation.tracks);

    const result = bakeProjectLookAt(project, control, 10);
    expect(result).toMatchObject({
      ok: true,
      changed: true,
      error: null,
      historyLabel: expect.stringContaining("camera")
    });
    const subjectTracks = result.project.animation.tracks.filter(
      (track) => track.targetId === camera.id
    );
    expect(subjectTracks).toHaveLength(1);
    expect(subjectTracks[0]).toMatchObject({
      property: "transform.rotation",
      keyframes: [{ frame: 10 }]
    });
    const targetAtFrame = new THREE.Vector3(4, 3, -2);
    const expected = targetAtFrame.sub(new THREE.Vector3(...camera.transform.position)).normalize();
    const rotation = subjectTracks[0].keyframes[0].value;
    const rendered = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2]),
      "YXZ"
    ));
    expect(rendered.distanceTo(expected)).toBeLessThan(1e-8);
  });

  it("bakes head look-at through the authoritative and compatibility tracks atomically", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const control = {
      ...createLookAtControl({ kind: "head" as const, id: character.id }, null),
      enabled: true,
      targetPosition: [4, 4, -4] as [number, number, number]
    };
    const result = bakeProjectLookAt(project, control, 12);
    expect(result).toMatchObject({ ok: true, changed: true });
    expect(result.project.animation.tracks).toHaveLength(1);
    expect(result.project.animation.tracks[0]).toMatchObject({
      targetId: character.id,
      property: "bone.rotation.head",
      keyframes: [{ frame: 12 }]
    });
    expect(result.project.scene.characters[0].boneKeyframes?.find(
      (track) => track.boneId === "head"
    )?.keyframes[0].frame).toBe(12);
    expect(result.project.animation.timelineTracks.find(
      (lane) => lane.id === "track_rig_main"
    )?.items).toHaveLength(1);

    const history = new HistoryStack<MineMotionProject>();
    history.push(project, result.historyLabel!);
    const undone = history.undo(result.project)!;
    expect(undone.animation.tracks).toEqual([]);
    expect(history.undo(undone)).toBeNull();
    expect(history.redo(undone)?.animation.tracks).toHaveLength(1);

    const repeated = bakeProjectLookAt(result.project, control, 12);
    expect(repeated).toMatchObject({
      ok: true,
      changed: false,
      project: result.project,
      historyLabel: null
    });
    const reloaded = ProjectSerializer.parse(
      ProjectSerializer.serialize(result.project)
    );
    expect(reloaded.animation.tracks[0].property).toBe("bone.rotation.head");
  });

  it("supports object rotation and reports honest angle clamping", () => {
    const project = createInitialProject();
    const object = createObjEntity("asset", "Looker");
    project.scene.importedObjects.push(object);
    const control = {
      ...createLookAtControl({ kind: "object" as const, id: object.id }, null),
      enabled: true,
      targetPosition: [10, 8, -4] as [number, number, number],
      maxAngle: [10, 15, 0] as [number, number, number]
    };
    const preview = previewProjectLookAt(project, control);
    expect(preview.solve).toMatchObject({
      solved: true,
      clamped: true,
      reachedTarget: false
    });
    const result = bakeProjectLookAt(project, control, 4);
    expect(result.project.animation.tracks.find(
      (track) => track.targetId === object.id
    )?.property).toBe("transform.rotation");
  });

  it("rejects disabled, locked, missing, invalid-frame, and hostile controls without mutation", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const disabled = createLookAtControl({ kind: "head", id: character.id }, null);
    expect(bakeProjectLookAt(project, disabled).error).toContain("LOOK_AT_CONTROL_DISABLED");
    character.locked = true;
    expect(bakeProjectLookAt(project, { ...disabled, enabled: true }).error)
      .toContain("LOOK_AT_SUBJECT_LOCKED");
    character.locked = false;
    expect(bakeProjectLookAt(project, {
      ...disabled,
      enabled: true,
      targetId: "missing"
    }).error).toContain("LOOK_AT_TARGET_MISSING");
    for (const frame of [-1, 1.5, Number.NaN, project.animation.durationFrames + 1]) {
      expect(bakeProjectLookAt(project, { ...disabled, enabled: true }, frame))
        .toMatchObject({ ok: false, changed: false, project });
    }

    let accessed = false;
    const hostile = Object.defineProperty({}, "subject", {
      get() {
        accessed = true;
        return { kind: "head", id: character.id };
      }
    });
    expect(bakeProjectLookAt(project, hostile as never)).toMatchObject({
      ok: false,
      changed: false,
      project
    });
    expect(accessed).toBe(false);
  });
});
