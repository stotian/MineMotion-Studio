import type {
  ArtisticLightRecord,
  CinematicMaterialProfile,
  ColorManagementProfile,
  CompositingGraphRecord,
  CompositingNode,
  MinecraftEffectPreset,
  SkyCloudProfile,
  UltraColor,
  UltraVector3,
  VfxGraphNode,
  VfxNodeGraphRecord,
  VolumetricProfile
} from "../UltraTypes";

export interface MaterialResponse {
  roughness: number;
  metallic: number;
  reliefStrength: number;
  emissionStrength: number;
  transmission: number;
  subsurface: number;
  pixelEdgeRetention: number;
  readable: boolean;
}

export function evaluateMaterialProfile(profile: CinematicMaterialProfile, incidentLight = 1): MaterialResponse {
  const light = clamp(incidentLight, 0, 16);
  const roughness = clamp(profile.roughness, 0.02, 1);
  const metallic = clamp(profile.metallic, 0, 1);
  const reliefStrength = clamp(profile.reliefStrength, 0, 0.65);
  const emissionStrength = clamp(profile.emissionStrength, 0, 16);
  const transmission = clamp(profile.transmission, 0, 1);
  const subsurface = clamp(profile.subsurface, 0, 0.5);
  const pixelEdgeRetention = profile.preservePixelEdges
    ? clamp(1 - reliefStrength * 0.45 - transmission * 0.2, 0.65, 1)
    : clamp(0.7 - reliefStrength * 0.45, 0.25, 0.9);
  const readable = pixelEdgeRetention >= 0.65 && (light > 0.015 || emissionStrength > 0.01);
  return { roughness, metallic, reliefStrength, emissionStrength, transmission, subsurface, pixelEdgeRetention, readable };
}

export interface LightContribution {
  lightId: string;
  objectId: string;
  intensity: number;
  color: UltraColor;
  blocked: boolean;
}

export function evaluateLightContribution(
  light: ArtisticLightRecord,
  objectId: string,
  activeBlockerIds: readonly string[] = []
): LightContribution {
  const linked = light.linkedObjectIds.length === 0 || light.linkedObjectIds.includes(objectId);
  const excluded = light.excludedObjectIds.includes(objectId);
  const blocked = light.blockerIds.some((id) => activeBlockerIds.includes(id));
  const intensity = linked && !excluded && !blocked
    ? clamp(light.intensityLumens, 0, 1_000_000) * Math.pow(2, clamp(light.exposureStops, -16, 16))
    : 0;
  return { lightId: light.id, objectId, intensity, color: normalizeColor(light.color), blocked };
}

export interface VolumetricSample {
  transmittance: number;
  scattering: number;
  steps: number;
}

export function sampleVolumetricProfile(
  profile: VolumetricProfile,
  distance: number,
  quality: "preview" | "final"
): VolumetricSample {
  const density = clamp(profile.density, 0, 4);
  const absorption = clamp(profile.absorption, 0, 4);
  const safeDistance = clamp(distance, 0, 100_000);
  const extinction = density + absorption;
  const transmittance = Math.exp(-extinction * safeDistance);
  const scattering = clamp((1 - transmittance) * density / Math.max(extinction, 1e-6), 0, 1);
  const steps = Math.round(clamp(quality === "preview" ? profile.previewSteps : profile.finalSteps, 1, 512));
  return { transmittance, scattering, steps };
}

export function compareVolumetricQualities(profile: VolumetricProfile, distance: number): number {
  const preview = sampleVolumetricProfile(profile, distance, "preview");
  const final = sampleVolumetricProfile(profile, distance, "final");
  const samplingPenalty = Math.abs(1 / preview.steps - 1 / final.steps) * (1 - final.transmittance);
  return clamp(samplingPenalty, 0, 1);
}

export interface SkySample {
  timeOfDay: number;
  cloudOffset: readonly [number, number];
  cloudCoverage: number;
  sunDirection: UltraVector3;
  moonDirection: UltraVector3;
  starIntensity: number;
}

