import { isWebMExportSupported, mp4ExportStatus } from "../VideoExporter";
import type { VideoExportPlan } from "./VideoExportTypes";

export function getVideoExportPlans(): VideoExportPlan[] {
  return [
    {
      container: "webm",
      implemented: isWebMExportSupported(),
      notes: ["Uses browser MediaRecorder when supported."]
    },
    {
      container: "mp4",
      implemented: false,
      notes: [mp4ExportStatus()]
    }
  ];
}
