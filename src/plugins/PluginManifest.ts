import { MINEMOTION_PLUGIN_API_VERSION, type ExtensionDependency, type ExtensionLicenseMetadata } from "./ExtensionTypes";
import {
  KNOWN_PLUGIN_PERMISSIONS,
  type PluginPermission
} from "./PluginPermissions";

export interface PluginManifest {
  kind?: "logic-plugin";
  apiVersion?: string;
  id: string;
  name: string;
  version: string;
  minMineMotionVersion: string;
  maxTestedMineMotionVersion?: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  dependencies?: ExtensionDependency[];
  capabilities?: string[];
  license?: ExtensionLicenseMetadata;
  localization?: Record<string, Record<string, string>>;
  entry: string;
  enabled: boolean;
  builtin?: boolean;
  experimental?: boolean;
}

export function validatePluginManifest(manifest: PluginManifest): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9][a-z0-9._-]{2,80}$/.test(manifest.id)) errors.push("Plugin id is invalid.");
  if (!manifest.name) errors.push("Plugin name is required.");
  if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(manifest.version)) errors.push("Plugin version must use semantic versioning.");
  if ((manifest.apiVersion ?? MINEMOTION_PLUGIN_API_VERSION) !== MINEMOTION_PLUGIN_API_VERSION) errors.push(`Unsupported plugin API version: ${manifest.apiVersion}.`);
  if (!manifest.minMineMotionVersion) {
    errors.push("Plugin minMineMotionVersion is required.");
  }
  if (!Array.isArray(manifest.permissions)) errors.push("Plugin permissions must be an array.");
  for (const permission of manifest.permissions ?? []) {
    if (!KNOWN_PLUGIN_PERMISSIONS.includes(permission)) {
      errors.push(`Unknown plugin permission: ${permission}`);
    }
  }
  if (/^(?:[a-z]:|[/\\])|\.\./i.test(manifest.entry)) errors.push("Plugin entry path is unsafe.");
  for (const capability of manifest.capabilities ?? []) {
    if (["filesystem.unrestricted", "process.execute", "environment.read", "secrets.read", "network.unrestricted", "native.eval"].includes(capability)) errors.push(`Prohibited plugin capability: ${capability}`);
  }
  return errors;
}

