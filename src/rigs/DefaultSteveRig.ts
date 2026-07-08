import * as THREE from "three";
import type { CharacterEntity, Vector3Tuple } from "../project/ProjectFile";
import { createSolidMaterial } from "../renderer/MinecraftMaterialSystem";
import { DEFAULT_STEVE_BONES, type RigBone } from "./Bone";

const MATERIALS = {
  head: createSolidMaterial("#d9a066"),
  hair: createSolidMaterial("#4b2e1f"),
  body: createSolidMaterial("#2e77c5"),
  sleeve: createSolidMaterial("#2a6fb9"),
  arm: createSolidMaterial("#d9a066"),
  leg: createSolidMaterial("#3552a3"),
  shoe: createSolidMaterial("#31343a")
};

export function createDefaultSteveRig(character: CharacterEntity): THREE.Group {
  const root = new THREE.Group();
  root.name = character.name;

  const boneObjects = new Map<string, THREE.Group>();

  for (const bone of DEFAULT_STEVE_BONES) {
    const boneObject = createBoneObject(bone, character);
    boneObjects.set(bone.id, boneObject);

    if (!bone.parentId) {
      root.add(boneObject);
    } else {
      boneObjects.get(bone.parentId)?.add(boneObject);
    }
  }

  return root;
}

function createBoneObject(
  bone: RigBone,
  character: CharacterEntity
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.name = bone.label;
  pivot.position.set(bone.offset[0], bone.offset[1], bone.offset[2]);
  applyEuler(pivot.rotation, character.boneRotations[bone.id] || [0, 0, 0]);

  if (bone.id === "root") {
    return pivot;
  }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(bone.size[0], bone.size[1], bone.size[2]),
    materialForBone(bone.id)
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(bone.pivot[0], bone.pivot[1], bone.pivot[2]);
  pivot.add(mesh);

  if (bone.id === "head") {
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(bone.size[0] + 0.04, 0.12, bone.size[2] + 0.04),
      MATERIALS.hair
    );
    hair.position.set(0, 0.08, 0);
    mesh.add(hair);
  }

  return pivot;
}

function materialForBone(boneId: string): THREE.Material {
  if (boneId === "body") return MATERIALS.body;
  if (boneId === "head") return MATERIALS.head;
  if (boneId.includes("Arm")) return MATERIALS.arm;
  if (boneId.includes("Leg")) return MATERIALS.leg;
  return MATERIALS.sleeve;
}

function applyEuler(target: THREE.Euler, rotation: Vector3Tuple): void {
  target.set(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2])
  );
}

