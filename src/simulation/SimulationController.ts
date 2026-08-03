import type { SimulationBake, SimulationDefinition, SimulationProjectData } from "./SimulationTypes";
import { createSimulationFingerprint } from "./SimulationBake";

export function upsertSimulation(data: SimulationProjectData, definition: SimulationDefinition): SimulationProjectData {
  const exists = data.definitions.some((entry) => entry.id === definition.id);
  return {
    ...data,
    definitions: exists ? data.definitions.map((entry) => entry.id === definition.id ? { ...definition, status: "dirty" } : entry) : [...data.definitions, definition],
    bakes: data.bakes.filter((bake) => bake.simulationId !== definition.id)
  };
}

export function storeSimulationBake(data: SimulationProjectData, bake: SimulationBake): SimulationProjectData {
  const definition = data.definitions.find((entry) => entry.id === bake.simulationId);
  if (!definition) return data;
  const next = {
    ...data,
    definitions: data.definitions.map((entry) => entry.id === bake.simulationId ? { ...entry, status: "baked" as const } : entry),
    bakes: [...data.bakes.filter((entry) => entry.simulationId !== bake.simulationId), bake]
  };
  return enforceSimulationCacheLimit(next);
}

export function resetSimulation(data: SimulationProjectData, simulationId: string): SimulationProjectData {
  return { ...data, definitions: data.definitions.map((entry) => entry.id === simulationId ? { ...entry, status: "dirty" as const } : entry), bakes: data.bakes.filter((bake) => bake.simulationId !== simulationId) };
}

export function invalidateStaleSimulationBakes(data: SimulationProjectData, fps: number): SimulationProjectData {
  const definitions = new Map(data.definitions.map((definition) => [definition.id, definition]));
  const bakes = data.bakes.filter((bake) => {
    const definition = definitions.get(bake.simulationId);
    return Boolean(definition && bake.fingerprint === createSimulationFingerprint(definition, fps));
  });
  const bakedIds = new Set(bakes.map((bake) => bake.simulationId));
  return { ...data, bakes, definitions: data.definitions.map((definition) => bakedIds.has(definition.id) ? definition : { ...definition, status: definition.status === "baked" ? "dirty" : definition.status }) };
}

function enforceSimulationCacheLimit(data: SimulationProjectData): SimulationProjectData {
  const newestFirst = [...data.bakes].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const retained: SimulationBake[] = []; let bytes = 0;
  for (const bake of newestFirst) { const size = JSON.stringify(bake).length; if (retained.length > 0 && bytes + size > data.cacheLimitBytes) continue; retained.push(bake); bytes += size; }
  return { ...data, bakes: retained.reverse() };
}
