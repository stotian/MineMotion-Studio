import type { CameraPreset } from "../presets/CameraPresets";

export const MINEMOTION_PLUGIN_API_VERSION = "1.0" as const;
export type ExtensionKind = "content-pack" | "logic-plugin";
export type ExtensionTrust = "builtin" | "local-untrusted" | "local-trusted";

export interface ExtensionDependency {
  id: string;
  version: string;
  optional?: boolean;
}

export interface ExtensionLicenseMetadata {
  id: string;
  url?: string;
  attribution?: string;
}

export interface SafeProjectTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: "starter" | "animation" | "cinematic" | "mood";
  project: unknown;
}

export interface SafeContentPackData {
  cameraPresets?: CameraPreset[];
  templates?: SafeProjectTemplateDefinition[];
  vfxPresets?: unknown[];
  poses?: unknown[];
  animations?: unknown[];
  localization?: Record<string, Record<string, string>>;
  textures?: Array<{ path: string; mimeType: string; dataUrl: string }>;
  resourceMappings?: Record<string, string>;
}

export interface SafeContentPack {
  kind: "content-pack";
  id: string;
  name: string;
  version: string;
  apiVersion: typeof MINEMOTION_PLUGIN_API_VERSION;
  minMineMotionVersion: string;
  maxTestedMineMotionVersion?: string;
  author: string;
  description: string;
  license: ExtensionLicenseMetadata;
  dependencies: ExtensionDependency[];
  capabilities: string[];
  data: SafeContentPackData;
}

export interface ExtensionLogEntry {
  id: string;
  extensionId: string;
  level: "info" | "warning" | "error";
  message: string;
  createdAt: string;
}
