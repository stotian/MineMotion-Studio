import { describe, expect, it } from "vitest";
import { DEFAULT_APP_SETTINGS } from "./DefaultSettings";
import { SettingsSerializer } from "./SettingsSerializer";
import { SettingsStore } from "./SettingsStore";

describe("SettingsSerializer", () => {
  it("fills missing settings with defaults", () => {
    const settings = SettingsSerializer.parse(
      JSON.stringify({
        general: {
          defaultFps: 30
        }
      })
    );

    expect(settings.general.defaultFps).toBe(30);
    expect(settings.general.language).toBe("system");
    expect(settings.viewport.gridEnabled).toBe(true);
    expect(settings.plugins.pluginsEnabled).toBe(true);
  });

  it("persists supported languages and repairs unknown legacy values", () => {
    const french = SettingsSerializer.parse(
      SettingsSerializer.serialize({
        ...DEFAULT_APP_SETTINGS,
        general: { ...DEFAULT_APP_SETTINGS.general, language: "fr" }
      })
    );
    expect(french.general.language).toBe("fr");
    const invalid = SettingsSerializer.parse(
      JSON.stringify({ general: { language: "unsafe-locale" } })
    );
    expect(invalid.general.language).toBe("system");
  });

  it("adds recent projects without exceeding ten entries", () => {
    let settings = DEFAULT_APP_SETTINGS;
    for (let index = 0; index < 12; index += 1) {
      settings = SettingsStore.addRecentProject(settings, {
        id: `project-${index}`,
        name: `Project ${index}`,
        savedAt: new Date(index).toISOString(),
        storageHint: "download"
      });
    }

    expect(settings.general.recentProjects).toHaveLength(10);
    expect(settings.general.recentProjects[0].id).toBe("project-11");
  });
});
