import { EN_TRANSLATIONS } from "./catalogs/en";
import { FR_TRANSLATIONS } from "./catalogs/fr";
import type {
  AppLanguagePreference,
  RuntimeLocale,
  SupportedAppLocale,
  TranslationCatalog,
  TranslationKey,
  TranslationValues
} from "./LocalizationTypes";
import { pseudolocalize } from "./Pseudolocalization";
import { validateTranslationCatalog } from "./LocalizationValidator";

const CATALOGS: Readonly<Record<SupportedAppLocale, TranslationCatalog>> =
  Object.freeze({ en: EN_TRANSLATIONS, fr: FR_TRANSLATIONS });
const LOCALE_TAGS: Readonly<Record<SupportedAppLocale, string>> = Object.freeze({
  en: "en-US",
  fr: "fr-FR"
});

export interface LocalizationServiceOptions {
  preference?: AppLanguagePreference;
  systemLanguages?: readonly string[];
  pseudolocalization?: boolean;
  timeZone?: string;
}

export function resolveAppLocale(
  preference: AppLanguagePreference,
  systemLanguages: readonly string[] = []
): SupportedAppLocale {
  if (preference !== "system") return preference;
  return systemLanguages.some((language) => language.toLowerCase().startsWith("fr"))
    ? "fr"
    : "en";
}

function interpolate(template: string, values: TranslationValues): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder
  );
}

export class LocalizationService {
  readonly locale: RuntimeLocale;
  readonly language: SupportedAppLocale;
  private readonly catalog: TranslationCatalog;
  private readonly timeZone?: string;

  constructor(options: LocalizationServiceOptions = {}) {
    const issues = validateTranslationCatalog(EN_TRANSLATIONS, FR_TRANSLATIONS);
    if (issues.length > 0) throw new Error(issues.map((issue) => issue.message).join(" "));
    this.language = resolveAppLocale(
      options.preference ?? "system",
      options.systemLanguages ?? []
    );
    this.locale = options.pseudolocalization ? "qps-ploc" : this.language;
    this.catalog = CATALOGS[this.language];
    this.timeZone = options.timeZone;
  }

  t(key: TranslationKey, values: TranslationValues = {}): string {
    const template = this.catalog[key] ?? EN_TRANSLATIONS[key] ?? key;
    const localized = this.locale === "qps-ploc" ? pseudolocalize(template) : template;
    return interpolate(localized, values);
  }

  plural(
    keys: { one: TranslationKey; other: TranslationKey },
    count: number,
    values: TranslationValues = {}
  ): string {
    const rule = new Intl.PluralRules(LOCALE_TAGS[this.language]).select(count);
    return this.t(rule === "one" ? keys.one : keys.other, { ...values, count });
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(LOCALE_TAGS[this.language], options).format(value);
  }

  formatDate(value: Date | number, options: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat(LOCALE_TAGS[this.language], {
      ...options,
      ...(this.timeZone === undefined ? {} : { timeZone: this.timeZone })
    }).format(value);
  }

  formatDuration(totalSeconds: number): string {
    const bounded = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(bounded / 60);
    const seconds = bounded % 60;
    if (minutes === 0) return `${this.formatNumber(seconds)} ${this.t("format.second.short")}`;
    return `${this.formatNumber(minutes)} ${this.t("format.minute.short")} ${this.formatNumber(seconds, { minimumIntegerDigits: 2 })} ${this.t("format.second.short")}`;
  }

  formatTimecode(frame: number, fps: number): string {
    const safeFps = Math.max(1, Math.round(fps));
    const safeFrame = Math.max(0, Math.round(frame));
    const frames = safeFrame % safeFps;
    const totalSeconds = Math.floor(safeFrame / safeFps);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return [hours, minutes, seconds, frames]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }
}

export function createLocalizationService(
  options: LocalizationServiceOptions = {}
): LocalizationService {
  return new LocalizationService(options);
}