export function sampleSkyProfile(profile: SkyCloudProfile, frame: number): SkySample {
  const start = Math.max(0, Math.round(profile.startFrame));
  const end = Math.max(start + 1, Math.round(profile.endFrame));
  const t = clamp((frame - start) / (end - start), 0, 1);
  const timeOfDay = wrap01(lerp(profile.startTimeOfDay, profile.endTimeOfDay, t));
  const angle = timeOfDay * Math.PI * 2;
  const sunDirection: UltraVector3 = canonicalVector([Math.cos(angle), Math.sin(angle), Math.sin(angle * 0.5) * 0.25]);
  const moonDirection: UltraVector3 = canonicalVector([-sunDirection[0], -sunDirection[1], -sunDirection[2]]);
  const elapsed = Math.max(0, frame - start);
  return {
    timeOfDay,
    cloudOffset: [canonical(profile.cloudSpeed[0] * elapsed), canonical(profile.cloudSpeed[1] * elapsed)],
    cloudCoverage: clamp(profile.cloudCoverage, 0, 1),
    sunDirection,
    moonDirection,
    starIntensity: clamp(profile.starIntensity * smoothNightFactor(timeOfDay), 0, 1)
  };
}

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  orderedNodeIds: string[];
  estimatedCost: number;
}

export function validateVfxGraph(graph: VfxNodeGraphRecord): GraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (graph.nodes.length === 0) errors.push("GRAPH_EMPTY");
  if (graph.nodes.length > 256) errors.push("GRAPH_NODE_LIMIT");
  if (graph.maximumParticles < 1 || graph.maximumParticles > 131_072) errors.push("PARTICLE_BUDGET_INVALID");
  if (graph.maximumEventsPerFrame < 1 || graph.maximumEventsPerFrame > 4096) errors.push("EVENT_BUDGET_INVALID");
  const topology = topologicalSort(graph.nodes);
  errors.push(...topology.errors);
  if (!graph.nodes.some((node) => node.kind === "output")) errors.push("OUTPUT_MISSING");
  if (!graph.nodes.some((node) => node.kind === "spawn")) warnings.push("SPAWN_MISSING");
  const exposed = new Set(graph.exposedParameters);
  if (exposed.size !== graph.exposedParameters.length) warnings.push("DUPLICATE_EXPOSED_PARAMETER");
  const estimatedCost = clamp(graph.maximumParticles, 0, 131_072) * Math.max(1, graph.nodes.length) + clamp(graph.maximumEventsPerFrame, 0, 4096) * 4;
  return { valid: errors.length === 0, errors, warnings, orderedNodeIds: topology.ordered, estimatedCost };
}

export interface VfxEvaluation {
  graphId: string;
  frame: number;
  liveParticles: number;
  emittedEvents: number;
  checksum: number;
}

export function evaluateVfxGraph(graph: VfxNodeGraphRecord, frame: number, parameters: Readonly<Record<string, number>> = {}): VfxEvaluation {
  const validation = validateVfxGraph(graph);
  if (!validation.valid) throw new Error(`Invalid VFX graph: ${validation.errors.join(",")}`);
  const rateNode = graph.nodes.find((node) => node.kind === "spawn");
  const parameterRate = finiteParameter(parameters.rate);
  const nodeRate = finiteParameter(rateNode?.parameters.rate);
  const rate = clamp(parameterRate ?? nodeRate ?? 1, 0, graph.maximumParticles);
  const safeFrame = Math.max(0, Math.round(frame));
  const liveParticles = Math.min(graph.maximumParticles, Math.floor(rate * (1 + (safeFrame % 60) / 60)));
  const eventNodes = graph.nodes.filter((node) => node.kind === "event").length;
  const emittedEvents = Math.min(graph.maximumEventsPerFrame, eventNodes * (safeFrame % 2));
  let checksum = mix32(Math.trunc(graph.seed), safeFrame);
  for (const nodeId of validation.orderedNodeIds) checksum = mix32(checksum, hashString(nodeId));
  checksum = mix32(checksum, liveParticles + emittedEvents);
  return { graphId: graph.id, frame: safeFrame, liveParticles, emittedEvents, checksum };
}

