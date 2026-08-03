export type FeatureTruthStatus = "working" | "partial" | "experimental" | "planned" | "blocked-validation";
export interface FeatureTruthEntry {
  id: string;
  area: string;
  status: FeatureTruthStatus;
  userVisible: boolean;
  evidence: string[];
  limitations: string[];
}
export const FEATURE_TRUTH_MATRIX: FeatureTruthEntry[] = [
  entry("project-packages", "Projects", "working", ["src/project/package/PackageWriter.ts", "src/project/package/PackageReader.ts"], ["ZIP uses stored entries; package safety limits are enforced."]),
  entry("animation", "Animation", "working", ["src/animation", "src/ui/timeline"], ["Not a general-purpose DCC animation graph."]),
  entry("rigging", "Rigging", "working", ["src/rigs", "docs/RIGGING.md"], ["Focused on Minecraft-style rigs and supported Blockbench mappings."]),
  entry("vfx", "VFX", "working", ["src/vfx", "docs/VFX_GUIDE.md"], ["Imported executable shaders are not supported."]),
  entry("world-import", "World import", "working", ["src/minecraft/import", "docs/WORLD_IMPORT_LIMITATIONS.md"], ["Read-only Java Anvil import; historical numeric blocks and arbitrary mod renderers are limited."]),
  entry("audio", "Audio", "working", ["src/audio", "docs/AUDIO_EXPORT.md"], ["Animation synchronization and handoff only; not a full NLE or DAW."]),
  entry("shots", "Shots", "working", ["src/production", "docs/PHASE_22_SHOTS_RENDER_HANDOFF.md"], ["Depth/normals/object-ID are data passes, not a full compositor node graph."]),
  entry("simulations", "Simulations", "working", ["src/simulation", "docs/PHASE_30_DETERMINISTIC_SIMULATION.md"], ["Bounded stylized solvers, not general rigid-body physics."]),
  entry("crowds", "Procedural crowds", "experimental", ["src/experimental/crowds"], ["Feature flag, maximum 80 generated characters."]),
  entry("plugins", "Extensions", "partial", ["src/plugins", "docs/PLUGIN_SYSTEM.md"], ["Data packs work; worker extensions are permissioned, opt-in, and intentionally constrained."]),
  entry("ultra-production", "Ultra production foundations", "partial", ["src/ultra", "docs/ULTRA_PHASES_36_83.md", "docs/ULTRA_VALIDATION.md"], ["Persistent deterministic source foundations and 31 Phase 136–600 program engines are implemented; final dedicated artist tools, GPU parity, film validation, neural mocap and high-scale hardware calibration remain pending."]),
  entry("desktop", "Desktop application", "blocked-validation", ["src-tauri", ".github/workflows/release-candidate.yml"], ["No platform support claim until installers pass smoke tests."]),
  entry("updater", "Automatic updater", "planned", ["distribution/updater-policy.json"], ["Disabled for v1 until secure signed infrastructure exists."])
];
function entry(id: string, area: string, status: FeatureTruthStatus, evidence: string[], limitations: string[]): FeatureTruthEntry {
  return { id, area, status, userVisible: status !== "planned", evidence, limitations };
}
export function validateFeatureTruth(entries = FEATURE_TRUTH_MATRIX): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const item of entries) {
    if (ids.has(item.id)) errors.push(`Duplicate feature id ${item.id}.`); ids.add(item.id);
    if (item.evidence.length === 0) errors.push(`${item.id} has no evidence.`);
    if ((item.status === "partial" || item.status === "experimental" || item.status === "blocked-validation") && item.limitations.length === 0) errors.push(`${item.id} must document limitations.`);
  }
  return errors;
}
