export type WorkerWorkloadId =
  | "mca-header"
  | "chunk-decompress-nbt"
  | "visible-block-mesh-data"
  | "texture-atlas"
  | "package-archive"
  | "vfx-thumbnail";

export type WorkerDecision =
  | "worker"
  | "main-thread-bounded"
  | "idle-bounded"
  | "deferred";

export interface WorkerWorkloadDecision {
  id: WorkerWorkloadId;
  decision: WorkerDecision;
  cloneSafe: boolean;
  reason: string;
  fallback: string;
}

export const WORKER_WORKLOAD_AUDIT: readonly WorkerWorkloadDecision[] =
  Object.freeze([
    {
      id: "mca-header",
      decision: "main-thread-bounded",
      cloneSafe: true,
      reason:
        "The location/timestamp table is fixed at 8 KiB and selects payloads before transfer.",
      fallback: "Existing synchronous McaFileReader."
    },
    {
      id: "chunk-decompress-nbt",
      decision: "worker",
      cloneSafe: true,
      reason:
        "Compressed bytes and ImportedChunkData are transferable/structured-clone data while decompression, NBT, palette, and section decoding are CPU-heavy.",
      fallback: "The exact shared decodeWorldChunk function runs on the main thread."
    },
    {
      id: "visible-block-mesh-data",
      decision: "deferred",
      cloneSafe: true,
      reason:
        "Face samples are clone-safe, but the current SceneRenderer rebuild contract is synchronous and Three.js allocation must remain on the renderer thread.",
      fallback: "Bounded BlockFaceCuller and chunk-local instancing."
    },
    {
      id: "texture-atlas",
      decision: "deferred",
      cloneSafe: false,
      reason:
        "The current optional builder depends on DOM Image and canvas; OffscreenCanvas/ImageBitmap support needs an explicit compatibility gate.",
      fallback: "Operation-local browser canvas builder."
    },
    {
      id: "package-archive",
      decision: "main-thread-bounded",
      cloneSafe: true,
      reason:
        "Archive operations are explicit, byte/count bounded, asynchronous around compression, and not yet measured above a worker threshold.",
      fallback: "Existing bounded package readers and writers."
    },
    {
      id: "vfx-thumbnail",
      decision: "idle-bounded",
      cloneSafe: true,
      reason:
        "Generated SVG previews are capped, cached, and already scheduled one at a time during idle work.",
      fallback: "Existing cancellable idle scheduler."
    }
  ] satisfies WorkerWorkloadDecision[]);

export function getWorkerWorkloadDecision(
  id: WorkerWorkloadId
): WorkerWorkloadDecision {
  const decision = WORKER_WORKLOAD_AUDIT.find((item) => item.id === id);
  if (!decision) throw new Error(`Unknown worker workload: ${id}.`);
  return decision;
}
