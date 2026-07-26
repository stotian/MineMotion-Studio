import { describe, expect, it } from "vitest";
import {
  getWorkerWorkloadDecision,
  WORKER_WORKLOAD_AUDIT
} from "./WorkerWorkloadAudit";

describe("WORKER_WORKLOAD_AUDIT", () => {
  it("records one closed decision for every required Phase 20.9 workload", () => {
    expect(WORKER_WORKLOAD_AUDIT.map((item) => item.id)).toEqual([
      "mca-header",
      "chunk-decompress-nbt",
      "visible-block-mesh-data",
      "texture-atlas",
      "package-archive",
      "vfx-thumbnail"
    ]);
    expect(WORKER_WORKLOAD_AUDIT.filter(
      (item) => item.decision === "worker"
    )).toEqual([
      expect.objectContaining({
        id: "chunk-decompress-nbt",
        cloneSafe: true
      })
    ]);
  });

  it("keeps every non-worker path explicit and non-destructive", () => {
    for (const item of WORKER_WORKLOAD_AUDIT) {
      expect(item.reason.length).toBeGreaterThan(20);
      expect(item.fallback.length).toBeGreaterThan(10);
    }
    expect(getWorkerWorkloadDecision("texture-atlas")).toMatchObject({
      decision: "deferred",
      cloneSafe: false
    });
  });
});
