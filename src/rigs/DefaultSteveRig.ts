import * as THREE from "three";
import type { CharacterEntity, Vector3Tuple } from "../project/ProjectFile";
import { createSolidMaterial } from "../renderer/MinecraftMaterialSystem";
import type { RigBone } from "./Bone";
import { getRigDefinition } from "./MinecraftRigPresets";
import { makeBoneObjectId } from "./RigSelection";
import { applySkinUvToBoxGeometry } from "./MinecraftSkinMapper";
import { markSharedThreeResource } from "../renderer/ThreeResourceDisposal";
import {
  resolveExpressionOverlay,
  type ExpressionOverlayTone
} from "./expressions/ExpressionOverlay";

const MATERIALS = {
  head: createSolidMaterial("#d9a066"),
  hair: createSolidMaterial("#4b2e1f"),
  body: createSolidMaterial("#2e77c5"),
  cape: createSolidMaterial("#6b1f2b"),
  arm: createSolidMaterial("#d9a066"),
  leg: createSolidMaterial("#3552a3"),
  sword: createSolidMaterial("#c7d0dc"),
  item: createSolidMaterial("#74b36a")
};
const EXPRESSION_MATERIALS: Record<ExpressionOverlayTone, THREE.Material> = {
  dark: createSolidMaterial("#201613"),
  light: createSolidMaterial("#f4f1e8"),
  mouth: createSolidMaterial("#6f2525")
};
for (const material of Object.values(MATERIALS)) {
  markSharedThreeResource(material);
}
for (const material of Object.values(EXPRESSION_MATERIALS)) {
  markSharedThreeResource(material);
}

export class SteveRigTextureCache {
  private readonly textures = new Map<string, THREE.Texture>();

  get(dataUrl: string): THREE.Texture {
    const cached = this.textures.get(dataUrl);
    if (cached) return cached;
    const texture = new THREE.TextureLoader().load(dataUrl);
    markSharedThreeResource(texture);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    this.textures.set(dataUrl, texture);
    return texture;
  }

  prune(activeDataUrls: readonly string[]): number {
    const active = new Set(activeDataUrls);
    let disposed = 0;
    for (const [dataUrl, texture] of this.textures) {
      if (active.has(dataUrl)) continue;
      texture.dispose();
      this.textures.delete(dataUrl);
      disposed += 1;
    }
    return disposed;
  }

  clear(): number {
    return this.prune([]);
  }
}

const defaultTextureCache = new SteveRigTextureCache();

export function pruneSteveRigTextureCache(
  activeDataUrls: readonly string[]
): number {
  return defaultTextureCache.prune(activeDataUrls);
}

export function clearSteveRigTextureCache(): number {
  return defaultTextureCache.clear();
}

export type ObjAttachmentResolver = (
  assetId: string
) => THREE.Object3D | null;

export function createDefaultSteveRig(
  character: CharacterEntity,
  resolveObjAttachment?: ObjAttachmentResolver,
  textureCache: SteveRigTextureCache = defaultTextureCache
): THREE.Group {
  const definition = getRigDefinition(character.rigPreset);
  const root = new THREE.Group();
  root.name = character.name;

  const boneObjects = new Map<string, THREE.Group>();

  for (const bone of definition.bones) {
    const boneObject = createBoneObject(bone, character, textureCache, character.customGeometry?.hideDefaultGeometry === true);
    boneObjects.set(bone.id, boneObject);

    if (!bone.parentId) {
      root.add(boneObject);
    } else {
      boneObjects.get(bone.parentId)?.add(boneObject);
    }
  }

  for (const attachment of character.attachments ?? []) {
    if (!attachment.visible) continue;
    const point = definition.attachmentPoints.find((candidate) => candidate.id === attachment.pointId);
    if (!point) continue;
    const parent = boneObjects.get(point.boneId);
    if (!parent) continue;
    const object = createAttachmentObject(
      attachment.kind,
      attachment.assetId,
      resolveObjAttachment
    );
    object.name = attachment.name;
    object.position.set(point.offset[0], point.offset[1], point.offset[2]);
    applyEuler(object.rotation, point.rotation);
    parent.add(object);
  }

  for (const cube of character.customGeometry?.cubes ?? []) {
    if (!cube.visible) continue;
    const parent = boneObjects.get(cube.boneId);
    if (!parent) continue;
    const geometry = new THREE.BoxGeometry(cube.size[0], cube.size[1], cube.size[2]);
    const mesh = new THREE.Mesh(geometry, createSolidMaterial(cube.color));
    mesh.name = cube.name;
    mesh.position.set(cube.position[0], cube.position[1], cube.position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    markBoneSelectable(mesh, character.id, cube.boneId);
    parent.add(mesh);
  }

  return root;
}

function createBoneObject(
  bone: RigBone,
  character: CharacterEntity,
  textureCache: SteveRigTextureCache,
  hideDefaultGeometry: boolean
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.name = bone.label;
  pivot.position.set(bone.offset[0], bone.offset[1], bone.offset[2]);
  applyEuler(pivot.rotation, character.boneRotations[bone.id] || [0, 0, 0]);
  markBoneSelectable(pivot, character.id, bone.id);

  if (bone.id === "root" || hideDefaultGeometry) {
    return pivot;
  }

  const geometry = new THREE.BoxGeometry(bone.size[0], bone.size[1], bone.size[2]);
  const skinPart = bone.skinPart === "cape" ? undefined : bone.skinPart;
  if (skinPart && character.skin?.metadata.valid) {
    applySkinUvToBoxGeometry(
      geometry,
      skinPart,
      character.skin.metadata.modelType,
      character.skin.metadata.legacy,
      bone.skinSegment
    );
  }

  const mesh = new THREE.Mesh(
    geometry,
    materialForBone(bone, character, textureCache)
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(bone.pivot[0], bone.pivot[1], bone.pivot[2]);
  markBoneSelectable(mesh, character.id, bone.id);
  pivot.add(mesh);

  if (bone.id === "head") {
    const expression = createExpressionOverlayObject(character);
    if (expression) mesh.add(expression);
  }

  if (bone.id === "head" && !character.skin?.metadata.valid) {
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(bone.size[0] + 0.04, 0.12, bone.size[2] + 0.04),
      MATERIALS.hair
    );
    hair.position.set(0, 0.08, 0);
    mesh.add(hair);
  }

  return pivot;
}

function createExpressionOverlayObject(
  character: CharacterEntity
): THREE.Group | null {
  const descriptors = resolveExpressionOverlay(character.expression);
  if (descriptors.length === 0) return null;
  const group = new THREE.Group();
  group.name = "Expression Overlay";
  group.userData.expressionOverlay = true;
  for (const descriptor of descriptors) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        descriptor.size[0],
        descriptor.size[1],
        0.014
      ),
      EXPRESSION_MATERIALS[descriptor.tone]
    );
    mesh.name = `Expression ${descriptor.id}`;
    mesh.position.set(
      descriptor.position[0],
      descriptor.position[1],
      0.407
    );
    mesh.rotation.z = THREE.MathUtils.degToRad(
      descriptor.rotationDegrees
    );
    mesh.renderOrder = 2;
    mesh.userData.expressionOverlay = true;
    mesh.raycast = () => {};
    group.add(mesh);
  }
  return group;
}

