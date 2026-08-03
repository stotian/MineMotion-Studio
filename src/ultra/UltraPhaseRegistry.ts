import { ULTRA_ROADMAP_PHASES_84_600 } from "./roadmap/UltraRoadmap84To600";

export const ULTRA_PHASE_FIRST = 36;
export const ULTRA_PHASE_LAST = 600;
export const ULTRA_PHASE_NUMBERS: readonly number[] = Object.freeze(
  Array.from({ length: ULTRA_PHASE_LAST - ULTRA_PHASE_FIRST + 1 }, (_, index) => ULTRA_PHASE_FIRST + index)
);

export type UltraPhaseNumber = number;
export type UltraPhaseStatus = "planned" | "configured" | "validated" | "blocked";

export const ULTRA_ARCS = Object.freeze([
  { id: "performance", title: "Performance animation" },
  { id: "directing", title: "Directing" },
  { id: "entities", title: "Entities" },
  { id: "world", title: "World" },
  { id: "rendering", title: "Rendering" },
  { id: "final-render", title: "Final render" },
  { id: "modeling", title: "Modeling" },
  { id: "procedural", title: "Procedural" },
  { id: "animation", title: "Animation" },
  { id: "editing", title: "Editing" },
  { id: "workflow", title: "Workflow" },
  { id: "interaction", title: "Interaction" },
  { id: "navigation", title: "Navigation" },
  { id: "organization", title: "Organization" },
  { id: "assets", title: "Assets" },
  { id: "project", title: "Projects" },
  { id: "shading", title: "Shading" },
  { id: "lighting", title: "Lighting" },
  { id: "camera", title: "Camera" },
  { id: "rigging", title: "Rigging" },
  { id: "acting", title: "Acting and mocap" },
  { id: "minecraft", title: "Minecraft worlds" },
  { id: "simulation", title: "Simulation" },
  { id: "vfx", title: "VFX" },
  { id: "audio", title: "Audio" },
  { id: "compositing", title: "Compositing" },
  { id: "export", title: "Export" },
  { id: "collaboration", title: "Collaboration" },
  { id: "automation", title: "Automation" },
  { id: "ecosystem", title: "Ecosystem" },
  { id: "performance-tools", title: "Performance tools" },
  { id: "reliability", title: "Reliability" },
  { id: "accessibility", title: "Accessibility" },
  { id: "learning", title: "Learning" },
  { id: "security", title: "Security and QA" }
] as const);

export type UltraArcId = (typeof ULTRA_ARCS)[number]["id"];
export type UltraEvidenceKind =
  | "deterministic" | "visual" | "performance" | "native" | "security"
  | "interoperability" | "workflow" | "reliability" | "accessibility";

export interface UltraPhaseDefinition {
  number: UltraPhaseNumber;
  arc: UltraArcId;
  title: string;
  objective: string;
  gate: string;
  dependencies: readonly UltraPhaseNumber[];
  program?: string;
  deliverables?: readonly string[];
  inspiration?: string;
  evidence?: UltraEvidenceKind;
  sourceCore?: string;
  testId?: string;
  maturity?: "planned" | "source-foundation";
}

const phase = (
  number: UltraPhaseNumber,
  arc: UltraArcId,
  title: string,
  objective: string,
  gate: string,
  dependencies: readonly UltraPhaseNumber[] = []
): UltraPhaseDefinition => Object.freeze({
  number, arc, title, objective, gate, dependencies,
  program: "Ultra production foundations",
  evidence: "deterministic",
  testId: `P${number}_LEGACY_ACCEPTANCE`,
  maturity: "source-foundation"
});

