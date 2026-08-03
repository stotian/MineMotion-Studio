export const RENDERER_BACKEND_POLICY_VERSION = 1 as const;

export type ProductionRendererBackend = "webgl2" | "webgl";
export type RendererBackendPlanStatus = "ready" | "fallback" | "unavailable";

export interface RendererBackendProbe {
  readonly webgl: boolean;
  readonly webgl2: boolean;
  readonly webgpu: boolean;
}

export interface RendererBackendPlan {
  readonly version: typeof RENDERER_BACKEND_POLICY_VERSION;
  readonly status: RendererBackendPlanStatus;
  readonly productionBackend: ProductionRendererBackend | null;
  readonly fallbackBackend: ProductionRendererBackend | null;
  readonly experimentalWebGpuDetected: boolean;
  readonly experimentalWebGpuSelected: false;
  readonly message:
    | "webgl2-primary"
    | "webgl-fallback"
    | "webgpu-detected-without-production-backend"
    | "no-supported-renderer";
}

export function createRendererBackendPlan(
  probe: RendererBackendProbe
): RendererBackendPlan {
  if (probe.webgl2) {
    return plan({
      status: "ready",
      productionBackend: "webgl2",
      fallbackBackend: probe.webgl ? "webgl" : null,
      experimentalWebGpuDetected: probe.webgpu,
      message: "webgl2-primary"
    });
  }
  if (probe.webgl) {
    return plan({
      status: "fallback",
      productionBackend: "webgl",
      fallbackBackend: null,
      experimentalWebGpuDetected: probe.webgpu,
      message: "webgl-fallback"
    });
  }
  return plan({
    status: "unavailable",
    productionBackend: null,
    fallbackBackend: null,
    experimentalWebGpuDetected: probe.webgpu,
    message: probe.webgpu
      ? "webgpu-detected-without-production-backend"
      : "no-supported-renderer"
  });
}

function plan(
  value: Omit<RendererBackendPlan, "version" | "experimentalWebGpuSelected">
): RendererBackendPlan {
  return Object.freeze({
    version: RENDERER_BACKEND_POLICY_VERSION,
    ...value,
    experimentalWebGpuSelected: false
  });
}