export interface MinecraftEffectEvaluation {
  presetId: string;
  eventName: string;
  active: boolean;
  particleBudget: number;
  graphId: string;
  fallbackPresetId: string | null;
}

export function evaluateMinecraftEffect(
  preset: MinecraftEffectPreset,
  eventName: string,
  availableGraphIds: ReadonlySet<string>
): MinecraftEffectEvaluation {
  const active = preset.enabled && preset.eventName === eventName;
  const graphAvailable = availableGraphIds.has(preset.graphId);
  return {
    presetId: preset.id,
    eventName,
    active,
    particleBudget: active ? Math.round(clamp(preset.maximumParticles, 0, 131_072)) : 0,
    graphId: graphAvailable ? preset.graphId : "",
    fallbackPresetId: graphAvailable ? null : preset.fallbackPresetId
  };
}

export function validateCompositingGraph(graph: CompositingGraphRecord): GraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!graph.targetId) errors.push("TARGET_MISSING");
  if (graph.nodes.length === 0) errors.push("GRAPH_EMPTY");
  if (graph.nodes.length > 128) errors.push("GRAPH_NODE_LIMIT");
  const topology = topologicalSort(graph.nodes);
  errors.push(...topology.errors);
  if (!graph.nodes.some((node) => node.kind === "output")) errors.push("OUTPUT_MISSING");
  const inputs = graph.nodes.filter((node) => node.kind === "input");
  if (inputs.length === 0) errors.push("INPUT_MISSING");
  const providedPasses = new Set(inputs.map((node) => String(node.parameters.pass ?? "")));
  for (const requiredPass of graph.requiredPasses) {
    if (!providedPasses.has(requiredPass)) warnings.push(`PASS_NOT_CONNECTED:${requiredPass}`);
  }
  const estimatedCost = graph.nodes.reduce((sum, node) => sum + compositingNodeCost(node), 0);
  return { valid: errors.length === 0, errors, warnings, orderedNodeIds: topology.ordered, estimatedCost };
}

export interface ColorSample {
  rgb: UltraVector3;
  luminanceNits: number;
  clipped: boolean;
}

export function transformColor(profile: ColorManagementProfile, linearRgb: UltraVector3): ColorSample {
  const exposure = Math.pow(2, clamp(profile.exposureStops, -16, 16));
  const contrast = clamp(profile.contrast, 0, 4);
  const saturation = clamp(profile.saturation, 0, 4);
  const exposed = linearRgb.map((channel) => Math.max(0, finite(channel) * exposure)) as unknown as UltraVector3;
  const luminance = exposed[0] * 0.2126 + exposed[1] * 0.7152 + exposed[2] * 0.0722;
  const contrasted = exposed.map((channel) => Math.max(0, (channel - 0.18) * contrast + 0.18)) as unknown as UltraVector3;
  const saturated = contrasted.map((channel) => Math.max(0, luminance + (channel - luminance) * saturation)) as unknown as UltraVector3;
  const compressed = profile.gamutCompression ? saturated.map((channel) => channel / (1 + channel * 0.15)) as unknown as UltraVector3 : saturated;
  const peak = Math.max(80, clamp(profile.peakNits, 80, 10_000));
  const displayScale = profile.displayTransform === "rec2020-pq" ? peak : Math.min(peak, 203);
  const luminanceNits = (compressed[0] * 0.2126 + compressed[1] * 0.7152 + compressed[2] * 0.0722) * displayScale;
  const rgb = canonicalVector(compressed);
  return { rgb, luminanceNits: canonical(luminanceNits), clipped: rgb.some((channel) => channel > 1) || luminanceNits > peak };
}

export interface ColorScopes {
  histogram: number[];
  waveform: number[];
  vectorscope: readonly [number, number][];
  minimumLuminance: number;
  maximumLuminance: number;
}

