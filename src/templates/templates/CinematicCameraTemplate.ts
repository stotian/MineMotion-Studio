import type { ProjectTemplate } from "../TemplateTypes";
import { addTransformKeyframes } from "../../animation/Timeline";
import { createInitialProject, updateProjectSettings } from "../../project/ProjectStore";

export const CinematicCameraTemplate: ProjectTemplate = {
  id: "cinematic-camera-test",
  name: "Cinematic Camera Test",
  description: "Terrain and a keyframed camera push-in.",
  category: "cinematic",
  create(settings) {
    let project = updateProjectSettings(createInitialProject(settings), {
      projectName: "Cinematic Camera Test",
      durationFrames: 160,
      terrainPreset: "demo"
    });
    const cameraId = project.scene.cameras[0]?.id;
    if (!cameraId) return project;

    project.scene.cameras[0] = {
      ...project.scene.cameras[0],
      transform: {
        ...project.scene.cameras[0].transform,
        position: [12, 7, 12],
        rotation: [-32, 42, 0]
      },
      fov: 48
    };
    project = addTransformKeyframes(project, cameraId, 0);
    project.scene.cameras[0] = {
      ...project.scene.cameras[0],
      transform: {
        ...project.scene.cameras[0].transform,
        position: [5, 4, 5],
        rotation: [-24, 42, 0]
      },
      fov: 36
    };
    project = {
      ...project,
      animation: {
        ...project.animation,
        currentFrame: 120
      }
    };
    project = addTransformKeyframes(project, cameraId, 120);
    return {
      ...project,
      animation: {
        ...project.animation,
        currentFrame: 0
      }
    };
  }
};

