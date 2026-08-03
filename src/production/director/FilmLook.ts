import { getLightingMoodPreset } from "../../lighting/LightingPresets";
import type { LightingMoodPresetId } from "../../lighting/LightingTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { getPostProcessingPreset } from "../../rendering/postprocessing/PostProcessingPresets";
import type { PostProcessingPresetId } from "../../rendering/postprocessing/PostProcessingTypes";

export const FILM_LOOK_IDS = [
  "adventure-day",
  "golden-epic",
  "horror-night",
  "storm-battle",
  "nether-war",
  "end-mystery",
  "anime-impact",
  "dream-magic",
  "noir-drama"
] as const;
export type FilmLookId = (typeof FILM_LOOK_IDS)[number];

export interface FilmLookDefinition {
  id: FilmLookId;
  name: string;
  description: string;
  lightingPresetId: LightingMoodPresetId;
  postPresetId: PostProcessingPresetId;
  cinematicBars: boolean;
  aspectRatio: MineMotionProject["renderSettings"]["aspectRatio"];
}

export const FILM_LOOKS: readonly FilmLookDefinition[] = Object.freeze([
  look("adventure-day", "Adventure Day", "Clean daylight for readable Minecraft exploration.", "clear-day", "clean-preview", false, "16:9"),
  look("golden-epic", "Golden Epic", "Warm sunset atmosphere for heroic reveals.", "golden-hour", "cinematic-warm", true, "2.35:1"),
  look("horror-night", "Horror Night", "Dense moonlit fog for suspense and horror.", "horror-fog", "dark-horror", true, "2.35:1"),
  look("storm-battle", "Storm Battle", "Cold storm contrast for large action scenes.", "storm-fight", "stormy-contrast", true, "2.35:1"),
  look("nether-war", "Nether War", "Hot emissive reds for Nether combat.", "nether-heat", "nether-heat", true, "2.35:1"),
  look("end-mystery", "End Mystery", "Violet void lighting for surreal End scenes.", "end-void", "end-void", true, "2.35:1"),
  look("anime-impact", "Anime Impact", "Bright high-contrast lighting for stylized fights.", "anime-impact-lighting", "anime-impact", true, "2.35:1"),
  look("dream-magic", "Dream Magic", "Soft bloom and golden light for magical sequences.", "golden-hour", "dream-glow", true, "2.35:1"),
  look("noir-drama", "Noir Drama", "High-contrast monochrome framing for dramatic dialogue.", "moonlit-night", "noir", true, "2.35:1")
]);

export function applyFilmLook(
  project: MineMotionProject,
  lookId: FilmLookId
): MineMotionProject {
  const definition = getFilmLook(lookId);
  const lighting = getLightingMoodPreset(definition.lightingPresetId);
  const post = getPostProcessingPreset(definition.postPresetId);
  return {
    ...project,
    sky: {
      ...project.sky,
      preset: lighting.skyPresetId
    },
    lighting: {
      ...lighting.settings,
      sunDirection: [...lighting.settings.sunDirection],
      moonDirection: [...lighting.settings.moonDirection],
      windDirection: [...lighting.settings.windDirection],
      keyframes: [...project.lighting.keyframes]
    },
    postProcessing: {
      ...post.settings,
      presetId: post.id
    },
    renderSettings: {
      ...project.renderSettings,
      resolutionPreset: "1080p",
      customWidth: 1920,
      customHeight: 1080,
      aspectRatio: definition.aspectRatio,
      cinematicBarsEnabled: definition.cinematicBars,
      cinematicBarsRatio: definition.aspectRatio === "2.35:1" ? "2.35:1" : "16:9",
      renderPreviewEnabled: true
    },
    exportSettings: {
      ...project.exportSettings,
      width: 1920,
      height: 1080,
      includeCinematicBars: definition.cinematicBars,
      includePostProcessing: true,
      includeVfx: true
    },
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString()
    }
  };
}

export function getFilmLook(id: FilmLookId): FilmLookDefinition {
  return FILM_LOOKS.find((look) => look.id === id) ?? FILM_LOOKS[0];
}

function look(
  id: FilmLookId,
  name: string,
  description: string,
  lightingPresetId: LightingMoodPresetId,
  postPresetId: PostProcessingPresetId,
  cinematicBars: boolean,
  aspectRatio: FilmLookDefinition["aspectRatio"]
): FilmLookDefinition {
  return { id, name, description, lightingPresetId, postPresetId, cinematicBars, aspectRatio };
}
