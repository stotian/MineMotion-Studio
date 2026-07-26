import { describe, expect, it } from "vitest";
import { createRenderJobProgress } from "./useExportWorkspaceController";

describe("export workspace controller", () => {
  it.each([
    ["running", 0.25, "rendering"],
    ["running", 0.85, "encoding"],
    ["complete", 1, "complete"],
    ["cancelled", 0.4, "cancelled"],
    ["error", 0.1, "error"]
  ] as const)(
    "maps %s progress %s to %s",
    (status, progress, expectedStatus) => {
      expect(
        createRenderJobProgress(
          {
            status,
            progress,
            message: "job",
            error: status === "error" ? "failed" : ""
          },
          20
        )
      ).toEqual({
        status: expectedStatus,
        currentFrame: Math.round(progress * 20),
        totalFrames: 20,
        message: "job",
        error: status === "error" ? "failed" : ""
      });
    }
  );
});
