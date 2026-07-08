import { DEFAULT_APP_SETTINGS } from "./DefaultSettings";
import { SettingsSerializer } from "./SettingsSerializer";
import type { AppSettings, RecentProjectEntry } from "./SettingsTypes";

const SETTINGS_KEY = "minemotion.appSettings.v1";

export class SettingsStore {
  static load(storage: Storage = window.localStorage): AppSettings {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_APP_SETTINGS);
    }

    try {
      return SettingsSerializer.parse(raw);
    } catch {
      return structuredClone(DEFAULT_APP_SETTINGS);
    }
  }

  static save(
    settings: AppSettings,
    storage: Storage = window.localStorage
  ): void {
    storage.setItem(SETTINGS_KEY, SettingsSerializer.serialize(settings));
  }

  static addRecentProject(
    settings: AppSettings,
    entry: RecentProjectEntry
  ): AppSettings {
    const existing = settings.general.recentProjects.filter(
      (item) => item.id !== entry.id
    );

    return {
      ...settings,
      general: {
        ...settings.general,
        recentProjects: [entry, ...existing].slice(0, 10)
      }
    };
  }
}

