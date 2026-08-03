import type { PluginPermission } from "./PluginPermissions";

export const PROHIBITED_PLUGIN_CAPABILITIES = Object.freeze([
  "filesystem.unrestricted",
  "process.execute",
  "environment.read",
  "secrets.read",
  "network.unrestricted",
  "native.eval"
] as const);

export interface PluginSecurityDecision {
  allowed: boolean;
  requiresExplicitTrust: boolean;
  errors: string[];
  warnings: string[];
}

export function evaluatePluginSecurity(input: {
  builtin: boolean;
  trusted: boolean;
  permissions: readonly PluginPermission[];
  capabilities?: readonly string[];
  safeMode: boolean;
}): PluginSecurityDecision {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.safeMode && !input.builtin) errors.push("External extensions are disabled in safe mode.");
  for (const capability of input.capabilities ?? []) {
    if ((PROHIBITED_PLUGIN_CAPABILITIES as readonly string[]).includes(capability)) {
      errors.push(`Prohibited capability: ${capability}.`);
    }
  }
  const requiresExplicitTrust = !input.builtin && input.permissions.length > 0;
  if (requiresExplicitTrust && !input.trusted) {
    errors.push("Executable extensions require explicit local trust before they can be enabled.");
  }
  if (!input.builtin) warnings.push("External logic remains isolated from native APIs and secrets.");
  return { allowed: errors.length === 0, requiresExplicitTrust, errors, warnings };
}
