import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import { validateProductionExport } from "./ExportValidation";

describe("production export validation", () => {
  it("returns a complete validation checklist and estimates", () => {
    const project = createInitialProject();
    const result = validateProductionExport(project.exportSettings, project);

    expect(result.valid).toBe(true);
    expect(result.checklist).toMatchObject({
      activeCamera: true,
      frameRange: true,
      outputFormat: true,
      missingAssets: true
    });
    expect(result.estimates?.frameCount).toBe(301);
    expect(result.estimates?.durationSeconds).toBeCloseTo(301 / 24);
    expect(result.estimates?.estimatedSizeBytes).toBeGreaterThan(0);
  });

  it("reports missing camera, invalid range and unavailable native output", () => {
    const project = createInitialProject();
    const result = validateProductionExport(
      {
        ...project.exportSettings,
        cameraId: "missing-camera",
        startFrame: 10,
        endFrame: 2,
        format: "mp4_h264"
      },
      project
    );

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/camera/i);
    expect(result.errors.join(" ")).toMatch(/start frame/i);
    expect(result.errors.join(" ")).toMatch(/FFmpeg/i);
  });
});
