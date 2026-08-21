import type {
  AnimatableProperty,
  MineMotionProject,
  TransformData
} from "../project/ProjectFile";
import { sampleVectorTrack } from "./Interpolation";

/**
 * Clone only the scene collections, sharing the rest of the project (world,
 * effects, audio, assets…) by reference. Enough for per-frame samplers that
 * replace scene entities immutably, and far cheaper than a deep clone.
 */
export function shallowCloneProjectScene(project: MineMotionProject): MineMotionProject {
  return {
    ...project,
    scene: {
      ...project.scene,
      characters: [...project.scene.characters],
      cameras: [...project.scene.cameras],
      importedObjects: [...project.scene.importedObjects],
      lights: [...project.scene.lights]
    }
  };
}

type SceneCollection = "characters" | "cameras" | "importedObjects" | "lights";
const SCENE_COLLECTIONS: readonly SceneCollection[] = [
  "characters",
  "cameras",
  "importedObjects",
  "lights"
];

export class Animator {
  static sampleProject(
    project: MineMotionProject,
    frame: number
  ): MineMotionProject {
    if (project.animation.tracks.length === 0) {
      return project;
    }

    // Only scene entities are animated, so clone the scene collections and share
    // the rest of the project by reference instead of deep-cloning every frame.
    // applyTrackValue writes only into these fresh arrays and replaces entities
    // immutably, so the input project is never mutated.
    let nextProject: MineMotionProject = shallowCloneProjectScene(project);

    // Resolve every entity's location once, so applying a track is O(1) instead
    // of scanning all four collections per track per frame.
    const locations = Animator.buildEntityLocations(nextProject);
    for (const track of project.animation.tracks) {
      const value = sampleVectorTrack(track.keyframes, frame);
      if (!value) {
        continue;
      }
      Animator.applyTrackValue(nextProject, locations, track.targetId, track.property, value);
    }

    return nextProject;
  }

  private static buildEntityLocations(
    project: MineMotionProject
  ): Map<string, { collection: SceneCollection; index: number }> {
    const locations = new Map<string, { collection: SceneCollection; index: number }>();
    for (const collection of SCENE_COLLECTIONS) {
      const list = project.scene[collection];
      for (let index = 0; index < list.length; index += 1) {
        // First matching collection wins, matching the previous scan order.
        if (!locations.has(list[index].id)) {
          locations.set(list[index].id, { collection, index });
        }
      }
    }
    return locations;
  }

  private static applyTrackValue(
    project: MineMotionProject,
    locations: Map<string, { collection: SceneCollection; index: number }>,
    targetId: string,
    property: AnimatableProperty,
    value: [number, number, number]
  ): void {
    const location = locations.get(targetId);
    if (!location) {
      return;
    }
    const { collection, index } = location;
    const entity = project.scene[collection][index];

    if (collection === "characters" && property.startsWith("bone.rotation.")) {
      const boneId = property.replace("bone.rotation.", "");
      project.scene.characters[index] = {
        ...project.scene.characters[index],
        boneRotations: {
          ...project.scene.characters[index].boneRotations,
          [boneId]: [...value]
        }
      };
      return;
    }

    if (property.startsWith("bone.rotation.")) {
      return;
    }

    const transform: TransformData = {
      position: [...entity.transform.position],
      rotation: [...entity.transform.rotation],
      scale: [...entity.transform.scale]
    };

    if (property === "transform.position") {
      transform.position = [...value];
    } else if (property === "transform.rotation") {
      transform.rotation = [...value];
    } else {
      transform.scale = [...value];
    }

    project.scene[collection][index] = {
      ...entity,
      transform
    } as never;
  }
}
