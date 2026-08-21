import * as THREE from "three";
import type { LightingSettings, ResolvedLightingState } from "../lighting/LightingTypes";
import { resolveLightingAtFrame } from "../lighting/LightingController";
import { SKY_PRESETS, type SkyPreset, type SkyPresetId } from "./SkyTypes";
export type { SkyPreset, SkyPresetId } from "./SkyTypes";
export { SKY_PRESETS } from "./SkyTypes";

export class SkySystem {
  static apply(
    scene: THREE.Scene,
    ambient: THREE.AmbientLight,
    directional: THREE.DirectionalLight,
    presetId: SkyPresetId,
    customColor: string,
    lighting?: LightingSettings,
    frame = 0
  ): ResolvedLightingState | null {
    const preset = SKY_PRESETS[presetId];
    const resolved = lighting ? resolveLightingAtFrame(lighting, frame) : null;
    const useResolvedBackground = resolved &&
      (resolved.animateTimeOfDay || resolved.weather !== "clear");
    const background = useResolvedBackground
      ? resolved.backgroundColor
      : presetId === "Custom"
        ? customColor
        : preset.background;
    const fog = resolved?.fogColor ?? (presetId === "Custom" ? customColor : preset.fog);

    scene.background = new THREE.Color(background);
    scene.fog = resolved
      ? resolved.fogDensity > 0
        ? new THREE.FogExp2(new THREE.Color(fog), resolved.fogDensity)
        : null
      : new THREE.Fog(new THREE.Color(fog), 32, 86);
    ambient.intensity = resolved?.ambientIntensity ?? preset.ambientIntensity;
    ambient.color = new THREE.Color(resolved?.ambientColor ?? "#ffffff");
    directional.intensity = resolved?.sunIntensity ?? preset.directionalIntensity;
    directional.color = new THREE.Color(
      resolved?.sunColor ?? preset.directionalColor
    );
    if (resolved) {
      directional.position.set(...resolved.sunDirection).normalize().multiplyScalar(48);
      directional.castShadow = resolved.shadowsEnabled;
    }
    return resolved;
  }
}
