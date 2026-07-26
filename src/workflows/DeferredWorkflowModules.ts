export const DEFERRED_WORKFLOW_IDS = Object.freeze([
  "blockbench-import",
  "production-render",
  "png-sequence",
  "webm-recording",
  "wav-mixdown",
  "resource-pack-import"
] as const);

export async function loadBlockbenchImporter() {
  return await import("../rigs/blockbench/BlockbenchImporter");
}

export async function loadProductionRenderExecutor() {
  return await import("../export/renderQueue/ProductionRenderExecutor");
}

export async function loadSequenceExporter() {
  return await import("../export/SequenceExporter");
}

export async function loadWebMRecorder() {
  return await import("../export/video/WebMRecorder");
}

export async function loadAudioMixdown() {
  return await import("../audio/export/AudioMixdown");
}

export async function loadResourcePackImporter() {
  return await import("../minecraft/resources/ResourcePackImporter");
}