export function calculateColorScopes(samples: readonly UltraVector3[], bins = 32): ColorScopes {
  const safeBins = Math.round(clamp(bins, 8, 256));
  const histogram = Array.from({ length: safeBins }, () => 0);
  const waveform: number[] = [];
  const vectorscope: [number, number][] = [];
  let minimumLuminance = Number.POSITIVE_INFINITY;
  let maximumLuminance = Number.NEGATIVE_INFINITY;
  for (const sample of samples.slice(0, 1_000_000)) {
    const r = clamp(finite(sample[0]), 0, 16);
    const g = clamp(finite(sample[1]), 0, 16);
    const b = clamp(finite(sample[2]), 0, 16);
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const normalized = luminance / (1 + luminance);
    histogram[Math.min(safeBins - 1, Math.floor(normalized * safeBins))] += 1;
    waveform.push(canonical(normalized));
    vectorscope.push([canonical((b - luminance) * 0.5), canonical((r - luminance) * 0.5)]);
    minimumLuminance = Math.min(minimumLuminance, luminance);
    maximumLuminance = Math.max(maximumLuminance, luminance);
  }
  if (samples.length === 0) {
    minimumLuminance = 0;
    maximumLuminance = 0;
  }
  return { histogram, waveform, vectorscope, minimumLuminance: canonical(minimumLuminance), maximumLuminance: canonical(maximumLuminance) };
}

function topologicalSort(nodes: readonly (VfxGraphNode | CompositingNode)[]): { ordered: string[]; errors: string[] } {
  const errors: string[] = [];
  const byId = new Map<string, VfxGraphNode | CompositingNode>();
  for (const node of nodes) {
    if (!node.id || byId.has(node.id)) {
      errors.push(node.id ? `DUPLICATE_NODE:${node.id}` : "NODE_ID_MISSING");
      continue;
    }
    byId.set(node.id, node);
  }
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of byId.keys()) indegree.set(id, 0);
  for (const node of byId.values()) {
    for (const inputId of node.inputIds) {
      if (!byId.has(inputId)) {
        errors.push(`INPUT_MISSING:${node.id}:${inputId}`);
        continue;
      }
      indegree.set(node.id, (indegree.get(node.id) ?? 0) + 1);
      dependents.set(inputId, [...(dependents.get(inputId) ?? []), node.id]);
    }
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id).sort();
  const ordered: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const dependent of (dependents.get(id) ?? []).sort()) {
      const degree = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, degree);
      if (degree === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }
  if (ordered.length !== byId.size) errors.push("GRAPH_CYCLE");
  return { ordered, errors: [...new Set(errors)] };
}

function compositingNodeCost(node: CompositingNode): number {
  switch (node.kind) {
    case "blur": return 8;
    case "glow": return 6;
    case "depth": return 4;
    case "mask": return 3;
    case "merge": return 3;
    default: return 1;
  }
}

function finiteParameter(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeColor(value: UltraColor): UltraColor {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() as UltraColor : "#ffffff";
}

function smoothNightFactor(timeOfDay: number): number {
  const daylight = Math.max(0, Math.sin(wrap01(timeOfDay) * Math.PI * 2));
  return 1 - daylight;
}

function wrap01(value: number): number {
  const finiteValue = finite(value);
  return ((finiteValue % 1) + 1) % 1;
}

function lerp(a: number, b: number, t: number): number {
  return finite(a) + (finite(b) - finite(a)) * clamp(t, 0, 1);
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finite(value)));
}

function canonical(value: number): number {
  const safe = finite(value);
  return Object.is(safe, -0) ? 0 : Number(safe.toFixed(9));
}

function canonicalVector(value: readonly number[]): UltraVector3 {
  return [canonical(value[0] ?? 0), canonical(value[1] ?? 0), canonical(value[2] ?? 0)];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix32(a: number, b: number): number {
  let value = (a ^ b) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
