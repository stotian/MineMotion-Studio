import type { ProjectTemplate } from "../TemplateTypes";
import { addTransformKeyframes } from "../../animation/Timeline";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const CharacterAnimationTemplate: ProjectTemplate = {
  id: "character-animation-test",
  name: "Character Animation Test",
  description: "One character with starter movement keyframes over 120 frames.",
  category: "animation",
  create(settings) {
    let project = updateProjectSettings(createInitialProject(settings), {
      projectName: "Character Animation Test",
      durationFrames: 120,
      terrainPreset: "flat"
    });
    const characterId = project.scene.characters[0]?.id;
    if (!characterId) return project;

    project = addTransformKeyframes(project, characterId, 0);
    project.scene.characters[0] = {
      ...project.scene.characters[0],
      transform: {
        ...project.scene.characters[0].transform,
        position: [3, 1.05, 0],
        rotation: [0, 35, 0]
      },
      boneRotations: {
        ...project.scene.characters[0].boneRotations,
        leftArm: [22, 0, -8],
        rightArm: [-22, 0, 8],
        leftLeg: [-18, 0, 0],
        rightLeg: [18, 0, 0]
      }
    };
    project = {
      ...project,
      animation: {
        ...project.animation,
        currentFrame: 60
      }
    };
    project = addTransformKeyframes(project, characterId, 60);
    return {
      ...project,
      animation: {
        ...project.animation,
        currentFrame: 0
      }
    };
  }
};

