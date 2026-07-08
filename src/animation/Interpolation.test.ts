import { describe, expect, it } from "vitest";
import { Animator } from "./Animator";
import { sampleVectorTrack } from "./Interpolation";
import { addTransformKeyframes } from "./Timeline";
import { createInitialProject } from "../project/ProjectStore";

describe("Interpolation", () => {
  it("samples linearly between two vector keyframes", () => {
    const value = sampleVectorTrack(
      [
        { frame: 0, value: [0, 0, 0] },
        { frame: 10, value: [10, 5, -10] }
      ],
      5
    );

    expect(value).toEqual([5, 2.5, -5]);
  });

  it("applies transform animation tracks to a project clone", () => {
    let project = createInitialProject();
    const characterId = project.scene.characters[0].id;

    project = addTransformKeyframes(project, characterId, 0);
    project.scene.characters[0] = {
      ...project.scene.characters[0],
      transform: {
        ...project.scene.characters[0].transform,
        position: [10, 0, 0]
      }
    };
    project = addTransformKeyframes(project, characterId, 10);

    const sampled = Animator.sampleProject(project, 5);

    expect(sampled.scene.characters[0].transform.position).toEqual([5, 0.525, 0]);
    expect(project.scene.characters[0].transform.position).toEqual([10, 0, 0]);
  });
});