function materialForBone(
  bone: RigBone,
  character: CharacterEntity,
  textureCache: SteveRigTextureCache
): THREE.Material {
  if (character.skin?.metadata.valid && bone.skinPart && bone.skinPart !== "cape") {
    return new THREE.MeshStandardMaterial({
      map: textureCache.get(character.skin.dataUrl),
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.78,
      metalness: 0
    });
  }
  if (character.modelType === "mob") {
    const color = mobColor(character.rigPreset, bone.id);
    return createSolidMaterial(color);
  }
  if (bone.id === "body") return MATERIALS.body;
  if (bone.id === "head") return MATERIALS.head;
  if (bone.id === "cape") return MATERIALS.cape;
  if (bone.id.toLowerCase().includes("arm")) return MATERIALS.arm;
  if (bone.id.toLowerCase().includes("leg")) return MATERIALS.leg;
  return MATERIALS.body;
}

function mobColor(rigPreset: string, boneId: string): string {
  if (rigPreset === "zombie") return boneId === "head" || boneId.toLowerCase().includes("arm") ? "#5f8f55" : boneId.toLowerCase().includes("leg") ? "#36598a" : "#4c6e9d";
  if (rigPreset === "skeleton") return "#d7d3c7";
  if (rigPreset === "creeper") return boneId === "head" ? "#58b84d" : "#4aa842";
  if (rigPreset === "enderman") return boneId === "head" ? "#241b2c" : "#18131e";
  if (rigPreset === "villager") return boneId === "body" ? "#77523a" : "#b58b67";
  if (rigPreset === "pig") return "#eaa0a8";
  if (rigPreset === "cow") return boneId === "head" ? "#6d4933" : "#74513b";
  if (rigPreset === "wolf") return boneId === "head" ? "#b8b8b1" : "#a5a59f";
  if (rigPreset === "spider") return boneId === "head" ? "#3c3034" : "#2a2428";
  return "#7d8a91";
}

function createAttachmentObject(
  kind: string,
  assetId: string | undefined,
  resolveObjAttachment: ObjAttachmentResolver | undefined
): THREE.Object3D {
  if (kind === "obj" && assetId && resolveObjAttachment) {
    const resolved = resolveObjAttachment(assetId);
    if (resolved) return resolved;
  }
  if (kind === "placeholder_sword") {
    const group = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.65, 0.07), MATERIALS.sword);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), MATERIALS.item);
    blade.position.y = -0.36;
    grip.position.y = -0.02;
    group.rotation.z = THREE.MathUtils.degToRad(18);
    group.add(blade, grip);
    return group;
  }
  return new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), MATERIALS.item);
}

function applyEuler(target: THREE.Euler, rotation: Vector3Tuple): void {
  target.set(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2])
  );
}

function markBoneSelectable(object: THREE.Object3D, characterId: string, boneId: string): void {
  object.userData.objectId = makeBoneObjectId(characterId, boneId);
  object.userData.objectType = "rigBone";
  object.userData.characterId = characterId;
  object.userData.boneId = boneId;
}
