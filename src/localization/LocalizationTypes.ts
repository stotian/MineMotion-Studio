import type { TranslationCatalog, TranslationKey } from "./catalogs/en";

export const SUPPORTED_APP_LOCALES = ["en", "fr"] as const;
export type SupportedAppLocale = (typeof SUPPORTED_APP_LOCALES)[number];
export type AppLanguagePreference = "system" | SupportedAppLocale;
export type RuntimeLocale = SupportedAppLocale | "qps-ploc";
export type TranslationValues = Readonly<Record<string, string | number>>;

export type { TranslationCatalog, TranslationKey };
