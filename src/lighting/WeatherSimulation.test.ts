import { describe, expect, it } from "vitest";
import {
  sampleWeatherParticle,
  weatherParticleCount
} from "./WeatherSimulation";

const storm = {
  mode: "storm" as const,
  intensity: 0.8,
  seed: 42,
  windDirection: [1, 0, 0.25] as [number, number, number],
  windSpeed: 2
};

describe("WeatherSimulation", () => {
  it("is deterministic for the same seed, frame and particle", () => {
    expect(sampleWeatherParticle(17, 90, storm)).toEqual(
      sampleWeatherParticle(17, 90, storm)
    );
  });

  it("changes particle positions over time without changing the source settings", () => {
    const first = sampleWeatherParticle(3, 0, storm);
    const later = sampleWeatherParticle(3, 12, storm);

    expect(later.position).not.toEqual(first.position);
    expect(storm.seed).toBe(42);
  });

  it("uses conservative bounded particle counts", () => {
    expect(weatherParticleCount({ ...storm, mode: "clear" })).toBe(0);
    expect(weatherParticleCount({ ...storm, intensity: 5 }, 100)).toBe(100);
    expect(weatherParticleCount({ ...storm, intensity: -1 }, 100)).toBe(0);
  });
});
