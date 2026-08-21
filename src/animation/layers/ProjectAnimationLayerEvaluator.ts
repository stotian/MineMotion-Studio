import { Animator, shallowCloneProjectScene } from "../Animator";
import type {
  CharacterEntity,
  MineMotionProject,
  SceneEntity,
  TransformData,
  Vector3Tuple
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import type { RigVector3Tuple } from "../../rigs/RigTypes";
import { evaluateAnimationLayers } from "./AnimationLayerEvaluator";
import { getTargetAnimationLayers } from "./AnimationLayerNlaAdapter";

export interface ProjectAnimationLayerEvaluation {
  project: MineMotionProject;
  activeLayerIds: readonly string[];
  vfxEffectIds: readonly string[];
  warnings: readonly string[];
}

export function sampleProjectWithAnimationLayers(
  project: MineMotionProject,
  frame: number
): ProjectAnimationLayerEvaluation {
  const baseProject = Animator.sampleProject(project, frame);
  if (project.animation.nlaTracks.length === 0) {
    return {
      project: baseProject,
      activeLayerIds: [],
      vfxEffectIds: [],
      warnings: []
    };
  }
  // applyEntityValues only replaces scene entities (immutably) in fresh arrays,
  // so a scene-only clone is enough and avoids a per-frame deep clone.
  let next = baseProject === project ? shallowCloneProjectScene(project) : baseProject;
  const activeLayerIds: string[] = [];
  const vfxEffectIds: string[] = [];
  const warnings: string[] = [];
  const targetIds = [...new Set(project.animation.nlaTracks.map((track) => track.targetId))];

  for (const targetId of targetIds) {
    const lookup = findObject(next, targetId);
    if (!lookup) {
      warnings.push(`ANIMATION_LAYER_TARGET_MISSING: ${targetId}`);
      continue;
    }
    const layers = getTargetAnimationLayers(project.animation.nlaTracks, targetId);
    const evaluation = evaluateAnimationLayers(
      layers,
      project.animation.clips,
      readEntityValues(lookup.entity),
      frame
    );
    applyEntityValues(next, targetId, evaluation.values);
    activeLayerIds.push(...evaluation.activeLayerIds);
    vfxEffectIds.push(...evaluation.vfxEffectIds);
    warnings.push(...evaluation.warnings);
  }

  const effectIds = new Set(project.effects.instances.map((effect) => effect.id));
  const validVfxIds = [...new Set(vfxEffectIds.filter((id) => {
    if (effectIds.has(id)) return true;
    warnings.push(`ANIMATION_LAYER_VFX_MISSING: ${id}`);
    return false;
  }))];
  return {
    project: next,
    activeLayerIds: [...new Set(activeLayerIds)],
    vfxEffectIds: validVfxIds,
    warnings: [...new Set(warnings)]
  };
}

function readEntityValues(
  entity: SceneEntity
): Record<string, RigVector3Tuple> {
  const values: Record<string, RigVector3Tuple> = {
    "transform.position": [...entity.transform.position],
    "transform.rotation": [...entity.transform.rotation],
    "transform.scale": [...entity.transform.scale]
  };
  if (entity.type === "character" && "boneRotations" in entity) {
    const character = entity as CharacterEntity;
    for (const [boneId, rotation] of Object.entries(character.boneRotations)) {
      values[`bone.rotation.${boneId}`] = [...rotation] as RigVector3Tuple;
    }
  }
  return values;
}

function applyEntityValues(
  project: MineMotionProject,
  targetId: string,
  values: Readonly<Record<string, RigVector3Tuple>>
): void {
  const collections = [
    "characters",
    "cameras",
    "importedObjects",
    "lights"
  ] as const;
  for (const collection of collections) {
    const index = project.scene[collection].findIndex((entry) => entry.id === targetId);
    if (index < 0) continue;
    const entity = project.scene[collection][index];
    const transform: TransformData = {
      position: valueOr(values["transform.position"], entity.transform.position),
      rotation: valueOr(values["transform.rotation"], entity.transform.rotation),
      scale: valueOr(values["transform.scale"], entity.transform.scale)
    };
    if (collection === "characters") {
      const character = project.scene.characters[index];
      const boneRotations = { ...character.boneRotations };
      for (const [property, value] of Object.entries(values)) {
        if (!property.startsWith("bone.rotation.")) continue;
        boneRotations[property.slice("bone.rotation.".length)] = [...value];
      }
      project.scene.characters[index] = {
        ...character,
        transform,
        boneRotations
      };
    } else {
      project.scene[collection][index] = { ...entity, transform } as never;
    }
    return;
  }
}

function valueOr(
  value: RigVector3Tuple | undefined,
  fallback: Vector3Tuple
): Vector3Tuple {
  return value ? [...value] : [...fallback];
}
