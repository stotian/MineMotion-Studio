import { DEFAULT_APP_SETTINGS } from "./DefaultSettings";
import type { AppSettings } from "./SettingsTypes";

export class SettingsSerializer {
  static serialize(settings: AppSettings): string {
    return JSON.stringify(settings, null, 2);
  }

  static parse(raw: string): AppSettings {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return SettingsSerializer.withDefaults(parsed);
  }

  static withDefaults(settings: Partial<AppSettings> = {}): AppSettings {
    return {
      schemaVersion: 1,
      general: {
        ...DEFAULT_APP_SETTINGS.general,
        ...settings.general,
        recentProjects:
          settings.general?.recentProjects?.slice(0, 10) ??
          DEFAULT_APP_SETTINGS.general.recentProjects
      },
      viewport: {
        ...DEFAULT_APP_SETTINGS.viewport,
        ...settings.viewport
      },
      editor: {
        ...DEFAULT_APP_SETTINGS.editor,
        ...settings.editor
      },
      minecraft: {
        ...DEFAULT_APP_SETTINGS.minecraft,
        ...settings.minecraft
      },
      plugins: {
        ...DEFAULT_APP_SETTINGS.plugins,
        ...settings.plugins,
        disabledPluginIds:
          settings.plugins?.disabledPluginIds ??
          DEFAULT_APP_SETTINGS.plugins.disabledPluginIds
      }
    };
  }
}

