import type { LightingMoodPreset, LightingMoodPresetId, LightingSettings } from "./LightingTypes";

const BASE_LIGHTING: LightingSettings = {
  presetId: "clear-day",
  sunDirection: [0.42, 0.82, 0.38],
  sunColor: "#fff4d6",
  sunIntensity: 1.15,
  moonDirection: [-0.42, 0.72, -0.34],
  moonColor: "#9eb7ff",
  moonIntensity: 0.28,
  ambientColor: "#dcecff",
  ambientIntensity: 0.68,
  shadowsEnabled: true,
  fogColor: "#b9dcff",
  fogDensity: 0.004,
  fogNear: 32,
  fogFar: 112,
  timeOfDay: 12,
  animateTimeOfDay: false,
  dayLengthFrames: 720,
  weather: "clear",
  weatherIntensity: 0,
  weatherSeed: 1337,
  windDirection: [0.72, 0, 0.3],
  windSpeed: 0.45,
  keyframes: []
};

export const LIGHTING_MOOD_PRESETS: LightingMoodPreset[] = [
  mood("clear-day", "Clear Day", "Neutral daylight with clean Minecraft colors.", "Day", "clean-preview", {}),
  mood("golden-hour", "Golden Hour", "Low warm sun with cinematic haze.", "Sunset", "cinematic-warm", {
    sunDirection: [0.78, 0.28, 0.34],
    sunColor: "#ffd08a",
    sunIntensity: 0.98,
    ambientColor: "#ffcfb0",
    ambientIntensity: 0.48,
    fogColor: "#e9a875",
    fogDensity: 0.009,
    timeOfDay: 18.2
  }),
  mood("moonlit-night", "Moonlit Night", "Cool moonlight with restrained ambient fill.", "Night", "end-void", {
    moonDirection: [-0.42, 0.72, -0.34],
    moonColor: "#9eb7ff",
    moonIntensity: 0.42,
    ambientColor: "#50638f",
    ambientIntensity: 0.34,
    fogColor: "#151c35",
    fogDensity: 0.007,
    timeOfDay: 23
  }),
  mood("horror-fog", "Horror Fog", "Dense cold fog and weak directional light.", "Night", "dark-horror", {
    moonDirection: [0.2, 0.36, -0.6],
    moonColor: "#a8b3c2",
    moonIntensity: 0.22,
    ambientColor: "#45505c",
    ambientIntensity: 0.2,
    fogColor: "#252c31",
    fogDensity: 0.035,
    fogNear: 8,
    fogFar: 42,
    timeOfDay: 2
  }),
  mood("nether-heat", "Nether Heat", "Hot emissive atmosphere for Nether scenes.", "Nether", "nether-heat", {
    sunDirection: [0.35, 0.5, 0.25],
    sunColor: "#ff7a3d",
    sunIntensity: 0.55,
    moonColor: "#ff6a3d",
    moonIntensity: 0.45,
    ambientColor: "#b63825",
    ambientIntensity: 0.58,
    fogColor: "#6e1c16",
    fogDensity: 0.023,
    fogNear: 10,
    fogFar: 54,
    timeOfDay: 16
  }),
  mood("end-void", "End Void", "Low violet ambience with long-range void fog.", "End", "end-void", {
    moonDirection: [-0.32, 0.58, 0.42],
    moonColor: "#dac9ff",
    moonIntensity: 0.52,
    ambientColor: "#71618a",
    ambientIntensity: 0.46,
    fogColor: "#21182b",
    fogDensity: 0.012,
    timeOfDay: 21
  }),
  mood("storm-fight", "Storm Fight", "Hard cold light for action under storm clouds.", "Storm", "stormy-contrast", {
    sunDirection: [0.62, 0.7, -0.2],
    sunColor: "#d7e3ff",
    sunIntensity: 0.68,
    moonColor: "#b8c8e8",
    moonIntensity: 0.32,
    ambientColor: "#7d8999",
    ambientIntensity: 0.36,
    fogColor: "#596472",
    fogDensity: 0.015,
    timeOfDay: 14,
    weather: "storm",
    weatherIntensity: 0.86,
    windSpeed: 2.4
  }),
  mood("anime-impact-lighting", "Anime Impact Lighting", "Bright key light and sharp contrast for impact frames.", "Day", "anime-impact", {
    sunDirection: [0.25, 0.92, 0.18],
    sunColor: "#ffffff",
    sunIntensity: 1.8,
    ambientColor: "#dbe8ff",
    ambientIntensity: 0.72,
    fogColor: "#eaf3ff",
    fogDensity: 0,
    timeOfDay: 12
  })
];

export const DEFAULT_LIGHTING_SETTINGS: LightingSettings = {
  ...LIGHTING_MOOD_PRESETS[0].settings,
  sunDirection: [...LIGHTING_MOOD_PRESETS[0].settings.sunDirection],
  moonDirection: [...LIGHTING_MOOD_PRESETS[0].settings.moonDirection],
  windDirection: [...LIGHTING_MOOD_PRESETS[0].settings.windDirection],
  keyframes: []
};

export function getLightingMoodPreset(id: LightingMoodPresetId): LightingMoodPreset {
  return LIGHTING_MOOD_PRESETS.find((preset) => preset.id === id) ?? LIGHTING_MOOD_PRESETS[0];
}

function mood(
  id: LightingMoodPresetId,
  name: string,
  description: string,
  skyPresetId: LightingMoodPreset["skyPresetId"],
  postPresetId: LightingMoodPreset["postPresetId"],
  patch: Partial<LightingSettings>
): LightingMoodPreset {
  return {
    id,
    name,
    description,
    skyPresetId,
    postPresetId,
    settings: {
      ...BASE_LIGHTING,
      ...patch,
      presetId: id,
      sunDirection: patch.sunDirection ? [...patch.sunDirection] : [...BASE_LIGHTING.sunDirection],
      moonDirection: patch.moonDirection ? [...patch.moonDirection] : [...BASE_LIGHTING.moonDirection],
      windDirection: patch.windDirection ? [...patch.windDirection] : [...BASE_LIGHTING.windDirection],
      keyframes: []
    }
  };
}
