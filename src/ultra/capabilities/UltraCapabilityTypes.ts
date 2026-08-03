import type { UltraBaseRecord } from "../UltraTypes";
import type { UltraArcId, UltraPhaseNumber } from "../UltraPhaseRegistry";

export type UltraCapabilityEvidence =
  | "deterministic"
  | "visual"
  | "performance"
  | "native"
  | "security"
  | "interoperability"
  | "workflow"
  | "reliability"
  | "accessibility";

export interface UltraCapabilityBudget {
  maximumOperations: number;
  maximumMemoryMb: number;
  maximumBackgroundTasks: number;
  maximumSerializedBytes: number;
}

export interface UltraCapabilityAcceptance {
  testId: string;
  fixture: string;
  deterministicSeed: number;
  assertions: string[];
}

export interface UltraCapabilityRecord extends UltraBaseRecord {
  phase: UltraPhaseNumber;
  arc: UltraArcId;
  program: string;
  objective: string;
  deliverables: string[];
  operators: string[];
  inputs: string[];
  outputs: string[];
  automationHooks: string[];
  fallbacks: string[];
  evidence: UltraCapabilityEvidence;
  sourceCore: string;
  inspiration: string;
  budget: UltraCapabilityBudget;
  acceptance: UltraCapabilityAcceptance;
  sourceFingerprint: string;
}

export interface UltraCapabilityExecutionStep {
  id: string;
  label: string;
  order: number;
  reversible: boolean;
  estimatedMemoryMb: number;
}

export interface UltraCapabilityExecutionPlan {
  phase: UltraPhaseNumber;
  recordId: string;
  steps: UltraCapabilityExecutionStep[];
  totalEstimatedMemoryMb: number;
  fingerprint: string;
}

export interface UltraCapabilityTestResult {
  phase: UltraPhaseNumber;
  testId: string;
  passed: boolean;
  assertions: number;
  errors: string[];
  fingerprint: string;
}
