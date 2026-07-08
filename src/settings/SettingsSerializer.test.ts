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
    expect(settings.viewport.gridEnabled).toBe(true);
    expect(settings.plugins.pluginsEnabled).toBe(true);
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

