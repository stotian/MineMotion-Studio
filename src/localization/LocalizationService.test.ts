import { describe, expect, it } from "vitest";
import { EN_TRANSLATIONS } from "./catalogs/en";
import { FR_TRANSLATIONS } from "./catalogs/fr";
import { createLocalizationService, resolveAppLocale } from "./LocalizationService";
import { pseudolocalize } from "./Pseudolocalization";
import { validateTranslationCatalog } from "./LocalizationValidator";
import { formatLocalizedDiagnostic } from "./LocalizationDiagnostics";
import { localizeExportValidationMessage } from "./LocalizationDomainMessages";
import { createInitialProject } from "../project/ProjectStore";

describe("LocalizationService", () => {
  it("keeps English and French keys and placeholders in exact parity", () => {
    expect(validateTranslationCatalog(EN_TRANSLATIONS, FR_TRANSLATIONS)).toEqual([]);
    const broken = { ...FR_TRANSLATIONS } as Record<string, string>;
    delete broken["topbar.help"];
    broken["format.effects.one"] = "Effet";
    broken["unexpected.key"] = "Unexpected";
    expect(validateTranslationCatalog(EN_TRANSLATIONS, broken).map((issue) => issue.code)).toEqual([
      "LOCALE_PLACEHOLDER_MISMATCH",
      "LOCALE_KEY_MISSING",
      "LOCALE_KEY_EXTRA"
    ]);
  });

  it("resolves explicit and system languages with deterministic English fallback", () => {
    expect(resolveAppLocale("fr", ["en-US"])).toBe("fr");
    expect(resolveAppLocale("system", ["fr-CA", "en-US"])).toBe("fr");
    expect(resolveAppLocale("system", ["de-DE"])).toBe("en");
    expect(resolveAppLocale("system", [])).toBe("en");
  });

  it("translates, interpolates, pluralizes, and formats both supported locales", () => {
    const en = createLocalizationService({ preference: "en", timeZone: "UTC" });
    const fr = createLocalizationService({ preference: "fr", timeZone: "UTC" });
    expect(en.t("topbar.newProject")).toBe("New Project");
    expect(fr.t("topbar.newProject")).toBe("Nouveau projet");
    expect(en.plural({ one: "format.effects.one", other: "format.effects.other" }, 1)).toBe("1 effect");
    expect(fr.plural({ one: "format.effects.one", other: "format.effects.other" }, 2)).toBe("2 effets");
    expect(en.formatNumber(1234.5)).toBe(new Intl.NumberFormat("en-US").format(1234.5));
    expect(fr.formatNumber(1234.5)).toBe(new Intl.NumberFormat("fr-FR").format(1234.5));
    const date = new Date("2026-07-20T12:00:00.000Z");
    expect(fr.formatDate(date, { dateStyle: "long" })).toBe(
      new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(date)
    );
    expect(en.formatDuration(65)).toBe("1 min 05 s");
    expect(fr.formatDuration(9)).toBe("9 s");
    expect(en.formatTimecode(90_061, 30)).toBe("00:50:02:01");
  });

  it("provides bounded pseudolocalization without corrupting placeholders", () => {
    expect(pseudolocalize("Save {count} projects")).toMatch(/^⟦Šàṽë \{count\}/);
    const pseudo = createLocalizationService({ preference: "en", pseudolocalization: true });
    const value = pseudo.plural(
      { one: "format.effects.one", other: "format.effects.other" },
      3
    );
    expect(value).toContain("3");
    expect(value).not.toContain("{count}");
    expect(value.startsWith("⟦")).toBe(true);
  });

  it("preserves stable diagnostic codes while localizing user messages", () => {
    const english = createLocalizationService({ preference: "en" });
    const french = createLocalizationService({ preference: "fr" });
    expect(formatLocalizedDiagnostic(english, "PROJECT_LOAD_FAILED", "app.projectLoadFailed"))
      .toBe("[PROJECT_LOAD_FAILED] Could not load project.");
    expect(formatLocalizedDiagnostic(french, "PROJECT_LOAD_FAILED", "app.projectLoadFailed"))
      .toBe("[PROJECT_LOAD_FAILED] Impossible de charger le projet.");
    expect(localizeExportValidationMessage(french, "No active/export camera is available."))
      .toBe("[EXPORT_CAMERA_MISSING] Aucune caméra active ou d’export n’est disponible.");
    expect(localizeExportValidationMessage(french, "MP4 H.264 requires native FFmpeg support."))
      .toBe("[EXPORT_FFMPEG_REQUIRED] MP4 H.264 requiert la prise en charge native de FFmpeg.");
    expect(localizeExportValidationMessage(english, "Unexpected internal detail"))
      .toBe("[EXPORT_DIAGNOSTIC_UNMAPPED] An export diagnostic could not be presented safely.");
  });

  it("switches locales without mutating serialized project data", () => {
    const project = createInitialProject();
    const before = JSON.stringify(project);
    createLocalizationService({ preference: "en" }).t("topbar.saveProject");
    createLocalizationService({ preference: "fr" }).t("topbar.saveProject");
    createLocalizationService({ preference: "en", pseudolocalization: true })
      .t("topbar.saveProject");
    expect(JSON.stringify(project)).toBe(before);
  });
});
