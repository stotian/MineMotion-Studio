import { createId } from "../core/ids/Id";
import type { PluginManifest } from "./PluginManifest";
import { validatePluginManifest } from "./PluginManifest";
import type { ExtensionLogEntry, SafeContentPack } from "./ExtensionTypes";
import { checkExtensionCompatibility } from "./PluginCompatibility";
import { evaluatePluginSecurity } from "./PluginSecurity";

export interface ManagedExtension {
  id: string;
  kind: "content-pack" | "logic-plugin";
  version: string;
  name: string;
  enabled: boolean;
  trusted: boolean;
  builtin: boolean;
  validationErrors: string[];
  compatibilityWarnings: string[];
  permissions: string[];
  capabilities: string[];
  installedAt: string;
  payload: PluginManifest | SafeContentPack;
}

export interface ExtensionManagerSnapshot {
  extensions: ManagedExtension[];
  logs: ExtensionLogEntry[];
  safeMode: boolean;
}

export class ExtensionManager {
  private extensions = new Map<string, ManagedExtension>();
  private logs: ExtensionLogEntry[] = [];
  private safeMode = false;

  constructor(initial: Array<PluginManifest | SafeContentPack> = [], private readonly appVersion = "0.8.2") {
    for (const extension of initial) this.install(extension, { trusted: Boolean((extension as PluginManifest).builtin), builtin: Boolean((extension as PluginManifest).builtin) });
  }

  install(extension: PluginManifest | SafeContentPack, options: { trusted?: boolean; builtin?: boolean } = {}): ManagedExtension {
    const kind = extension.kind === "content-pack" ? "content-pack" : "logic-plugin";
    const existing = this.extensions.get(extension.id);
    if (existing && existing.version === extension.version) throw new Error(`Extension ${extension.id}@${extension.version} is already installed.`);
    const installedVersions = new Map([...this.extensions.values()].map((entry) => [entry.id, entry.version]));
    const compatibility = checkExtensionCompatibility(extension, installedVersions, this.appVersion);
    const manifestErrors = kind === "logic-plugin" ? validatePluginManifest(extension as PluginManifest) : [];
    const trusted = options.trusted ?? false;
    const builtin = options.builtin ?? false;
    const permissions = kind === "logic-plugin" ? (extension as PluginManifest).permissions : [];
    const capabilities = extension.capabilities ?? [];
    const security = kind === "content-pack" ? { allowed: true, errors: [], warnings: [] } : evaluatePluginSecurity({ builtin, trusted, permissions, capabilities, safeMode: this.safeMode });
    const managed: ManagedExtension = {
      id: extension.id,
      kind,
      version: extension.version,
      name: extension.name,
      enabled: kind === "content-pack" && compatibility.compatible,
      trusted,
      builtin,
      validationErrors: [...manifestErrors, ...compatibility.errors, ...security.errors],
      compatibilityWarnings: [...compatibility.warnings, ...security.warnings],
      permissions: [...permissions],
      capabilities: [...capabilities],
      installedAt: new Date().toISOString(),
      payload: extension
    };
    this.extensions.set(extension.id, managed);
    this.log(extension.id, existing ? "info" : "info", existing ? `Updated extension to ${extension.version}.` : `Installed ${kind} ${extension.version}.`);
    return managed;
  }

  reload(id: string, replacement?: PluginManifest | SafeContentPack): ManagedExtension {
    const current = this.require(id);
    const payload = replacement ?? current.payload;
    if (payload.id !== id) throw new Error("Development reload cannot change the extension id.");
    this.extensions.delete(id);
    try {
      let reloaded = this.install(payload, { trusted: current.trusted, builtin: current.builtin });
      if (current.enabled && reloaded.validationErrors.length === 0 && (!this.safeMode || reloaded.builtin)) {
        reloaded = this.setEnabled(id, true);
      }
      this.log(id, "info", `Development reload completed for ${reloaded.version}.`);
      return reloaded;
    } catch (error) {
      this.extensions.set(id, { ...current, enabled: false });
      this.log(id, "error", `Development reload failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  setEnabled(id: string, enabled: boolean): ManagedExtension {
    const extension = this.require(id);
    if (enabled) {
      if (extension.validationErrors.length > 0) throw new Error(extension.validationErrors.join(" "));
      if (this.safeMode && !extension.builtin) throw new Error("External extensions are disabled in safe mode.");
      if (extension.kind === "logic-plugin" && !extension.trusted) throw new Error("Trust this local logic plugin before enabling it.");
    }
    const next = { ...extension, enabled };
    this.extensions.set(id, next);
    this.log(id, "info", enabled ? "Extension enabled." : "Extension disabled.");
    return next;
  }

  setTrusted(id: string, trusted: boolean): ManagedExtension {
    const extension = this.require(id);
    if (extension.builtin) return extension;
    const validationErrors = trusted
      ? extension.validationErrors.filter((error) => !error.includes("explicit local trust"))
      : [...extension.validationErrors.filter((error) => !error.includes("explicit local trust")), "Executable extensions require explicit local trust before they can be enabled."];
    const next = { ...extension, trusted, enabled: trusted ? extension.enabled : false, validationErrors };
    this.extensions.set(id, next);
    this.log(id, "warning", trusted ? "Local trust granted by the user." : "Local trust revoked.");
    return next;
  }

  uninstall(id: string): void {
    const extension = this.require(id);
    if (extension.builtin) throw new Error("Built-in extensions cannot be uninstalled.");
    this.extensions.delete(id);
    this.log(id, "info", "Extension uninstalled.");
  }

  setSafeMode(enabled: boolean): void {
    this.safeMode = enabled;
    if (enabled) {
      this.extensions = new Map([...this.extensions].map(([id, extension]) => [id, extension.builtin ? extension : { ...extension, enabled: false }]));
    }
    this.log("minemotion.safe-mode", "warning", enabled ? "Safe mode enabled; external extensions disabled." : "Safe mode disabled.");
  }

  recordFailure(id: string, error: unknown): void {
    const extension = this.extensions.get(id);
    if (extension) this.extensions.set(id, { ...extension, enabled: false });
    this.log(id, "error", error instanceof Error ? error.message : String(error));
  }

  snapshot(): ExtensionManagerSnapshot {
    return { extensions: [...this.extensions.values()].map((extension) => ({ ...extension })), logs: [...this.logs], safeMode: this.safeMode };
  }

  private require(id: string): ManagedExtension {
    const extension = this.extensions.get(id);
    if (!extension) throw new Error(`Unknown extension: ${id}.`);
    return extension;
  }

  private log(extensionId: string, level: ExtensionLogEntry["level"], message: string): void {
    this.logs = [...this.logs, { id: createId("extension_log"), extensionId, level, message, createdAt: new Date().toISOString() }].slice(-500);
  }
}
