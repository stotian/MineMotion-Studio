import { createSimpleHash } from "../assets/library/AssetHash";
import { createId } from "../core/ids/Id";
import { sampleSimulation } from "./SimulationSolvers";
import { SIMULATION_BUDGETS, type SimulationBake, type SimulationDefinition } from "./SimulationTypes";

export interface SimulationBakeOptions {
  fps: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export async function bakeSimulation(definition: SimulationDefinition, options: SimulationBakeOptions): Promise<SimulationBake> {
  const budget = SIMULATION_BUDGETS[definition.quality];
  const startFrame = Math.max(0, definition.startFrame);
  const endFrame = Math.min(definition.endFrame, startFrame + budget.maxFrames - 1);
  const samples = [] as SimulationBake["samples"];
  const totalFrames = Math.max(1, endFrame - startFrame + 1);
  for (let frame = startFrame; frame <= endFrame; frame += 1) {
    if (options.signal?.aborted) throw new DOMException("Simulation bake cancelled.", "AbortError");
    if ((frame - startFrame) % 16 === 0) await Promise.resolve();
    const frameSamples = sampleSimulation(definition, frame, options.fps);
    const remaining = budget.maxSamples - samples.length;
    if (remaining <= 0) break;
    samples.push(...frameSamples.slice(0, remaining));
    options.onProgress?.((frame - startFrame + 1) / totalFrames);
  }
  const fingerprint = createSimulationFingerprint(definition, options.fps);
  const estimatedBytes = JSON.stringify(samples).length;
  if (estimatedBytes > budget.maxBakeBytes) throw new Error(`Simulation bake exceeds the ${budget.maxBakeBytes}-byte safety budget.`);
  return { id: createId("simulation-bake"), simulationId: definition.id, version: 1, fingerprint, quality: definition.quality, startFrame, endFrame, samples, editable: true, createdAt: new Date().toISOString() };
}

export function createSimulationFingerprint(definition: SimulationDefinition, fps: number): string {
  return createSimpleHash(JSON.stringify({ version: 1, definition: { ...definition, status: undefined, updatedAt: undefined }, fps }));
}

export function isSimulationBakeCurrent(bake: SimulationBake, definition: SimulationDefinition, fps: number): boolean {
  return bake.simulationId === definition.id && bake.fingerprint === createSimulationFingerprint(definition, fps);
}

export function editSimulationBakeSample(bake: SimulationBake, sampleIndex: number, patch: Partial<SimulationBake["samples"][number]>): SimulationBake {
  if (!bake.editable || sampleIndex < 0 || sampleIndex >= bake.samples.length) return bake;
  return { ...bake, samples: bake.samples.map((sample, index) => index === sampleIndex ? { ...sample, ...patch, subjectId: sample.subjectId, frame: sample.frame } : sample) };
}
