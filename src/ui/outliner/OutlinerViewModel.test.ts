import { describe, expect, it } from "vitest";
import { createDefaultProject, createObjEntity } from "../../project/ProjectStore";
import { collectOutlinerWarnings, matchesOutlinerQuery } from "./OutlinerViewModel";

describe("outliner view model", () => {
  it("searches names and metadata without case sensitivity", () => {
    expect(matchesOutlinerQuery("Hero Camera", "camera", "HERO")).toBe(true);
    expect(matchesOutlinerQuery("Hero Camera", "camera", "light")).toBe(false);
  });

  it("reports placeholder rigs, missing assets, and active-camera drift", () => {
    const project = createDefaultProject();
    project.scene.characters[0].rigPreset = "generic_blocky";
    project.scene.importedObjects.push(createObjEntity("missing-asset", "Missing"));
    project.scene.cameras[0].active = false;
    expect(collectOutlinerWarnings(project).map((warning) => warning.code)).toEqual([
      "placeholder-rig",
      "missing-obj-asset",
      "inactive-camera-state"
    ]);
  });
});
