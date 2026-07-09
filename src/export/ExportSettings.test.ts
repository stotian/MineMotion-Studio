import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import {
  validateExportSettings,
  withExportSettingsDefaults
} from "./ExportSettings";

describe("export settings", () => {
  it("normalizes unsafe values and output names", () => {
    const settings = withExportSettingsDefaults({
      startFrame: -5,
      endFrame: 4.8,
      fps: 0,
      width: -1,
      height: 0,
      outputName: " My Render! "
    });

    expect(settings.startFrame).toBe(0);
    expect(settings.endFrame).toBe(5);
    expect(settings.fps).toBe(1);
    expect(settings.width).toBe(1);
    expect(settings.height).toBe(1);
    expect(settings.outputName).toBe("my-render");
  });

  it("rejects unsupported MP4 exports", () => {
    const project = createInitialProject();
    const validation = validateExportSettings(
      {
        ...project.exportSettings,
        format: "mp4_video"
      },
      project
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toMatch(/MP4/i);
  });
});