const LEGACY_ULTRA_PHASE_DEFINITIONS: readonly UltraPhaseDefinition[] = Object.freeze([
  phase(36, "performance", "Advanced Minecraft facial rig", "Drive visemes, emotions and micro-expressions with a bounded cubic facial model.", "A 60-second dialogue samples deterministically without changing characters that did not enable the facial rig."),
  phase(37, "performance", "Pose-space corrective deformation", "Preserve joint volume with pose-dependent corrective rules.", "Extreme reference poses remain within configured volume and offset bounds.", [36]),
  phase(38, "performance", "Hands, feet and prop contact solver", "Solve temporary contacts and bake them into standard keys.", "Walking, climbing, grip and mount fixtures stay below the configured contact residual.", [37]),
  phase(39, "performance", "Non-destructive animation layers", "Combine base motion, acting and corrections with editable masks and fades.", "Selective bake preserves the visible result and all non-contributing layers.", [38]),
  phase(40, "performance", "Universal Minecraft retargeting", "Transfer editable curves across player, mob and custom rigs.", "One source clip retargets to five rig families with explicit confidence reports.", [39]),
  phase(41, "performance", "Cinematic locomotion", "Generate terrain-aware walk, run, sprint, jump, fall and stop clips.", "A reference obstacle course reaches its final target without invalid samples or hidden runtime state.", [38, 40]),
  phase(42, "performance", "Body performance library", "Search and apply reusable acting blocks with deterministic variations.", "A two-character dialogue can be blocked with standard editable clips in under ten operations.", [39]),
  phase(43, "performance", "Assisted video motion capture", "Convert bounded local skeleton observations into editable Minecraft animation.", "A simple licensed video reference produces an editable clip with confidence and correction data.", [40]),
  phase(44, "performance", "Professional curve editor tools", "Smooth, simplify and diagnose animation curves without destructive rewrites.", "Reference curves can be cleaned while preserving endpoints and configured error tolerances.", [39]),
  phase(45, "performance", "Animation graph and state machine", "Blend clips through states, parameters and deterministic transitions.", "A multi-minute crowd state graph reproduces the same state trace for the same inputs.", [39, 42]),

  phase(46, "directing", "Physical cinema cameras", "Model sensor, focal length, aperture, shutter, ISO and depth of field.", "Viewport and export derive the same field of view and exposure plan."),
  phase(47, "directing", "Advanced camera rigs", "Provide dolly, crane, orbit, shoulder, drone and attached camera rigs.", "Every reference camera move can be sampled and baked without scripts.", [46]),
  phase(48, "directing", "Composition assistant", "Score framing guides and visible problems without changing the shot automatically.", "The assistant reports deterministic warnings and never mutates camera data.", [46]),
  phase(49, "directing", "Continuity and 180-degree rule", "Track action axes, gaze and screen direction across shots.", "A multi-camera sequence identifies every intentional and accidental axis crossing.", [46]),
  phase(50, "directing", "Cinematic focus system", "Animate focus targets and rack-focus transitions.", "Moving cameras and subjects retain stable, bounded focus distances.", [46]),
  phase(51, "directing", "Director blocking mode", "Create low-cost scene blocking snapshots that can promote to final assets.", "A two-minute scene can be represented without final meshes or effects."),
  phase(52, "directing", "3D storyboard and animatic", "Link storyboard cards, temporary audio and production shots.", "Storyboard, animatic and final sequence share stable shot identifiers.", [51]),
  phase(53, "directing", "Coverage and take variants", "Compare cameras, performances and timing without duplicating projects.", "Promoting a take preserves shot, audio and render references.", [52]),
  phase(54, "directing", "Director annotations", "Attach frame-accurate drawings, notes and statuses to versions.", "Every note resolves to a valid shot, frame and revision.", [53]),
  phase(55, "directing", "Multi-scene cinematic sequencer", "Assemble shots and scenes into a long-form editable sequence.", "An episode timeline conforms to source shots without frame overlap or missing handles.", [52, 53]),

  phase(56, "entities", "Minecraft entity catalog", "Version supported players, animals, monsters, bosses and variants.", "Every enabled catalog entry has a rig family, material profile and fallback."),
  phase(57, "entities", "Custom mob builder", "Describe original Minecraft-style creatures with bounded bones and sockets.", "A custom mob validates and round-trips without source-code changes.", [56]),
  phase(58, "entities", "Armor, clothing and accessories", "Resolve layered equipment, slots and attachment offsets.", "Animated equipment changes preserve valid slots and avoid duplicate occupancy.", [56]),
  phase(59, "entities", "Capes, hair and secondary motion", "Apply deterministic stylized spring chains with collision limits.", "The same settings and seed produce identical secondary-motion samples.", [56]),
  phase(60, "entities", "Attention and gaze", "Coordinate eyes, head and torso toward prioritized targets.", "Dialogue fixtures maintain target continuity with bounded angular velocity.", [36, 56]),
  phase(61, "entities", "Mob locomotion families", "Configure quadruped, flying, crawling, swimming and boss movement.", "Every locomotion family completes its validation route without invalid transforms.", [41, 56]),
  phase(62, "entities", "Combat choreography", "Schedule attacks, anticipation, contact, reaction and recovery events.", "Retime operations preserve contact ordering and minimum reaction windows.", [38, 56]),
  phase(63, "entities", "Parkour and cinematic navigation", "Plan block-aware jumps, climbs and chase paths.", "A complex route is valid, bounded and editable after generation.", [41, 56]),
  phase(64, "entities", "Synchronized facial and body acting", "Drive face, posture, gaze and breathing from shared emotional beats.", "Changing a beat updates generated channels without overwriting local corrections.", [36, 42, 60]),
  phase(65, "entities", "Narrative crowds", "Assign roles, intentions and reactions to readable crowd groups.", "Two hundred agents preserve a primary action corridor and deterministic grouping.", [45, 56]),

  phase(66, "world", "Non-destructive set editor", "Layer block additions, masks and replacements over a read-only Minecraft source.", "The source fingerprint remains unchanged after every set operation."),
  phase(67, "world", "Directed block destruction", "Schedule deterministic block fractures and propagation groups.", "A fixed seed reproduces the same destruction order and fragments.", [66]),
  phase(68, "world", "Contextual debris and dust", "Generate block-aware debris, dust and grounded traces with budgets.", "Generated debris stays within count and visibility budgets.", [67]),
  phase(69, "world", "Minecraft rigid-body physics", "Simulate bounded block, prop and projectile bodies with checkpoints.", "Rigid fixtures remain finite, deterministic and resumable.", [67]),
  phase(70, "world", "Stylized fluids", "Represent water and lava flows with Minecraft-preserving surface rules.", "Fluid samples stay bounded and keep block-readable silhouettes.", [66]),
  phase(71, "world", "Fire, smoke and combustion", "Model controlled ignition, propagation, smoke and light response.", "Combustion remains bounded by fuel, duration and spatial limits.", [66]),
  phase(72, "world", "Cinematic redstone", "Evaluate redstone nodes and timeline-driven state overrides.", "A mechanism produces the same outputs for the same ordered events.", [66]),
  phase(73, "world", "Vehicles and mounts", "Sample minecart, boat, horse, elytra and custom vehicle paths.", "Mount and passenger transforms remain attached across speed changes.", [38, 66]),
  phase(74, "world", "Directed weather and seasons", "Animate local weather, accumulation and seasonal presets by shot.", "Weather changes do not alter imported world data and interpolate deterministically.", [66]),
  phase(75, "world", "Large-scale battle simulation", "Coordinate crowds, projectiles, destruction, weather and event waves.", "The reference battle is reproducible and respects configured entity and event budgets.", [65, 67, 68, 69, 74]),

  phase(76, "rendering", "Cinematic Minecraft materials", "Enrich block materials while preserving pixel readability and Minecraft silhouettes.", "Reference blocks remain identifiable under every reviewed lighting setup."),
  phase(77, "rendering", "Hybrid physical and artistic lighting", "Combine physical exposure with light linking, blockers, cookies and shot groups.", "A subject can be relit without changing unlinked set lighting.", [76]),
  phase(78, "rendering", "High-quality volumetrics", "Represent local and global fog, shafts and atmospheric depth with bounded preview/final profiles.", "Preview and final transmittance remain within the documented tolerance.", [77]),
  phase(79, "rendering", "Cinematic sky and clouds", "Maintain sun, moon, stars, cloud layers and temporal continuity across shots.", "A multi-shot sky sequence has no unplanned time or cloud discontinuity.", [77, 78]),
  phase(80, "rendering", "Node-based VFX editor", "Describe spawn, motion, appearance and events through validated reusable graphs.", "A complex graph packages, reloads and evaluates deterministically inside its budget."),
  phase(81, "rendering", "Procedural Minecraft effects", "Provide versioned potion, enchantment, portal, XP, redstone and boss effects.", "Every enabled effect has a preview, budget, fallback and deterministic event binding.", [80]),
  phase(82, "rendering", "Integrated node compositing", "Finish common multipass work with color, masks, glow, blur, depth and object IDs.", "A reviewed multipass shot evaluates without graph cycles or missing inputs.", [80]),
  phase(83, "rendering", "Color management and look development", "Keep linear working data, display transforms, LUTs and scopes consistent through delivery.", "SDR and HDR reference outputs pass their configured gamut and luminance contracts.", [76, 82])
]);

