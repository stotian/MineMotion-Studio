import type {
  CharacterEntity,
  MineMotionProject,
  SceneEntity
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import { getRigDefinition } from "../MinecraftRigPresets";
import {
  addRigVectors,
  inverseRigQuaternion,
  inverseTransformRigPoint,
  isFiniteRigVector,
  isValidRigTransform,
  quaternionFromRigEulerDegrees,
  rotateRigVector,
  subtractRigVectors,
  transformRigPoint
} from "../RigSpaceMath";
import type { RigVector3Tuple } from "../RigTypes";
import type { LookAtEulerOrder, LookAtConstraintInput } from "./LookAtConstraint";
import type { LookAtControl, LookAtSubjectKind } from "./LookAtControl";

export interface LookAtMappedSubject {
  kind: LookAtSubjectKind;
  id: string;
  name: string;
  rotation: RigVector3Tuple;
  solveInput: LookAtConstraintInput;
}

export type LookAtMappingResult =
  | { ok: true; mapping: LookAtMappedSubject; error: null }
  | { ok: false; mapping: null; error: string };

export function mapProjectLookAtControl(
  project: MineMotionProject,
  control: LookAtControl
): LookAtMappingResult {
  const target = resolveLookAtTarget(project, control);
  if (!target.ok || !target.position) return failure(target.error);
  if (control.subject.kind === "head") {
    const character = project.scene.characters.find(
      (entry) => entry.id === control.subject.id
    );
    if (!character) {
      return failure("LOOK_AT_SUBJECT_MISSING: The head character does not exist.");
    }
    const head = mapCharacterHead(character, target.position);
    if (!head.ok || !head.source || !head.target || !head.rotation) {
      return failure(head.error);
    }
    return success(control, character.name, head.source, head.target, head.rotation, "XYZ");
  }

  const lookup = findObject(project, control.subject.id);
  if (!lookup ||
    (control.subject.kind === "camera" && lookup.entity.type !== "camera") ||
    (control.subject.kind === "object" && lookup.entity.type !== "obj")) {
    return failure("LOOK_AT_SUBJECT_MISSING: The camera or object subject does not exist.");
  }
  if (!isValidSubjectEntity(lookup.entity)) {
    return failure("LOOK_AT_SUBJECT_INVALID: The subject transform must be finite.");
  }
  return success(
    control,
    lookup.entity.name,
    [...lookup.entity.transform.position],
    target.position,
    [...lookup.entity.transform.rotation],
    control.subject.kind === "camera" ? "YXZ" : "XYZ"
  );
}

export function resolveLookAtSubject(
  project: MineMotionProject,
  objectId: string | null
): { kind: LookAtSubjectKind; id: string } | null {
  if (!objectId) return null;
  const separator = "::bone::";
  if (objectId.includes(separator)) {
    const [characterId, boneId] = objectId.split(separator);
    return boneId === "head" &&
      project.scene.characters.some((entry) => entry.id === characterId)
      ? { kind: "head", id: characterId }
      : null;
  }
  const lookup = findObject(project, objectId);
  if (!lookup) return null;
  if (lookup.entity.type === "character") return { kind: "head", id: objectId };
  if (lookup.entity.type === "camera") return { kind: "camera", id: objectId };
  if (lookup.entity.type === "obj") return { kind: "object", id: objectId };
  return null;
}

export function listLookAtTargets(
  project: MineMotionProject,
  subjectId: string
): Array<{ id: string; name: string; type: SceneEntity["type"] }> {
  return [
    ...project.scene.characters,
    ...project.scene.cameras,
    ...project.scene.importedObjects,
    ...project.scene.lights
  ].filter((entity) => entity.id !== subjectId)
    .map((entity) => ({ id: entity.id, name: entity.name, type: entity.type }));
}

function success(
  control: LookAtControl,
  name: string,
  sourcePosition: RigVector3Tuple,
  targetPosition: RigVector3Tuple,
  currentRotation: RigVector3Tuple,
  eulerOrder: LookAtEulerOrder
): LookAtMappingResult {
  const maximum = control.maxAngle;
  return {
    ok: true,
    mapping: {
      kind: control.subject.kind,
      id: control.subject.id,
      name,
      rotation: currentRotation,
      solveInput: {
        sourcePosition,
        targetPosition,
        currentRotation,
        eulerOrder,
        minRotation: maximum.map((component) => -component) as RigVector3Tuple,
        maxRotation: [...maximum],
        influence: control.influence
      }
    },
    error: null
  };
}

function resolveLookAtTarget(
  project: MineMotionProject,
  control: LookAtControl
): { ok: boolean; position: RigVector3Tuple | null; error: string } {
  if (control.targetId === null) {
    return isFiniteRigVector(control.targetPosition)
      ? { ok: true, position: [...control.targetPosition], error: "" }
      : { ok: false, position: null, error: "LOOK_AT_TARGET_INVALID: The custom target is invalid." };
  }
  if (control.targetId === control.subject.id) {
    return {
      ok: false,
      position: null,
      error: "LOOK_AT_TARGET_SELF: A subject cannot target itself."
    };
  }
  const lookup = findObject(project, control.targetId);
  if (!lookup || !isValidSubjectEntity(lookup.entity)) {
    return {
      ok: false,
      position: null,
      error: "LOOK_AT_TARGET_MISSING: The selected target object does not exist."
    };
  }
  if (lookup.entity.type === "character") {
    const position = getCharacterHeadWorldPosition(lookup.entity as CharacterEntity);
    return position
      ? { ok: true, position, error: "" }
      : {
          ok: false,
          position: null,
          error: "LOOK_AT_TARGET_INVALID: The target character hierarchy is invalid."
        };
  }
  return {
    ok: true,
    position: [...lookup.entity.transform.position],
    error: ""
  };
}

function mapCharacterHead(
  character: CharacterEntity,
  targetWorldPosition: RigVector3Tuple
): {
  ok: boolean;
  source: RigVector3Tuple | null;
  target: RigVector3Tuple | null;
  rotation: RigVector3Tuple | null;
  error: string;
} {
  const hierarchy = resolveHeadHierarchy(character);
  if (!hierarchy || !isValidRigTransform(character.transform)) {
    return {
      ok: false,
      source: null,
      target: null,
      rotation: null,
      error: "LOOK_AT_HEAD_HIERARCHY_INVALID: Head must have a valid root/body parent chain."
    };
  }
  const { root, body, head, rootRotation, bodyRotation, headRotation } = hierarchy;
  const characterTarget = inverseTransformRigPoint(targetWorldPosition, character.transform);
  const rootTarget = rotateRigVector(
    subtractRigVectors(characterTarget, root.offset),
    inverseRigQuaternion(quaternionFromRigEulerDegrees(rootRotation))
  );
  const bodyTarget = rotateRigVector(
    subtractRigVectors(rootTarget, body.offset),
    inverseRigQuaternion(quaternionFromRigEulerDegrees(bodyRotation))
  );
  return {
    ok: isFiniteRigVector(bodyTarget),
    source: [...head.offset],
    target: bodyTarget,
    rotation: headRotation,
    error: "LOOK_AT_HEAD_SPACE_INVALID: Target conversion produced an invalid head-parent point."
  };
}

function getCharacterHeadWorldPosition(
  character: CharacterEntity
): RigVector3Tuple | null {
  const hierarchy = resolveHeadHierarchy(character);
  if (!hierarchy || !isValidRigTransform(character.transform)) return null;
  const { root, body, head, rootRotation, bodyRotation } = hierarchy;
  const bodyPoint = addRigVectors(
    body.offset,
    rotateRigVector(head.offset, quaternionFromRigEulerDegrees(bodyRotation))
  );
  const rootPoint = addRigVectors(
    root.offset,
    rotateRigVector(bodyPoint, quaternionFromRigEulerDegrees(rootRotation))
  );
  return transformRigPoint(rootPoint, character.transform);
}

function resolveHeadHierarchy(character: CharacterEntity) {
  const definition = getRigDefinition(character.rigPreset);
  const head = definition.bones.find((bone) => bone.id === "head");
  const body = head?.parentId
    ? definition.bones.find((bone) => bone.id === head.parentId)
    : null;
  const root = body?.parentId
    ? definition.bones.find((bone) => bone.id === body.parentId)
    : null;
  if (!head || !body || !root || root.parentId !== null) return null;
  return {
    head,
    body,
    root,
    headRotation: rotationOrZero(character.boneRotations[head.id]),
    bodyRotation: rotationOrZero(character.boneRotations[body.id]),
    rootRotation: rotationOrZero(character.boneRotations[root.id])
  };
}

function rotationOrZero(value: unknown): RigVector3Tuple {
  return isFiniteRigVector(value) ? [...value] : [0, 0, 0];
}

function isValidSubjectEntity(entity: SceneEntity): boolean {
  return isFiniteRigVector(entity.transform.position) &&
    isFiniteRigVector(entity.transform.rotation);
}

function failure(error: string): LookAtMappingResult {
  return { ok: false, mapping: null, error };
}
