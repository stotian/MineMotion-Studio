import { createAudioMarker } from "../audio/AudioMarkers";
import { createBuiltinAudioClip } from "../audio/AudioClip";
import { getBuiltinSfx } from "../audio/BuiltinSfxRegistry";
import { spawnEffectAtFrame } from "../effects/EffectSpawner";
import { getLightingMoodPreset } from "../lighting/LightingPresets";
import { createProductionShot, createStoryboardCard } from "../production/ShotManager";
import type { MineMotionProject, Vector3Tuple } from "../project/ProjectFile";
import type { TemplateDependency } from "./TemplateTypes";
import { createCharacter, createInitialProject, createSceneCamera, updateProjectSettings } from "../project/ProjectStore";
import type { ProjectTemplate, TemplatePreviewMetadata } from "./TemplateTypes";

interface ProductionTemplateSpec {
  id: string;
  name: string;
  description: string;
  projectName: string;
  durationFrames: number;
  lighting: "clear-day" | "golden-hour" | "moonlit-night" | "horror-fog" | "storm-fight" | "anime-impact-lighting";
  preview: TemplatePreviewMetadata;
  markers: Array<{ frame: number; name: string; type: "dialogue" | "beat" | "action" | "sync" }>;
  effects: Array<{ frame: number; type: Parameters<typeof spawnEffectAtFrame>[0] }>;
  audio?: Array<{ frame: number; id: string; role?: "dialogue" | "sfx" | "music" | "ambience" }>;
  characters: Array<{ name: string; position: Vector3Tuple }>;
  cameras: Array<{ name: string; position: Vector3Tuple; rotation: Vector3Tuple; fov?: number }>;
  shotFrames: number[];
  resolution?: { width: number; height: number; aspectRatio: "16:9" | "2.35:1" | "1:1" | "9:16" };
  terrain?: "none" | "demo" | "flat" | "nether";
  tutorialId: string;
  tags: string[];
}

function createFromSpec(spec: ProductionTemplateSpec): MineMotionProject {
  let project = updateProjectSettings(createInitialProject(), {
    projectName: spec.projectName,
    durationFrames: spec.durationFrames,
    terrainPreset: spec.terrain ?? "demo"
  });
  const lightingPreset = getLightingMoodPreset(spec.lighting);
  const cameras = spec.cameras.map((entry, index) => ({
    ...createSceneCamera(entry.name),
    id: `template-camera-${spec.id}-${index + 1}`,
    active: index === 0,
    fov: entry.fov ?? 45,
    transform: {
      position: [...entry.position] as Vector3Tuple,
      rotation: [...entry.rotation] as Vector3Tuple,
      scale: [1, 1, 1] as Vector3Tuple
    }
  }));
  const characters = spec.characters.map((entry, index) => ({
    ...createCharacter(entry.name, entry.position),
    id: `template-character-${spec.id}-${index + 1}`
  }));
  const clips = (spec.audio ?? []).flatMap((entry) => {
    const definition = getBuiltinSfx(entry.id);
    if (!definition) return [];
    return [{ ...createBuiltinAudioClip(definition, entry.frame), role: entry.role ?? "sfx" }];
  });
  const effects = spec.effects.map((entry) => spawnEffectAtFrame(entry.type, entry.frame));
  project = {
    ...project,
    activeCameraId: cameras[0]?.id ?? project.activeCameraId,
    scene: {
      ...project.scene,
      cameras: cameras.length > 0 ? cameras : project.scene.cameras,
      characters
    },
    lighting: {
      ...lightingPreset.settings,
      sunDirection: [...lightingPreset.settings.sunDirection],
      moonDirection: [...lightingPreset.settings.moonDirection],
      windDirection: [...lightingPreset.settings.windDirection],
      keyframes: []
    },
    sky: { ...project.sky, preset: lightingPreset.skyPresetId },
    effects: { instances: effects },
    audio: {
      ...project.audio,
      clips,
      markers: spec.markers.map((entry) => createAudioMarker(entry.name, entry.frame, entry.type))
    },
    animation: {
      ...project.animation,
      durationFrames: spec.durationFrames,
      markers: spec.markers.map((entry, index) => ({ id: `template-marker-${spec.id}-${index + 1}`, name: entry.name, frame: entry.frame, color: entry.type === "dialogue" ? "#66b3ff" : entry.type === "beat" ? "#e7c45b" : entry.type === "action" ? "#f07878" : "#a78bfa", type: entry.type === "sync" ? "note" : entry.type }))
    },
    renderSettings: spec.resolution
      ? {
          ...project.renderSettings,
          resolutionPreset: "custom",
          customWidth: spec.resolution.width,
          customHeight: spec.resolution.height,
          aspectRatio: spec.resolution.aspectRatio
        }
      : project.renderSettings,
    exportSettings: {
      ...project.exportSettings,
      endFrame: spec.durationFrames,
      width: spec.resolution?.width ?? project.exportSettings.width,
      height: spec.resolution?.height ?? project.exportSettings.height,
      outputName: spec.id
    }
  };
  const boundaries = [...new Set([0, ...spec.shotFrames, spec.durationFrames])]
    .filter((frame) => frame >= 0 && frame <= spec.durationFrames)
    .sort((left, right) => left - right);
  const shots = boundaries.slice(0, -1).map((startFrame, index) => createProductionShot(project, {
    id: `template-shot-${spec.id}-${index + 1}`,
    name: `SH${String((index + 1) * 10).padStart(3, "0")}`,
    startFrame,
    endFrame: Math.max(startFrame, boundaries[index + 1] - 1),
    cameraId: cameras[index % Math.max(1, cameras.length)]?.id ?? project.activeCameraId,
    status: "ready",
    notes: `${spec.name} production shot ${index + 1}`,
    outputName: `${spec.id}-shot-${index + 1}`,
    outputFolder: spec.id,
    approved: false
  }));
  return {
    ...project,
    production: {
      ...project.production,
      shots,
      storyboard: shots.map((shot) => createStoryboardCard(shot, project.animation.fps)),
      activeShotId: shots[0]?.id ?? null,
      handoffRoot: `Exports/${spec.id}`
    }
  };
}

