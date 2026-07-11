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

  it("rejects MP4 in browser mode and accepts detected native FFmpeg", () => {
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

    const nativeValidation = validateExportSettings(
      {
        ...project.exportSettings,
        format: "mp4_h264",
        includeAudio: false
      },
      project,
      {
        ffmpegAvailable: true,
        ffmpegOutputDirectory: "C:\\Renders"
      }
    );

    expect(nativeValidation.valid).toBe(true);
  });
});
