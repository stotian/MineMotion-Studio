import {
  KNOWN_PLUGIN_PERMISSIONS,
  type PluginPermission
} from "./PluginPermissions";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minMineMotionVersion: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  entry: string;
  enabled: boolean;
  builtin?: boolean;
  experimental?: boolean;
}

export function validatePluginManifest(manifest: PluginManifest): string[] {
  const errors: string[] = [];
  if (!manifest.id) errors.push("Plugin id is required.");
  if (!manifest.name) errors.push("Plugin name is required.");
  if (!manifest.version) errors.push("Plugin version is required.");
  if (!manifest.minMineMotionVersion) {
    errors.push("Plugin minMineMotionVersion is required.");
  }
  for (const permission of manifest.permissions) {
    if (!KNOWN_PLUGIN_PERMISSIONS.includes(permission)) {
      errors.push(`Unknown plugin permission: ${permission}`);
    }
  }
  return errors;
}