function template(spec: ProductionTemplateSpec): ProjectTemplate {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    category: spec.id === "dialogue-scene" || spec.id === "fight-scene" || spec.id === "chase-scene" || spec.id === "boss-battle" ? "animation" : spec.id === "horror-scene" ? "mood" : "cinematic",
    schemaVersion: 1,
    templateVersion: 1,
    preview: spec.preview,
    dependencies: ([
      { id: "minemotion-generated-rigs", kind: "generated", required: spec.characters.length > 0, description: "Generated block rig geometry; no Mojang texture is bundled." },
      { id: "minemotion-placeholder-audio", kind: "generated", required: (spec.audio?.length ?? 0) > 0, description: "Generated oscillator placeholders." },
      { id: "minemotion-builtin-vfx", kind: "builtin", required: spec.effects.length > 0, description: "MineMotion first-party procedural VFX presets." }
    ] satisfies TemplateDependency[]).filter((dependency) => dependency.required),
    estimatedSizeBytes: 24_000 + spec.characters.length * 4_000 + spec.effects.length * 2_000 + (spec.audio?.length ?? 0) * 1_000,
    license: "MineMotion-generated",
    attribution: "Generated by BlockMotion Studio from original procedural geometry and metadata. No Mojang/Microsoft assets included.",
    tutorialId: spec.tutorialId,
    tags: spec.tags,
    create: () => createFromSpec(spec)
  };
}

