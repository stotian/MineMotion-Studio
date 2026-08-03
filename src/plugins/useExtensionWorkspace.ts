import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { presetRegistry } from "../presets/PresetRegistry";
import { templateRegistry } from "../templates/TemplateRegistry";
import type { AppSettings } from "../settings/AppSettings";
import { parseAndValidateContentPack } from "./ContentPackValidator";
import { applySafeContentPack } from "./ContentPackRuntime";
import { ExtensionManager } from "./ExtensionManager";
import { loadStoredExtensions, saveStoredExtensions } from "./ExtensionStore";
import { BUILTIN_PLUGIN_MANIFESTS } from "./PluginRegistry";
import type { PluginManifest } from "./PluginManifest";

export function useExtensionWorkspace(options: {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  setStatus: (message: string) => void;
}) {
  const managerRef = useRef<ExtensionManager | null>(null);
  if (!managerRef.current) managerRef.current = new ExtensionManager(BUILTIN_PLUGIN_MANIFESTS);
  const manager = managerRef.current;
  const [snapshot, setSnapshot] = useState(() => manager.snapshot());
  const [registryRevision, setRegistryRevision] = useState(0);

  const refresh = useCallback(() => setSnapshot(manager.snapshot()), [manager]);
  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    const current = manager.snapshot();
    saveStoredExtensions(window.localStorage, current.extensions.filter((extension) => !extension.builtin).map((extension) => ({ payload: extension.payload, trusted: extension.trusted, enabled: extension.enabled })));
  }, [manager]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const record of loadStoredExtensions(window.localStorage)) {
      try {
        const installed = manager.install(record.payload, { trusted: record.trusted });
        if (installed.kind === "content-pack") applySafeContentPack(installed.payload as import("./ExtensionTypes").SafeContentPack, { presets: presetRegistry, templates: templateRegistry });
        if (record.enabled && installed.validationErrors.length === 0) manager.setEnabled(installed.id, true);
      } catch (error) {
        manager.recordFailure((record.payload as { id?: string }).id ?? "unknown", error);
      }
    }
    if (options.settings.plugins.safeMode) manager.setSafeMode(true);
    refresh();
    setRegistryRevision((value) => value + 1);
  }, []);

  const installFile = useCallback(async (file: File) => {
    const raw = await file.text();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.kind === "content-pack") {
      const result = parseAndValidateContentPack(raw);
      if (!result.valid || !result.pack) throw new Error(result.errors.join(" "));
      const installed = manager.install(result.pack);
      const applied = applySafeContentPack(result.pack, { presets: presetRegistry, templates: templateRegistry });
      options.setStatus(`Installed safe content pack ${installed.id}: ${applied.cameraPresets} camera preset(s), ${applied.templates} template(s).`);
      setRegistryRevision((value) => value + 1);
    } else {
      const manifest = { ...parsed, kind: "logic-plugin", enabled: false, builtin: false } as unknown as PluginManifest;
      const installed = manager.install(manifest, { trusted: false });
      options.setStatus(`Inspected logic plugin ${installed.id}. It remains disabled until explicitly trusted.`);
    }
    persist(); refresh();
  }, [manager, options.setStatus, persist, refresh]);

  const setEnabled = useCallback((id: string, enabled: boolean) => {
    manager.setEnabled(id, enabled); persist(); refresh();
    options.setSettings((settings) => ({ ...settings, plugins: { ...settings.plugins, disabledPluginIds: enabled ? settings.plugins.disabledPluginIds.filter((item) => item !== id) : [...new Set([...settings.plugins.disabledPluginIds, id])] } }));
  }, [manager, options.setSettings, persist, refresh]);

  const setTrusted = useCallback((id: string, trusted: boolean) => { manager.setTrusted(id, trusted); persist(); refresh(); }, [manager, persist, refresh]);
  const uninstall = useCallback((id: string) => { manager.uninstall(id); persist(); refresh(); setRegistryRevision((value) => value + 1); }, [manager, persist, refresh]);
  const setSafeMode = useCallback((enabled: boolean) => {
    manager.setSafeMode(enabled); refresh(); persist();
    options.setSettings((settings) => ({ ...settings, plugins: { ...settings.plugins, safeMode: enabled } }));
  }, [manager, options.setSettings, persist, refresh]);

  return { extensions: snapshot.extensions, logs: snapshot.logs, safeMode: snapshot.safeMode, registryRevision, installFile, setEnabled, setTrusted, uninstall, setSafeMode };
}
