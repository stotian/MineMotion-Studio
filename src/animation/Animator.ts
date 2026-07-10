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

    let nextProject: MineMotionProject = structuredClone(project);

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
