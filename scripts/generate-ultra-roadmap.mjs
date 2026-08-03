import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputJson = path.join(root, "src", "ultra", "roadmap", "UltraRoadmap84To600.json");
const outputDocs = path.join(root, "docs", "ULTRA_MASTER_PLAN_PHASES_84_600.md");
const outputProgramsDir = path.join(root, "src", "ultra", "programs");
const outputProgramRegistry = path.join(outputProgramsDir, "UltraProgramRegistry.ts");

const MANUAL_GROUPS = [
  {
    "arc": "final-render",
    "program": "Offline final rendering",
    "problem": "high-quality offline rendering with deterministic checkpoints, explicit quality controls and bounded memory",
    "fixture": "4K 240-frame castle fly-through",
    "evidence": "performance",
    "sourceCore": "src/ultra/final/UltraFinalRenderEngine.ts",
    "inspiration": "Hybrid Blender/Cycles workflow and MineMotion production constraints",
    "titles": [
      "Offline final renderer",
      "Render quality profiles",
      "Deterministic sample sequencing",
      "Adaptive sample convergence",
      "Tile and bucket scheduler",
      "Render checkpoints and resume",
      "Denoising pipeline",
      "Motion and deformation blur",
      "Cinematic depth of field",
      "Object masks and cryptomatte sets",
      "Render passes and custom AOVs",
      "Distributed render queue"
    ]
  },
  {
    "arc": "modeling",
    "program": "Minecraft-native modeling",
    "problem": "building and modifying Minecraft-style geometry without destructive edits or hidden topology changes",
    "fixture": "modular village hero asset",
    "evidence": "deterministic",
    "sourceCore": "src/ultra/modeling/UltraModelingEngine.ts",
    "inspiration": "Hybrid Blender modifier workflow and MineMotion block semantics",
    "titles": [
      "Non-destructive modeling stack",
      "Block modeling toolkit",
      "Modifier evaluation graph",
      "Geometry nodes foundation",
      "Reusable node groups",
      "Procedural scattering",
      "Persistent selection sets",
      "UV and material assignment",
      "Topology diagnostics",
      "LOD and impostor generation"
    ]
  },
  {
    "arc": "animation",
    "program": "Professional animation editing",
    "problem": "editing character, prop and camera motion with readable curves, reversible operations and stable retiming",
    "fixture": "two-character 20-second dialogue",
    "evidence": "deterministic",
    "sourceCore": "src/ultra/animation/UltraAnimationWorkflowEngine.ts",
    "inspiration": "Hybrid Blender animation editors and MineMotion rig constraints",
    "titles": [
      "Dope Sheet workflow",
      "Graph Editor workflow",
      "Nonlinear animation strips",
      "Constraint stack editor",
      "Drivers and safe expressions",
      "IK/FK switching",
      "Pose asset browser",
      "Shape keys and morph channels",
      "Animation retiming and warping",
      "Animation cleanup assistant"
    ]
  },
  {
    "arc": "editing",
    "program": "Integrated editorial finishing",
    "problem": "assembling image, video, dialogue and sound into a reversible timeline with reliable conform and relink behavior",
    "fixture": "90-second multi-shot trailer",
    "evidence": "interoperability",
    "sourceCore": "src/ultra/editing/UltraEditingWorkflowEngine.ts",
    "inspiration": "Hybrid Blender VSE/NLE patterns and community simplification requests",
    "titles": [
      "Video sequence editor",
      "Multicam editorial",
      "Proxy media and cache",
      "Audio mixer and buses",
      "Dialogue and caption tools",
      "Timecode EDL and XML interchange",
      "Offline media relink",
      "Editorial transitions and effects",
      "Editorial conform engine",
      "Mastering timeline"
    ]
  },
  {
    "arc": "workflow",
    "program": "Production workflow simplification",
    "problem": "making large MineMotion productions discoverable, reviewable, automatable and safe to deliver",
    "fixture": "ten-shot collaborative short film",
    "evidence": "workflow",
    "sourceCore": "src/ultra/production/UltraProductionWorkflowEngine.ts",
    "inspiration": "Hybrid Blender workspace/asset browser ideas, public workflow pain points and MineMotion originals",
    "titles": [
      "Universal asset browser",
      "Dependency graph inspector",
      "Workspace templates",
      "Command palette and action search",
      "Review and version comparison",
      "Collaboration packages",
      "Batch operations",
      "Render farm manager",
      "Production dashboard",
      "Release handoff validation"
    ]
  }
];
const PROGRAMS = [
  {
    "arc": "interaction",
    "program": "Interaction and UI foundations",
    "problem": "reducing modal confusion, shortcut overload and accidental edits",
    "fixture": "dense animation workspace",
    "inspiration": "Community workflow simplification",
    "titles": [
      "Context-sensitive tool shelf",
      "Non-modal operator search",
      "Progressive disclosure panels",
      "Universal command history",
      "Repeat last action with parameters",
      "Favorites and quick-access shelf",
      "Gesture-safe drag thresholds",
      "Precision numeric input",
      "Inline unit conversion",
      "Context breadcrumbs",
      "Hover diagnostics",
      "Consistent confirm and cancel semantics",
      "Multi-action status bar",
      "Focus-preserving dialogs",
      "Distraction-free presentation mode"
    ]
  },
  {
    "arc": "workflow",
    "program": "Workspaces and layout",
    "problem": "adapting the interface to each production task, display size and team convention",
    "fixture": "dual-monitor shot workspace",
    "inspiration": "Blender workspace pattern plus MineMotion simplification",
    "titles": [
      "Workspace presets per task",
      "User-defined workspace templates",
      "Split and join editor areas",
      "Temporary full-screen editor",
      "Workspace snapshots",
      "Per-shot workspace recall",
      "Dual-monitor layouts",
      "Small-screen adaptive layout",
      "High-DPI density profiles",
      "Panel pinning and locking",
      "Editor type quick-switch",
      "Layout diff and restore",
      "Safe factory reset",
      "Shared team workspaces",
      "Workspace performance budget"
    ]
  },
  {
    "arc": "navigation",
    "program": "Selection search and navigation",
    "problem": "finding and isolating the correct object, shot, channel or asset without breaking flow",
    "fixture": "2000-object battle scene",
    "inspiration": "Community discoverability feedback plus MineMotion originals",
    "titles": [
      "Universal fuzzy search",
      "Search by semantic tag",
      "Select by type",
      "Select by material",
      "Select by hierarchy",
      "Select by visibility",
      "Select by animation state",
      "Selection sets",
      "Named filters",
      "Invert grow and shrink selection",
      "Isolate and local view",
      "View bookmarks",
      "Frame selected across editors",
      "Navigation history",
      "Lost-object recovery"
    ]
  },
  {
    "arc": "organization",
    "program": "Scene organization and Outliner",
    "problem": "keeping complex scenes readable while preserving hierarchy, visibility and ownership",
    "fixture": "nested castle production scene",
    "inspiration": "Blender Outliner pattern plus safer MineMotion rules",
    "titles": [
      "Hierarchical collections",
      "Layered visibility",
      "Render and viewport overrides",
      "Drag-safe reparenting",
      "Dependency-aware delete",
      "Orphan detection",
      "Broken link diagnostics",
      "Scene statistics columns",
      "Custom Outliner columns",
      "Batch rename",
      "Prefix and suffix transforms",
      "Color labels",
      "Lock and permission states",
      "Outliner filters",
      "Massive-scene virtualization"
    ]
  },
  {
    "arc": "assets",
    "program": "Asset library and catalogs",
    "problem": "reusing portable assets with clear previews, versions, licenses and missing-file recovery",
    "fixture": "shared cinematic asset catalog",
    "inspiration": "Blender Asset Browser pattern plus production metadata",
    "titles": [
      "Indexed asset catalog",
      "Asset previews",
      "Tag taxonomies",
      "Favorites and recent assets",
      "Drag-and-drop import",
      "Linked versus local assets",
      "Asset version pinning",
      "Dependency packaging",
      "Duplicate detection",
      "Missing asset relink",
      "Asset provenance",
      "License metadata",
      "Content rating and safety",
      "Remote read-only catalogs",
      "Offline catalog cache"
    ]
  },
  {
    "arc": "project",
    "program": "Project and dependency management",
    "problem": "keeping projects portable, reproducible, clean and safe across long productions",
    "fixture": "portable episode project",
    "inspiration": "MineMotion original production safeguards",
    "titles": [
      "Project health dashboard",
      "Dependency graph",
      "Path remapping",
      "Portable project packaging",
      "Incremental save",
      "Background autosave",
      "Save variants",
      "Project branching",
      "Merge conflict report",
      "Schema migration preview",
      "External file watcher",
      "Cache inventory",
      "Storage quota planner",
      "Project cleanup wizard",
      "Reproducible project manifest"
    ]
  },
  {
    "arc": "modeling",
    "program": "Modeling and block authoring",
    "problem": "creating Minecraft-readable forms quickly while guarding silhouettes, snapping and collision intent",
    "fixture": "modular fortress kit",
    "inspiration": "Blender edit/modifier patterns adapted to blocks",
    "titles": [
      "Block primitive toolkit",
      "Grid and voxel snapping",
      "Face edge and vertex edit modes",
      "Minecraft silhouette guard",
      "Non-destructive bevel substitute",
      "Boolean block operations",
      "Stair and slab shape composer",
      "Modular kit assembly",
      "Symmetry and mirroring",
      "Array and radial duplication",
      "Surface conform",
      "Block palette replace",
      "Topology cleanup",
      "Collision proxy authoring",
      "Model validation report"
    ]
  },
  {
    "arc": "procedural",
    "program": "Procedural geometry and nodes",
    "problem": "generating reusable environments and variations through inspectable deterministic graphs",
    "fixture": "seeded village generator",
    "inspiration": "Blender Geometry Nodes pattern adapted to Minecraft",
    "titles": [
      "Geometry node graph",
      "Typed sockets",
      "Node group assets",
      "Field evaluation",
      "Instance distribution",
      "Attribute capture",
      "Procedural roads",
      "Procedural vegetation",
      "Procedural buildings",
      "Procedural caves",
      "Procedural damage",
      "Seeded variation",
      "Node debugger",
      "Graph performance profiler",
      "Bake procedural result"
    ]
  },
  {
    "arc": "shading",
    "program": "Materials and texture authoring",
    "problem": "authoring cinematic materials without losing pixel-art identity, resource-pack mapping or memory control",
    "fixture": "resource-pack lookdev scene",
    "inspiration": "Blender shader workflow plus Minecraft texture safeguards",
    "titles": [
      "Texture set importer",
      "Pixel-art sampling guard",
      "Material node graph",
      "Layered materials",
      "Decal authoring",
      "Emissive masks",
      "Animated textures",
      "UV transform tools",
      "Texture atlas builder",
      "PBR channel packing",
      "Minecraft resource-pack mapping",
      "Material variants",
      "Material override stacks",
      "Texture memory diagnostics",
      "Missing texture recovery"
    ]
  },
  {
    "arc": "lighting",
    "program": "Lighting and look development",
    "problem": "lighting subjects and sets independently while preserving exposure, continuity and Minecraft readability",
    "fixture": "day-to-night hero shot",
    "inspiration": "Blender lighting/lookdev patterns plus MineMotion continuity",
    "titles": [
      "Three-point light setup",
      "Light linking",
      "Light groups",
      "Gobo and cookie library",
      "Reflection cards",
      "Shadow blockers",
      "Exposure calibration",
      "White balance workflow",
      "Lookdev turntable",
      "Reference image matching",
      "Light mixer",
      "Shot lighting overrides",
      "Day and night continuity",
      "Light budget profiler",
      "Lighting validation plates"
    ]
  },
  {
    "arc": "camera",
    "program": "Camera and virtual production",
    "problem": "designing stable cinematic camera moves, focus and metadata across many shots",
    "fixture": "multi-camera chase sequence",
    "inspiration": "Blender camera tools plus virtual-production ideas",
    "titles": [
      "Physical camera presets",
      "Camera rig builder",
      "Dolly and crane path editor",
      "Handheld noise profiles",
      "Camera collision",
      "Horizon stabilization",
      "Safe framing guides",
      "Lens breathing",
      "Focus pull assistant",
      "Multi-camera switching",
      "Camera bookmarks",
      "Shot matching",
      "Virtual production overlays",
      "Camera metadata export",
      "Camera continuity report"
    ]
  },
  {
    "arc": "rigging",
    "program": "Rigging and skinning",
    "problem": "building portable controllable rigs with predictable weights, constraints and retargeting",
    "fixture": "custom boss rig",
    "inspiration": "Blender rigging patterns adapted to Minecraft rigs",
    "titles": [
      "Bone creation and edit",
      "Parent and child tools",
      "Bone roll normalization",
      "Rig templates",
      "Skin weight painting",
      "Automatic weights",
      "Weight normalization",
      "Symmetry weights",
      "Constraint library",
      "Custom properties",
      "Driver wiring",
      "Rig validation",
      "Retarget mapping",
      "Control shape library",
      "Rig performance LOD"
    ]
  },
  {
    "arc": "animation",
    "program": "Animation editing",
    "problem": "making timing, curves, poses and nonlinear clips faster to inspect and safer to modify",
    "fixture": "parkour performance clip",
    "inspiration": "Blender animation-editor patterns plus MineMotion diagnostics",
    "titles": [
      "Keyframe insertion sets",
      "Dope Sheet channels",
      "Graph curve handles",
      "Breakdown pose tools",
      "Hold and stepped keys",
      "Keyframe types and colors",
      "Ghost and onion skin",
      "Motion paths",
      "Timeline markers",
      "Time scaling",
      "Nonlinear strips",
      "Additive animation layers",
      "Animation channel filters",
      "Curve cleanup",
      "Animation validation"
    ]
  },
  {
    "arc": "acting",
    "program": "Acting and motion capture",
    "problem": "turning licensed reference footage into editable stylized performance with confidence and correction data",
    "fixture": "dialogue performance take",
    "inspiration": "Community mocap workflow plus MineMotion stylization",
    "titles": [
      "Webcam reference capture",
      "Video reference sync",
      "Body pose solve",
      "Hand pose solve",
      "Face solve",
      "Lip sync",
      "Eye blink synthesis",
      "Gaze targeting",
      "Emotion beats",
      "Gesture suggestions",
      "Performance takes",
      "Mocap cleanup",
      "Contact correction",
      "Retarget confidence",
      "Acting continuity"
    ]
  },
  {
    "arc": "minecraft",
    "program": "Minecraft worlds and biomes",
    "problem": "importing and staging huge worlds read-only while making terrain, structures and environment understandable",
    "fixture": "large overworld region",
    "inspiration": "MineMotion original Minecraft-native workflow",
    "titles": [
      "World region streaming",
      "Chunk selection",
      "Dimension switching",
      "Biome catalog",
      "Heightmap editing",
      "Terrain layers",
      "Structure discovery",
      "Cave visualization",
      "Lighting data import",
      "Weather zones",
      "Season overrides",
      "World diff layers",
      "Read-only source enforcement",
      "World cache management",
      "Huge-world diagnostics"
    ]
  },
  {
    "arc": "entities",
    "program": "Entities items and gameplay",
    "problem": "staging Minecraft actors, props and gameplay events with explicit version compatibility",
    "fixture": "raid choreography scene",
    "inspiration": "MineMotion original entity and event workflow",
    "titles": [
      "Entity catalog sync",
      "Item and block model catalog",
      "Equipment slots",
      "Inventory prop layouts",
      "Villager professions",
      "Mob variants",
      "Boss rigs",
      "Projectile trajectories",
      "Redstone event hooks",
      "Potion and status effects",
      "Damage state visuals",
      "Spawn choreography",
      "Mount and passenger relations",
      "Gameplay event recording",
      "Entity compatibility report"
    ]
  },
  {
    "arc": "simulation",
    "program": "Physics and simulation",
    "problem": "producing deterministic art-directable motion with bounded caches and clear diagnostics",
    "fixture": "destruction and cloth benchmark",
    "inspiration": "Blender simulation concepts adapted to deterministic Minecraft scenes",
    "titles": [
      "Rigid bodies",
      "Constraints",
      "Cloth capes",
      "Hair chains",
      "Soft-body squish",
      "Particle collisions",
      "Wind fields",
      "Force fields",
      "Fluid surfaces",
      "Fire spread",
      "Destruction caches",
      "Simulation substeps",
      "Deterministic seeds",
      "Simulation bake manager",
      "Simulation diagnostics"
    ]
  },
  {
    "arc": "vfx",
    "program": "VFX and particles",
    "problem": "authoring reusable Minecraft-readable effects with budgets, LOD and event synchronization",
    "fixture": "portal explosion benchmark",
    "inspiration": "Blender node/particle patterns plus MineMotion VFX library",
    "titles": [
      "Particle emitter graph",
      "Event-driven spawning",
      "Trail renderer",
      "Ribbon renderer",
      "Mesh particles",
      "Sprite sheets",
      "Volumetric smoke",
      "Explosion builder",
      "Magic effect builder",
      "Electric arc builder",
      "Environmental ambience",
      "Screen-space effects",
      "VFX LOD",
      "VFX preset packaging",
      "VFX debugger"
    ]
  },
  {
    "arc": "audio",
    "program": "Audio and dialogue",
    "problem": "editing synchronized dialogue, ambience and effects with clear loudness and delivery controls",
    "fixture": "dialogue-heavy cinematic scene",
    "inspiration": "Blender/NLE audio patterns plus MineMotion handoff",
    "titles": [
      "Audio waveform cache",
      "Multitrack mixer",
      "Clip gain envelopes",
      "Spatial audio",
      "Doppler preview",
      "Reverb zones",
      "Noise cleanup notes",
      "Dialogue take management",
      "Automatic silence detection",
      "Transcript import",
      "Subtitle authoring",
      "Phoneme markers",
      "Audio ducking",
      "Loudness validation",
      "Audio export stems"
    ]
  },
  {
    "arc": "editing",
    "program": "Editorial and sequencing",
    "problem": "cutting long-form sequences with fast trims, proxies, conform and offline-media recovery",
    "fixture": "episode master sequence",
    "inspiration": "Blender VSE and professional NLE workflow patterns",
    "titles": [
      "Shot bin",
      "Source and record monitors",
      "Razor and trim tools",
      "Ripple roll slip and slide edits",
      "Multicam sync",
      "Proxy workflows",
      "Speed ramps",
      "Adjustment clips",
      "Nested sequences",
      "Transition library",
      "Editorial markers",
      "EDL import and export",
      "Conform report",
      "Offline media handling",
      "Master sequence validation"
    ]
  },
  {
    "arc": "compositing",
    "program": "Compositing and color",
    "problem": "finishing render passes, masks and color consistently across SDR and HDR deliveries",
    "fixture": "multi-pass night shot",
    "inspiration": "Blender compositor/color patterns plus MineMotion delivery checks",
    "titles": [
      "Node compositing workspace",
      "Render layer inputs",
      "Cryptomatte selections",
      "Rotoshape masks",
      "Keying tools",
      "Tracking data import",
      "Glow blur and sharpen",
      "Depth effects",
      "Color wheels",
      "Curves and levels",
      "LUT management",
      "Shot matching",
      "HDR scopes",
      "Display transform preview",
      "Delivery color validation"
    ]
  },
  {
    "arc": "final-render",
    "program": "Rendering and scalability",
    "problem": "keeping preview and final rendering predictable from small laptops to large distributed scenes",
    "fixture": "million-instance benchmark scene",
    "inspiration": "Blender render workflow plus MineMotion scalability constraints",
    "titles": [
      "Preview renderer profiles",
      "Final renderer profiles",
      "Adaptive sampling",
      "Tile scheduling",
      "Render checkpoints",
      "Denoising",
      "Render passes",
      "Motion blur",
      "Depth of field",
      "Volumetrics",
      "Large-scene culling",
      "Instancing",
      "Out-of-core textures",
      "Distributed rendering",
      "Render regression suite"
    ]
  },
  {
    "arc": "export",
    "program": "Export and interchange",
    "problem": "delivering images, video, audio, caches and project packages with explicit manifests and compatibility",
    "fixture": "multi-format delivery package",
    "inspiration": "MineMotion interoperability and professional handoff",
    "titles": [
      "Image sequence export",
      "Video export",
      "Alpha export",
      "Audio stem export",
      "Project archive export",
      "Blender interchange",
      "Blockbench interchange",
      "glTF export",
      "Alembic-like cache plan",
      "EDL and XML export",
      "Minecraft datapack handoff",
      "Resource-pack handoff",
      "Render manifest",
      "Checksums and signatures",
      "Delivery package validator"
    ]
  },
  {
    "arc": "collaboration",
    "program": "Collaboration and review",
    "problem": "collecting actionable review notes and approvals without exposing private assets or losing version context",
    "fixture": "remote director review",
    "inspiration": "Community review workflow plus MineMotion privacy controls",
    "titles": [
      "Review sessions",
      "Frame annotations",
      "Version compare",
      "Side-by-side takes",
      "Approval states",
      "Assigned notes",
      "Due dates",
      "Comment threads",
      "Offline review package",
      "Redacted review export",
      "Conflict-free note merge",
      "Team activity log",
      "Role permissions",
      "Review analytics",
      "Final sign-off ledger"
    ]
  },
  {
    "arc": "automation",
    "program": "Automation and scripting",
    "problem": "removing repetitive production work through deterministic permissioned local automation",
    "fixture": "batch shot processing job",
    "inspiration": "Blender scripting ideas with a safer MineMotion boundary",
    "titles": [
      "Macro recorder",
      "Batch rename scripts",
      "Batch render recipes",
      "Command palette actions",
      "Safe expression engine",
      "Node graph automation",
      "Project template automation",
      "Event hooks",
      "Scheduled local jobs",
      "Headless CLI",
      "Deterministic job manifests",
      "Parameter sweeps",
      "Report generation",
      "Script permission prompts",
      "Automation audit log"
    ]
  },
  {
    "arc": "ecosystem",
    "program": "Plugins and ecosystem",
    "problem": "extending MineMotion through versioned permissioned packages without arbitrary code or silent failures",
    "fixture": "third-party importer extension",
    "inspiration": "Blender add-on ecosystem lessons plus MineMotion sandboxing",
    "titles": [
      "Plugin manifest version 2",
      "Permission scopes",
      "Sandboxed execution",
      "Extension marketplace index",
      "Offline extension packages",
      "Version compatibility",
      "Dependency resolution",
      "Signature verification",
      "Extension settings",
      "Extension UI slots",
      "Content-only packs",
      "Node pack extensions",
      "Importer and exporter extensions",
      "Crash isolation",
      "Plugin diagnostics"
    ]
  },
  {
    "arc": "performance-tools",
    "program": "Performance and profiling",
    "problem": "making CPU GPU memory I/O and evaluation costs visible before they become production blockers",
    "fixture": "heavy battle benchmark",
    "inspiration": "Blender-style statistics plus MineMotion measurable budgets",
    "titles": [
      "Frame-time HUD",
      "CPU profiler",
      "GPU profiler",
      "Memory profiler",
      "Asset memory report",
      "Draw-call report",
      "Shader compile report",
      "Timeline evaluation profiler",
      "Simulation profiler",
      "I/O profiler",
      "Background task monitor",
      "Performance budgets",
      "Regression baselines",
      "Automatic quality scaling",
      "Optimization recommendations"
    ]
  },
  {
    "arc": "reliability",
    "program": "Reliability and recovery",
    "problem": "preventing lost work and recovering safely from crashes, low disk, corruption and interrupted exports",
    "fixture": "forced-crash recovery drill",
    "inspiration": "Community lost-work pain points plus MineMotion fail-safe design",
    "titles": [
      "Crash-safe journal",
      "Autosave rotation",
      "Recovery browser",
      "Corruption detection",
      "Partial project salvage",
      "Undo integrity checks",
      "Transactional saves",
      "Atomic cache writes",
      "Stale lock handling",
      "Low-disk warnings",
      "Interrupted export recovery",
      "Dependency fallback",
      "Support bundle",
      "Privacy-safe logs",
      "Disaster recovery drill"
    ]
  },
  {
    "arc": "accessibility",
    "program": "Accessibility and localization",
    "problem": "making every primary workflow keyboard-accessible, readable, translatable and testable",
    "fixture": "keyboard-only localized project",
    "inspiration": "Accessibility standards adapted to MineMotion workflows",
    "titles": [
      "Full keyboard navigation",
      "Screen-reader labels",
      "High-contrast theme",
      "Reduced motion",
      "Color-blind-safe indicators",
      "Scalable typography",
      "Touch target sizing",
      "Focus visibility",
      "Shortcut conflict checker",
      "Remappable shortcuts",
      "Locale switching",
      "Pluralization",
      "Right-to-left readiness",
      "Translation completeness",
      "Accessibility regression suite"
    ]
  },
  {
    "arc": "learning",
    "program": "Learning and assistance",
    "problem": "helping new and expert users discover the correct workflow without fake automation or destructive guesses",
    "fixture": "first cinematic onboarding",
    "inspiration": "Community discoverability pain points plus MineMotion teaching tools",
    "titles": [
      "Guided onboarding",
      "Context help",
      "Interactive tutorials",
      "Sample projects",
      "Template chooser",
      "Empty-state guidance",
      "Error recovery suggestions",
      "Shortcut coach",
      "Workflow checklists",
      "Production presets",
      "Searchable documentation",
      "In-app changelog",
      "Skill-level modes",
      "Non-destructive experimentation",
      "Learning progress dashboard"
    ]
  },
  {
    "arc": "security",
    "program": "Security QA and release",
    "problem": "proving that imports, serialization, plugins, builds and publication fail safely under hostile or incomplete conditions",
    "fixture": "release-candidate evidence run",
    "inspiration": "MineMotion original security and evidence gates",
    "titles": [
      "Import validation",
      "Path traversal protection",
      "Archive bomb limits",
      "Untrusted shader blocking",
      "Plugin permission tests",
      "Privacy review",
      "Dependency audit",
      "Fuzz testing",
      "Property-based serialization tests",
      "Cross-platform smoke tests",
      "Visual regression harness",
      "Performance gate",
      "Release evidence ledger",
      "Reproducible build manifest",
      "Fail-closed publication gate"
    ]
  }
];