export const ULTRA_PHASE_DEFINITIONS: readonly UltraPhaseDefinition[] = Object.freeze([
  ...LEGACY_ULTRA_PHASE_DEFINITIONS,
  ...ULTRA_ROADMAP_PHASES_84_600
]);

if (ULTRA_PHASE_DEFINITIONS.length !== ULTRA_PHASE_NUMBERS.length) {
  throw new Error(`Ultra phase registry contains ${ULTRA_PHASE_DEFINITIONS.length} definitions for ${ULTRA_PHASE_NUMBERS.length} numbers.`);
}

export const ULTRA_PHASE_BY_NUMBER: ReadonlyMap<UltraPhaseNumber, UltraPhaseDefinition> =
  new Map(ULTRA_PHASE_DEFINITIONS.map((definition) => [definition.number, definition]));

export const ULTRA_ARC_BY_ID: ReadonlyMap<UltraArcId, (typeof ULTRA_ARCS)[number]> =
  new Map(ULTRA_ARCS.map((arc) => [arc.id, arc]));

export function isUltraPhaseNumber(value: unknown): value is UltraPhaseNumber {
  return typeof value === "number" && Number.isInteger(value) && ULTRA_PHASE_BY_NUMBER.has(value);
}

export function isUltraArcId(value: unknown): value is UltraArcId {
  return typeof value === "string" && ULTRA_ARC_BY_ID.has(value as UltraArcId);
}

export function getUltraPhaseDefinition(number: UltraPhaseNumber): UltraPhaseDefinition {
  const definition = ULTRA_PHASE_BY_NUMBER.get(number);
  if (!definition) throw new Error(`Unknown Ultra phase ${number}.`);
  return definition;
}
