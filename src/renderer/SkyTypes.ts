export type SkyPresetId =
  | "Day"
  | "Sunset"
  | "Night"
  | "Storm"
  | "Nether"
  | "End"
  | "Custom";

export interface SkyPreset {
  id: SkyPresetId;
  label: string;
  background: string;
  fog: string;
  ambientIntensity: number;
  directionalIntensity: number;
  directionalColor: string;
}