const evidenceByArc = Object.freeze({
  interaction: "workflow", workflow: "workflow", navigation: "workflow", organization: "workflow",
  assets: "interoperability", project: "reliability", modeling: "deterministic", procedural: "deterministic",
  shading: "visual", lighting: "visual", camera: "visual", rigging: "deterministic", animation: "deterministic",
  acting: "visual", minecraft: "performance", entities: "interoperability", simulation: "performance", vfx: "visual",
  audio: "interoperability", editing: "interoperability", compositing: "visual", "final-render": "performance",
  export: "interoperability", collaboration: "workflow", automation: "security", ecosystem: "security",
  "performance-tools": "performance", reliability: "reliability", accessibility: "accessibility", learning: "workflow",
  security: "security"
});

function slug(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function pascal(value) {
  return slug(value).split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function programFileStem(program) {
  return `${pascal(program)}Engine`;
}

function programSourceCore(program) {
  return `src/ultra/programs/${programFileStem(program)}.ts`;
}

function constantName(value) {
  return `${slug(value).replace(/-/g, "_").toUpperCase()}_PROGRAM`;
}

function strategyForArc(arc) {
  if (["procedural", "vfx", "compositing", "automation", "ecosystem"].includes(arc)) return "graph";
  if (["animation", "acting", "audio", "editing"].includes(arc)) return "timeline";
  if (["minecraft", "entities", "simulation", "performance-tools"].includes(arc)) return "simulation";
  if (arc === "export") return "io";
  if (["collaboration", "reliability"].includes(arc)) return "review";
  if (arc === "security") return "security";
  return "editor";
}

function makePhase(number, group, title, index, previous) {
  const operationBudget = 5 + (index % 5);
  const evidence = group.evidence ?? evidenceByArc[group.arc] ?? "deterministic";
  const sourceCore = group.sourceCore ?? programSourceCore(group.program);
  const inspiration = group.inspiration;
  const dependencies = previous ? [previous] : number === 84 ? [83] : [135];
  const normalized = title.toLowerCase();
  return {
    number,
    arc: group.arc,
    title,
    program: group.program,
    objective: `Make ${normalized} a first-class MineMotion workflow for ${group.problem}. The implementation remains non-destructive, deterministic, serializable, searchable and free of hidden runtime state.`,
    gate: `The ${group.fixture} fixture completes ${normalized} in at most ${operationBudget} deliberate operations, survives save/reload plus undo/redo, and produces the same acceptance fingerprint twice without validation errors.`,
    dependencies,
    deliverables: [
      `${title} typed contract, reversible command and deterministic evaluator`,
      `${group.program} workspace integration with search, shortcuts and context guidance`,
      `Diagnostics, resource budget, fallback behavior and migration coverage for ${normalized}`
    ],
    inspiration,
    evidence,
    sourceCore,
    testId: `P${number}_${slug(title).replace(/-/g, "_").toUpperCase()}_ACCEPTANCE`,
    maturity: "source-foundation"
  };
}

function buildRoadmap() {
  const phases = [];
  let number = 84;
  let previous = 83;
  for (const group of MANUAL_GROUPS) {
    for (let index = 0; index < group.titles.length; index += 1) {
      phases.push(makePhase(number, group, group.titles[index], index, previous));
      previous = number;
      number += 1;
    }
  }
  if (number !== 136) throw new Error(`Manual roadmap ended at ${number - 1}, expected 135.`);
  for (const group of PROGRAMS) {
    let programPrevious = null;
    for (let index = 0; index < group.titles.length; index += 1) {
      const dependency = programPrevious ?? previous;
      phases.push(makePhase(number, group, group.titles[index], index, dependency));
      programPrevious = number;
      previous = number;
      number += 1;
    }
  }
  if (number !== 601) throw new Error(`Roadmap ended at ${number - 1}, expected 600.`);
  return phases;
}

function renderProgramModule(group, phases, programIndex) {
  const descriptor = {
    id: slug(group.program),
    arc: group.arc,
    program: group.program,
    problem: group.problem,
    fixture: group.fixture,
    inspiration: group.inspiration,
    strategy: strategyForArc(group.arc),
    sourceCore: programSourceCore(group.program),
    maximumOperations: 8 + (programIndex % 5),
    maximumResourceUnits: 4096 + programIndex * 512,
    maximumSelection: strategyForArc(group.arc) === "simulation" ? 16_384 : 4096,
    supportsPreview: !["security"].includes(group.arc),
    requiresConfirmation: ["export", "simulation", "security", "project"].includes(group.arc),
    phases: phases.map((phase) => ({
      phase: phase.number,
      title: phase.title,
      operatorId: `${slug(group.program).replace(/-/g, ".")}.${slug(phase.title).replace(/-/g, ".")}`,
      testId: phase.testId,
      evidence: phase.evidence,
      deliverables: phase.deliverables
    }))
  };
  return [
    'import { defineUltraProgram } from "./UltraProgramRuntimeEngine";',
    "",
    `export const ${constantName(group.program)} = defineUltraProgram(${JSON.stringify(descriptor, null, 2)});`,
    ""
  ].join("\n");
}

function renderProgramRegistry(programEntries) {
  const imports = programEntries.map(({ group }, index) => `import { ${constantName(group.program)} as PROGRAM_${index + 1} } from "./${programFileStem(group.program)}";`);
  const descriptors = programEntries.map((_, index) => `  PROGRAM_${index + 1}`).join(",\n");
  return [
    ...imports,
    'import { runUltraProgramDescriptorPhaseTest, validateUltraProgramDescriptor, type UltraProgramDescriptor, type UltraProgramPhaseTestResult } from "./UltraProgramRuntimeEngine";',
    'import type { UltraPhaseNumber } from "../UltraPhaseRegistry";',
    "",
    "export const ULTRA_PROGRAM_DESCRIPTORS: readonly UltraProgramDescriptor[] = Object.freeze([",
    descriptors,
    "]);",
    "",
    "const ULTRA_PROGRAM_BY_PHASE = new Map<UltraPhaseNumber, UltraProgramDescriptor>();",
    "for (const descriptor of ULTRA_PROGRAM_DESCRIPTORS) {",
    "  const errors = validateUltraProgramDescriptor(descriptor);",
    '  if (errors.length > 0) throw new Error(`Ultra program ${descriptor.id} is invalid: ${errors.join(", ")}`);',
    "  for (const phase of descriptor.phases) {",
    "    if (ULTRA_PROGRAM_BY_PHASE.has(phase.phase)) throw new Error(`Ultra program phase ${phase.phase} has multiple owners.`);",
    "    ULTRA_PROGRAM_BY_PHASE.set(phase.phase, descriptor);",
    "  }",
    "}",
    "if (ULTRA_PROGRAM_BY_PHASE.size !== 465) throw new Error(`Ultra program registry owns ${ULTRA_PROGRAM_BY_PHASE.size} phases, expected 465.`);",
    "",
    "export function getUltraProgramDescriptor(phase: UltraPhaseNumber): UltraProgramDescriptor {",
    "  const descriptor = ULTRA_PROGRAM_BY_PHASE.get(phase);",
    "  if (!descriptor) throw new Error(`No Ultra program owns phase ${phase}.`);",
    "  return descriptor;",
    "}",
    "",
    "export function runUltraProgramPhaseTest(phase: UltraPhaseNumber): UltraProgramPhaseTestResult {",
    "  return runUltraProgramDescriptorPhaseTest(getUltraProgramDescriptor(phase), phase);",
    "}",
    ""
  ].join("\n");
}

function renderDocs(phases) {
  const lines = [
    "# MineMotion Studio Ultra master plan — Phases 84–600",
    "",
    "> Status: source-level foundations and deterministic acceptance contracts. Visual quality, native installers, hardware performance, licensed datasets, third-party interoperability and publication still require external evidence.",
    "",
    `This instruction file defines **${phases.length} additional phases** from 84 through 600. Together with Phases 36–83, the Ultra registry contains **${phases.length + 48} phases**. Every phase has an explicit source owner, a unique deterministic acceptance test identifier and at least one fail-closed validation path.`,
    "",
    "## Engineering rules",
    "",
    "1. Preserve the single `MineMotionProject.ultra` authority; never create a parallel project store.",
    "2. Keep imported Minecraft worlds read-only and represent edits as reversible overlays.",
    "3. Require deterministic frame evaluation, bounded resources, explicit fallbacks and serializable state.",
    "4. A source-level pass is not a claim of visual, native, performance or release completion.",
    "5. Each phase must pass its named acceptance test before its state can become `validated`.",
    "",
    "## Roadmap",
    ""
  ];
  let currentProgram = "";
  for (const phase of phases) {
    if (phase.program !== currentProgram) {
      currentProgram = phase.program;
      lines.push(`### ${currentProgram}`, "", "| Phase | Objective | Source core | Acceptance gate |", "|---:|---|---|---|");
    }
    const deliverables = phase.deliverables.map((item) => item.replace(/\|/g, "\\|")).join("; ");
    lines.push(`| ${phase.number} — **${phase.title}** | ${phase.objective}<br><br>Core: ${deliverables} | \`${phase.sourceCore}\`<br>Inspiration: ${phase.inspiration}<br>Evidence: ${phase.evidence} | ${phase.gate}<br>Test: \`${phase.testId}\` |`);
  }
  lines.push("", "## Validation commands", "", "```bash", "npm run verify:ultra-roadmap", "npm run verify:ultra", "npm run verify:architecture", "npm run verify:docs", "```", "", "`verify:ultra` executes a dependency-independent source-contract assertion for every registered phase. The named fixture gate remains the promotion target, not an automatically satisfied product-quality claim. The full Vitest/Vite/Tauri matrix remains mandatory when the package registry and native toolchains are available.", "");
  return lines.join("\n");
}

const phases = buildRoadmap();
const testIds = new Set();
for (const phase of phases) {
  if (testIds.has(phase.testId)) throw new Error(`Duplicate Ultra acceptance test id ${phase.testId}.`);
  testIds.add(phase.testId);
}

const programEntries = PROGRAMS.map((group, index) => ({
  group,
  index,
  phases: phases.filter((phase) => phase.program === group.program)
}));
for (const entry of programEntries) {
  if (entry.phases.length !== 15) throw new Error(`Ultra program ${entry.group.program} owns ${entry.phases.length} phases, expected 15.`);
}

const json = JSON.stringify(phases, null, 2) + "\n";
const docs = renderDocs(phases);
const generatedOutputs = new Map([
  [outputJson, json],
  [outputDocs, docs],
  [outputProgramRegistry, renderProgramRegistry(programEntries)],
  ...programEntries.map((entry) => [path.join(outputProgramsDir, `${programFileStem(entry.group.program)}.ts`), renderProgramModule(entry.group, entry.phases, entry.index)])
]);
const generatedSourceCores = new Set(programEntries.map((entry) => programSourceCore(entry.group.program)));
await Promise.all([...new Set(phases.map((phase) => phase.sourceCore))].filter((sourceCore) => !generatedSourceCores.has(sourceCore)).map(async (sourceCore) => {
  try {
    await access(path.join(root, sourceCore));
  } catch {
    throw new Error(`Ultra roadmap source core does not exist: ${sourceCore}.`);
  }
}));

const verify = process.argv.includes("--verify");
if (verify) {
  await Promise.all([...generatedOutputs.entries()].map(async ([filePath, expected]) => {
    let existing;
    try {
      existing = await readFile(filePath, "utf8");
    } catch {
      throw new Error(`Ultra generated output is missing: ${path.relative(root, filePath)}.`);
    }
    if (existing !== expected) throw new Error(`Ultra generated output is stale: ${path.relative(root, filePath)}. Run npm run generate:ultra-roadmap.`);
  }));
  console.log(`Ultra roadmap verified: ${phases.length} phases, 84-${phases.at(-1).number}, ${programEntries.length} program engines.`);
} else {
  await mkdir(outputProgramsDir, { recursive: true });
  await Promise.all([...generatedOutputs.entries()].map(([filePath, content]) => writeFile(filePath, content)));
  console.log(`Ultra roadmap generated: ${phases.length} phases, 84-${phases.at(-1).number}, ${programEntries.length} program engines.`);
}
