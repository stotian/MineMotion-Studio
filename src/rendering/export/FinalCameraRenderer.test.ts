import { describe, expect, it } from "vitest";
import { createInitialProject, createSceneCamera } from "../../project/ProjectStore";
import { createFinalCameraFrame } from "./FinalCameraRenderer";

describe("final camera renderer", () => {
  it("selects the requested camera and holds frames beyond project duration", () => {
    const project = createInitialProject();
    const secondCamera = createSceneCamera("Second Camera");
    project.scene.cameras.push(secondCamera);
    const frame = createFinalCameraFrame(
      project,
      { ...project.exportSettings, cameraId: secondCamera.id },
      project.animation.durationFrames + 20
    );

    expect(frame.activeCameraId).toBe(secondCamera.id);
    expect(frame.scene.cameras.find((camera) => camera.id === secondCamera.id)?.active).toBe(true);
    expect(frame.animation.currentFrame).toBe(project.animation.durationFrames);
    expect(frame.animation.isPlaying).toBe(false);
  });
});
