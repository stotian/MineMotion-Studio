export const MINEMOTION_PLUGIN_API_VERSION = "1.0" as const;
export type MineMotionPermission =
  | "registerCommands" | "registerTemplates" | "registerPresets"
  | "registerEffects" | "registerRigs" | "registerGenerators"
  | "registerImporters" | "registerExporters" | "registerLocalization"
  | "registerValidators" | "registerSettingsPages";

export interface MineMotionDependency { id: string; version: string; optional?: boolean; }
export interface MineMotionLicense { id: string; url?: string; attribution?: string; }
export interface LogicPluginManifest {
  kind: "logic-plugin";
  id: string;
  name: string;
  version: string;
  apiVersion: typeof MINEMOTION_PLUGIN_API_VERSION;
  minMineMotionVersion: string;
  maxTestedMineMotionVersion?: string;
  author: string;
  description: string;
  entry: string;
  permissions: MineMotionPermission[];
  dependencies: MineMotionDependency[];
  capabilities: string[];
  license: MineMotionLicense;
}
export interface CameraPresetData {
  id: string; name: string; description: string; fov: number;
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
}
export interface SafeContentPackManifest {
  kind: "content-pack";
  id: string;
  name: string;
  version: string;
  apiVersion: typeof MINEMOTION_PLUGIN_API_VERSION;
  minMineMotionVersion: string;
  maxTestedMineMotionVersion?: string;
  author: string;
  description: string;
  license: MineMotionLicense;
  dependencies: MineMotionDependency[];
  capabilities: string[];
  data: {
    cameraPresets?: CameraPresetData[];
    vfxPresets?: unknown[];
    poses?: unknown[];
    animations?: unknown[];
    localization?: Record<string, Record<string, string>>;
    textures?: Array<{ path: string; mimeType: "image/png" | "image/jpeg" | "image/webp"; dataUrl: string }>;
    resourceMappings?: Record<string, string>;
  };
}
export interface SandboxInvocation { id: string; type: "invoke"; capability: string; payload: unknown; }
export interface SandboxResult { id: string; ok: boolean; payload?: unknown; error?: string; }
export function defineContentPack<T extends SafeContentPackManifest>(pack: T): T { return pack; }
export function defineLogicPlugin<T extends LogicPluginManifest>(manifest: T): T { return manifest; }
