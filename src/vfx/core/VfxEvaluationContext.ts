// Phase 14 already established these service-level contracts. Re-export them
// here so VFX code has one local import path without creating duplicate types.
export type {
  VfxEvaluationContext,
  VfxQuality
} from "../../core/services/EngineServices";