export const PRODUCTION_TEMPLATES: ProjectTemplate[] = [
  template({
    id: "dialogue-scene", name: "Dialogue Scene", description: "Two-character coverage with master, over-shoulder and reaction shots.", projectName: "Dialogue Scene", durationFrames: 240, lighting: "clear-day", terrain: "flat",
    preview: { accent: "#67a8ff", icon: "dialogue", aspectRatio: "16:9", summary: "Two actors · four shots · dialogue markers" },
    markers: [{ frame: 24, name: "Speaker A", type: "dialogue" }, { frame: 96, name: "Speaker B", type: "dialogue" }, { frame: 168, name: "Reaction", type: "action" }],
    effects: [], audio: [{ frame: 20, id: "magic-pulse", role: "dialogue" }],
    characters: [{ name: "Speaker A", position: [-1.2, 1.05, 0] }, { name: "Speaker B", position: [1.2, 1.05, 0] }],
    cameras: [{ name: "Master", position: [0, 3.2, 8], rotation: [-12, 0, 0], fov: 42 }, { name: "OTS A", position: [2.1, 2.3, 3.8], rotation: [-8, 18, 0], fov: 52 }, { name: "OTS B", position: [-2.1, 2.3, 3.8], rotation: [-8, -18, 0], fov: 52 }],
    shotFrames: [72, 132, 192], tutorialId: "tutorial-dialogue-basics", tags: ["dialogue", "coverage", "beginner"]
  }),
  template({
    id: "fight-scene", name: "Fight Scene", description: "Action blocking, impact timing, VFX and alternating camera coverage.", projectName: "Fight Scene", durationFrames: 180, lighting: "storm-fight",
    preview: { accent: "#ff665a", icon: "fight", aspectRatio: "16:9", summary: "Two fighters · impact beats · storm lighting" },
    markers: [{ frame: 36, name: "Wind-up", type: "action" }, { frame: 72, name: "Impact", type: "beat" }, { frame: 120, name: "Counter", type: "action" }],
    effects: [{ frame: 70, type: "speedLines" }, { frame: 72, type: "impactFrame" }, { frame: 73, type: "cameraShake" }, { frame: 120, type: "shockwave" }],
    audio: [{ frame: 70, id: "whoosh" }, { frame: 72, id: "impact-hit" }, { frame: 120, id: "deep-boom" }],
    characters: [{ name: "Fighter A", position: [-1.4, 1.05, 0] }, { name: "Fighter B", position: [1.4, 1.05, 0] }],
    cameras: [{ name: "Fight Wide", position: [0, 4, 10], rotation: [-14, 0, 0] }, { name: "Impact Close", position: [1, 2.2, 4], rotation: [-6, 10, 0], fov: 55 }],
    shotFrames: [60, 96, 144], tutorialId: "tutorial-action-timing", tags: ["fight", "action", "vfx"]
  }),
  template({
    id: "horror-scene", name: "Horror Scene", description: "Slow reveal, dense fog, restrained camera and tension markers.", projectName: "Horror Scene", durationFrames: 300, lighting: "horror-fog",
    preview: { accent: "#657080", icon: "horror", aspectRatio: "2.35:1", summary: "Fog · reveal beat · handheld tension" },
    markers: [{ frame: 80, name: "Distant sound", type: "sync" }, { frame: 180, name: "Reveal", type: "action" }, { frame: 240, name: "Cut", type: "beat" }],
    effects: [{ frame: 150, type: "fogPulse" }, { frame: 178, type: "vignettePulse" }, { frame: 180, type: "flash" }],
    audio: [{ frame: 72, id: "camera-rumble", role: "ambience" }, { frame: 180, id: "glitch-pop" }],
    characters: [{ name: "Explorer", position: [0, 1.05, 0] }, { name: "Silhouette", position: [0, 1.05, -6] }],
    cameras: [{ name: "Horror Dolly", position: [0, 2.4, 8], rotation: [-5, 0, 0], fov: 38 }],
    shotFrames: [120, 210], tutorialId: "tutorial-horror-lighting", tags: ["horror", "fog", "mood"]
  }),
  template({
    id: "chase-scene", name: "Chase Scene", description: "Fast camera changes, speed cues and pursuit staging.", projectName: "Chase Scene", durationFrames: 240, lighting: "golden-hour",
    preview: { accent: "#ffb24a", icon: "chase", aspectRatio: "16:9", summary: "Tracking cameras · speed lines · pursuit beats" },
    markers: [{ frame: 30, name: "Start", type: "action" }, { frame: 100, name: "Obstacle", type: "beat" }, { frame: 190, name: "Escape", type: "action" }],
    effects: [{ frame: 30, type: "speedLines" }, { frame: 100, type: "cameraShake" }, { frame: 190, type: "glowBurst" }],
    audio: [{ frame: 30, id: "whoosh" }, { frame: 100, id: "impact-hit" }, { frame: 190, id: "magic-pulse" }],
    characters: [{ name: "Runner", position: [0, 1.05, 0] }, { name: "Pursuer", position: [0, 1.05, -4] }],
    cameras: [{ name: "Tracking", position: [4, 2.5, 7], rotation: [-8, 25, 0], fov: 58 }, { name: "Low Chase", position: [0, 1.3, 5], rotation: [0, 0, 0], fov: 68 }],
    shotFrames: [72, 144, 204], tutorialId: "tutorial-camera-chase", tags: ["chase", "camera", "speed"]
  }),
  template({
    id: "boss-battle", name: "Boss Battle", description: "Large-scale confrontation with reveal, attack and finishing beats.", projectName: "Boss Battle", durationFrames: 360, lighting: "anime-impact-lighting",
    preview: { accent: "#d36cff", icon: "boss", aspectRatio: "16:9", summary: "Boss reveal · multi-pass VFX · five shots" },
    markers: [{ frame: 48, name: "Boss reveal", type: "action" }, { frame: 144, name: "Attack", type: "beat" }, { frame: 252, name: "Finisher", type: "action" }],
    effects: [{ frame: 48, type: "lightningStrike" }, { frame: 144, type: "shockwave" }, { frame: 145, type: "cameraShake" }, { frame: 252, type: "impactFrame" }, { frame: 254, type: "glowBurst" }],
    audio: [{ frame: 48, id: "lightning-crack" }, { frame: 144, id: "deep-boom" }, { frame: 252, id: "impact-hit" }],
    characters: [{ name: "Hero", position: [0, 1.05, 2] }, { name: "Generated Boss", position: [0, 2.5, -4] }],
    cameras: [{ name: "Boss Establishing", position: [0, 6, 14], rotation: [-18, 0, 0], fov: 38 }, { name: "Hero Low", position: [0, 1.6, 5], rotation: [8, 0, 0], fov: 58 }, { name: "Impact", position: [3, 3, 7], rotation: [-8, 20, 0], fov: 52 }],
    shotFrames: [72, 144, 216, 288], tutorialId: "tutorial-boss-production", tags: ["boss", "advanced", "vfx"]
  }),
  template({
    id: "trailer-scene", name: "Trailer", description: "Nine-beat trailer structure with title, escalation and final sting.", projectName: "Trailer", durationFrames: 480, lighting: "golden-hour",
    preview: { accent: "#f0d373", icon: "trailer", aspectRatio: "2.35:1", summary: "Nine beats · cinematic bars · render naming" },
    markers: [{ frame: 24, name: "Cold open", type: "beat" }, { frame: 144, name: "Escalation", type: "action" }, { frame: 336, name: "Title", type: "sync" }, { frame: 432, name: "Sting", type: "beat" }],
    effects: [{ frame: 144, type: "speedLines" }, { frame: 336, type: "flash" }, { frame: 432, type: "impactFrame" }],
    audio: [{ frame: 24, id: "camera-rumble", role: "music" }, { frame: 144, id: "whoosh" }, { frame: 432, id: "deep-boom" }],
    characters: [{ name: "Trailer Hero", position: [0, 1.05, 0] }],
    cameras: [{ name: "Trailer Wide", position: [7, 5, 10], rotation: [-18, 34, 0], fov: 40 }, { name: "Trailer Close", position: [0, 2.2, 4], rotation: [-5, 0, 0], fov: 58 }],
    shotFrames: [60, 120, 180, 240, 300, 360, 420], tutorialId: "tutorial-trailer-edit", tags: ["trailer", "cinematic", "advanced"]
  }),
  template({
    id: "thumbnail-scene", name: "Thumbnail", description: "Single-frame composition with strong lighting and transparent-ready output.", projectName: "Thumbnail", durationFrames: 1, lighting: "anime-impact-lighting", terrain: "none",
    preview: { accent: "#55e0b8", icon: "thumbnail", aspectRatio: "16:9", summary: "Single frame · hero framing · PNG output" },
    markers: [{ frame: 0, name: "Hero frame", type: "sync" }], effects: [{ frame: 0, type: "glowBurst" }],
    characters: [{ name: "Thumbnail Hero", position: [0, 1.05, 0] }], cameras: [{ name: "Thumbnail Camera", position: [0, 2.5, 5], rotation: [-8, 0, 0], fov: 52 }],
    shotFrames: [], tutorialId: "tutorial-thumbnail", tags: ["thumbnail", "still", "starter"]
  }),
  template({
    id: "vertical-short", name: "Vertical Short", description: "9:16 short-form setup with safe pacing and vertical composition.", projectName: "Vertical Short", durationFrames: 240, lighting: "clear-day",
    preview: { accent: "#ff6fae", icon: "vertical", aspectRatio: "9:16", summary: "1080×1920 · vertical safe frame · short pacing" },
    markers: [{ frame: 0, name: "Hook", type: "beat" }, { frame: 72, name: "Payoff", type: "action" }, { frame: 180, name: "Loop point", type: "sync" }],
    effects: [{ frame: 0, type: "flash" }, { frame: 72, type: "impactFrame" }], audio: [{ frame: 0, id: "glitch-pop" }, { frame: 72, id: "impact-hit" }],
    characters: [{ name: "Vertical Hero", position: [0, 1.05, 0] }], cameras: [{ name: "Vertical Camera", position: [0, 2.8, 6], rotation: [-10, 0, 0], fov: 42 }],
    shotFrames: [60, 120, 180], resolution: { width: 1080, height: 1920, aspectRatio: "9:16" }, tutorialId: "tutorial-vertical", tags: ["vertical", "short", "social"]
  })
];
