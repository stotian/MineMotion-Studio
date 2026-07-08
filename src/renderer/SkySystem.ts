import * as THREE from "three";

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

export const SKY_PRESETS: Record<SkyPresetId, SkyPreset> = {
  Day: {
    id: "Day",
    label: "Day",
    background: "#87bfff",
    fog: "#b9dcff",
    ambientIntensity: 0.7,
    directionalIntensity: 1.15,
    directionalColor: "#fff7df"
  },
  Sunset: {
    id: "Sunset",
    label: "Sunset",
    background: "#ff9f6f",
    fog: "#f6b483",
    ambientIntensity: 0.48,
    directionalIntensity: 0.92,
    directionalColor: "#ffd0a6"
  },
  Night: {
    id: "Night",
    label: "Night",
    background: "#0c1024",
    fog: "#11162d",
    ambientIntensity: 0.25,
    directionalIntensity: 0.35,
    directionalColor: "#8fa8ff"
  },
  Storm: {
    id: "Storm",
    label: "Storm",
    background: "#343946",
    fog: "#59606f",
    ambientIntensity: 0.42,
    directionalIntensity: 0.45,
    directionalColor: "#c9d3e5"
  },
  Nether: {
    id: "Nether",
    label: "Nether",
    background: "#3b1010",
    fog: "#5b1914",
    ambientIntensity: 0.55,
    directionalIntensity: 0.25,
    directionalColor: "#ff8e64"
  },
  End: {
    id: "End",
    label: "End",
    background: "#14101c",
    fog: "#231a2c",
    ambientIntensity: 0.5,
    directionalIntensity: 0.5,
    directionalColor: "#dccdff"
  },
  Custom: {
    id: "Custom",
    label: "Custom Color",
    background: "#87bfff",
    fog: "#87bfff",
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    directionalColor: "#ffffff"
  }
};

export class SkySystem {
  static apply(
    scene: THREE.Scene,
    ambient: THREE.AmbientLight,
    directional: THREE.DirectionalLight,
    presetId: SkyPresetId,
    customColor: string
  ): void {
    const preset = SKY_PRESETS[presetId];
    const background = presetId === "Custom" ? customColor : preset.background;
    const fog = presetId === "Custom" ? customColor : preset.fog;

    scene.background = new THREE.Color(background);
    scene.fog = new THREE.Fog(new THREE.Color(fog), 32, 86);
    ambient.intensity = preset.ambientIntensity;
    directional.intensity = preset.directionalIntensity;
    directional.color = new THREE.Color(preset.directionalColor);
  }
}

