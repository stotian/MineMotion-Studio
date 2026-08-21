import type {
  AnimatableProperty,
  MineMotionProject,
  TransformData
} from "../project/ProjectFile";
import { sampleVectorTrack } from "./Interpolation";

export class Animator {
  static sampleProject(
    project: MineMotionProject,
    frame: number
  ): MineMotionProject {
    if (project.animation.tracks.length === 0) {
      return project;
    }

    // Only scene entities are animated, so clone the scene collections and share
    // the rest of the project (world chunks, effects, audio, assets…) by
    // reference instead of deep-cloning the whole project every frame.
    // applyTrackValue writes only into these fresh arrays and replaces entities
    // immutably, so the input project is never mutated.
    let nextProject: MineMotionProject = {
      ...project,
      scene: {
        ...project.scene,
        characters: [...project.scene.characters],
        cameras: [...project.scene.cameras],
        importedObjects: [...project.scene.importedObjects],
        lights: [...project.scene.lights]
      }
    };

    for (const track of project.animation.tracks) {
      const value = sampleVectorTrack(track.keyframes, frame);
      if (!value) {
        continue;
      }
      nextProject = Animator.applyTrackValue(
        nextProject,
        track.targetId,
        track.property,
        value
      );
    }

    return nextProject;
  }

  private static applyTrackValue(
    project: MineMotionProject,
    targetId: string,
    property: AnimatableProperty,
    value: [number, number, number]
  ): MineMotionProject {
    const collections = [
      "characters",
      "cameras",
      "importedObjects",
      "lights"
    ] as const;

    for (const collection of collections) {
      const index = project.scene[collection].findIndex(
        (entity) => entity.id === targetId
      );
      if (index === -1) {
        continue;
      }

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
        return project;
      }

      if (property.startsWith("bone.rotation.")) {
        return project;
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
      };
      return project;
    }

    return project;
  }
}
