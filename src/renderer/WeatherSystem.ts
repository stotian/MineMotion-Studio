import * as THREE from "three";
import type { LightingSettings } from "../lighting/LightingTypes";
import {
  MAX_WEATHER_PARTICLES,
  sampleWeatherParticle,
  weatherParticleCount
} from "../lighting/WeatherSimulation";
import { markSharedThreeResource } from "./ThreeResourceDisposal";

export class WeatherSystem {
  readonly object = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: "#dbe9ff",
      size: 0.08,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      sizeAttenuation: true
    })
  );

  private readonly positions = new Float32Array(MAX_WEATHER_PARTICLES * 3);
  private readonly positionAttribute = new THREE.BufferAttribute(this.positions, 3);

  constructor() {
    this.object.name = "Weather";
    this.object.frustumCulled = false;
    this.object.geometry.setAttribute("position", this.positionAttribute);
    this.object.geometry.setDrawRange(0, 0);
    markSharedThreeResource(this.object.geometry);
    markSharedThreeResource(this.object.material);
  }

  update(settings: LightingSettings, frame: number, visible = true): void {
    const count = weatherParticleCount({
      mode: settings.weather,
      intensity: settings.weatherIntensity,
      seed: settings.weatherSeed,
      windDirection: settings.windDirection,
      windSpeed: settings.windSpeed
    });
    this.object.visible = visible && count > 0;
    this.object.geometry.setDrawRange(0, count);
    if (!this.object.visible) return;

    const material = this.object.material as THREE.PointsMaterial;
    material.color.set(
      settings.weather === "snow"
        ? "#f4f7ff"
        : settings.weather === "storm"
          ? "#b9c9e0"
          : "#dbe9ff"
    );
    material.size = settings.weather === "snow" ? 0.18 : 0.075;
    material.opacity = settings.weather === "storm" ? 0.78 : 0.66;

    const simulation = {
      mode: settings.weather,
      intensity: settings.weatherIntensity,
      seed: settings.weatherSeed,
      windDirection: settings.windDirection,
      windSpeed: settings.windSpeed
    } as const;
    for (let index = 0; index < count; index += 1) {
      const sample = sampleWeatherParticle(index, frame, simulation);
      const offset = index * 3;
      this.positions[offset] = sample.position[0];
      this.positions[offset + 1] = sample.position[1];
      this.positions[offset + 2] = sample.position[2];
    }
    this.positionAttribute.needsUpdate = true;
  }

  dispose(): void {
    this.object.geometry.dispose();
    (this.object.material as THREE.Material).dispose();
  }
}
