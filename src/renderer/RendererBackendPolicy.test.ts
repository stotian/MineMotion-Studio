import { describe, expect, it } from "vitest";
import { createRendererBackendPlan } from "./RendererBackendPolicy";

describe("renderer backend policy", () => {
  it("keeps WebGL2 production-primary even when WebGPU is detected", () => {
    expect(createRendererBackendPlan({
      webgl: true,
      webgl2: true,
      webgpu: true
    })).toEqual({
      version: 1,
      status: "ready",
      productionBackend: "webgl2",
      fallbackBackend: "webgl",
      experimentalWebGpuDetected: true,
      experimentalWebGpuSelected: false,
      message: "webgl2-primary"
    });
  });

  it("uses the existing WebGL fallback without claiming WebGPU parity", () => {
    expect(createRendererBackendPlan({
      webgl: true,
      webgl2: false,
      webgpu: true
    })).toMatchObject({
      status: "fallback",
      productionBackend: "webgl",
      experimentalWebGpuSelected: false,
      message: "webgl-fallback"
    });
  });

  it("fails closed when only experimental WebGPU is detected", () => {
    expect(createRendererBackendPlan({
      webgl: false,
      webgl2: false,
      webgpu: true
    })).toEqual({
      version: 1,
      status: "unavailable",
      productionBackend: null,
      fallbackBackend: null,
      experimentalWebGpuDetected: true,
      experimentalWebGpuSelected: false,
      message: "webgpu-detected-without-production-backend"
    });
  });
});
