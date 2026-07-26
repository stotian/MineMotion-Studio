import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createInitialProject, createObjEntity } from "../../project/ProjectStore";
import { createDefaultSteveRig } from "../DefaultSteveRig";
import { makeBoneObjectId } from "../RigSelection";
import { solveLookAtConstraint } from "./LookAtConstraint";
import {
  createLookAtControl,
  sanitizeLookAtControl
} from "./LookAtControl";
import {
  listLookAtTargets,
  mapProjectLookAtControl,
  resolveLookAtSubject
} from "./LookAtMapping";

describe("look-at project mapping", () => {
  it("maps a head target through its exact rendered parent space", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.transform.position = [2, 3, -4];
    character.transform.rotation = [10, 35, -5];
    character.transform.scale = [1.5, 0.8, 2];
    character.boneRotations.root = [8, -12, 5];
    character.boneRotations.body = [-15, 20, 4];
    character.boneRotations.head = [5, -8, 0];
    const target = [8, 7, -10] as [number, number, number];
    const control = {
      ...createLookAtControl({ kind: "head", id: character.id }, null),
      enabled: true,
      targetPosition: target,
      maxAngle: [180, 180, 180] as [number, number, number]
    };
    const mapping = mapProjectLookAtControl(project, control);
    expect(mapping.ok).toBe(true);
    const solve = solveLookAtConstraint(mapping.mapping!.solveInput);
    expect(solve).toMatchObject({ solved: true, reachedTarget: true });

    character.boneRotations.head = solve.rotation!;
    const rendered = createDefaultSteveRig(character);
    rendered.position.set(...character.transform.position);
    rendered.rotation.set(
      ...character.transform.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]
    );
    rendered.scale.set(...character.transform.scale);
    rendered.updateMatrixWorld(true);
    let head: THREE.Object3D | null = null;
    rendered.traverse((object3d) => {
      if (!head && object3d.userData.objectId === makeBoneObjectId(character.id, "head")) {
        head = object3d;
      }
    });
    expect(head).not.toBeNull();
    const source = head!.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1)
      .transformDirection(head!.matrixWorld);
    const expected = new THREE.Vector3(...target).sub(source).normalize();
    expect(direction.distanceTo(expected)).toBeLessThan(1e-8);
  });

  it("maps camera and object subjects to their renderer Euler conventions", () => {
    const project = createInitialProject();
    const object = createObjEntity("asset", "Target Cube");
    object.transform.position = [-3, 2, 5];
    project.scene.importedObjects.push(object);
    const cameraControl = {
      ...createLookAtControl({ kind: "camera" as const, id: project.scene.cameras[0].id }, object.id),
      enabled: true
    };
    const camera = mapProjectLookAtControl(project, cameraControl);
    expect(camera.mapping?.solveInput).toMatchObject({
      sourcePosition: project.scene.cameras[0].transform.position,
      targetPosition: object.transform.position,
      eulerOrder: "YXZ"
    });
    const objectControl = createLookAtControl(
      { kind: "object", id: object.id },
      project.scene.cameras[0].id
    );
    expect(mapProjectLookAtControl(project, objectControl).mapping?.solveInput.eulerOrder)
      .toBe("XYZ");
  });

  it("resolves only supported selected subjects and excludes self from targets", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    expect(resolveLookAtSubject(project, character.id)).toEqual({
      kind: "head",
      id: character.id
    });
    expect(resolveLookAtSubject(
      project,
      makeBoneObjectId(character.id, "head")
    )).toEqual({ kind: "head", id: character.id });
    expect(resolveLookAtSubject(
      project,
      makeBoneObjectId(character.id, "body")
    )).toBeNull();
    expect(resolveLookAtSubject(project, project.scene.lights[0].id)).toBeNull();
    expect(listLookAtTargets(project, character.id).map((entry) => entry.id))
      .not.toContain(character.id);

    const self = createLookAtControl({ kind: "head", id: character.id }, character.id);
    expect(mapProjectLookAtControl(project, self).error).toContain("LOOK_AT_TARGET_SELF");
  });

  it("sanitizes bounded session data without invoking accessors", () => {
    const control = sanitizeLookAtControl({
      ...createLookAtControl({ kind: "head", id: "character_1" }, null),
      targetPosition: [20_000, 2, -20_000],
      maxAngle: [-500, 35, 0],
      influence: 4
    });
    expect(control).toMatchObject({
      targetPosition: [10_000, 2, -10_000],
      maxAngle: [180, 35, 0],
      influence: 1
    });

    let accessed = false;
    const hostile = Object.defineProperty({}, "subject", {
      enumerable: true,
      get() {
        accessed = true;
        return { kind: "head", id: "character_1" };
      }
    });
    expect(sanitizeLookAtControl(hostile)).toBeNull();
    expect(accessed).toBe(false);
  });
});
