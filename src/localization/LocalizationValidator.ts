import type { TranslationCatalog, TranslationKey } from "./LocalizationTypes";

export interface LocalizationValidationIssue {
  code:
    | "LOCALE_KEY_MISSING"
    | "LOCALE_KEY_EXTRA"
    | "LOCALE_PLACEHOLDER_MISMATCH"
    | "LOCALE_VALUE_INVALID";
  key: string;
  message: string;
}

const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;

export function listTranslationPlaceholders(value: string): readonly string[] {
  return Object.freeze(
    [...value.matchAll(PLACEHOLDER_PATTERN)]
      .map((match) => match[1])
      .sort()
  );
}

export function validateTranslationCatalog(
  baseline: TranslationCatalog,
  candidate: Readonly<Record<string, unknown>>
): readonly LocalizationValidationIssue[] {
  const issues: LocalizationValidationIssue[] = [];
  const baselineKeys = Object.keys(baseline).sort() as TranslationKey[];
  const candidateKeys = Object.keys(candidate).sort();
  const baselineSet = new Set<string>(baselineKeys);
  const candidateSet = new Set(candidateKeys);
  for (const key of baselineKeys) {
    if (!candidateSet.has(key)) {
      issues.push({ code: "LOCALE_KEY_MISSING", key, message: `Missing translation key: ${key}.` });
      continue;
    }
    const value = candidate[key];
    if (typeof value !== "string" || value.trim() === "") {
      issues.push({ code: "LOCALE_VALUE_INVALID", key, message: `Translation ${key} must be a non-empty string.` });
      continue;
    }
    const expected = listTranslationPlaceholders(baseline[key]);
    const actual = listTranslationPlaceholders(value);
    if (expected.join("\0") !== actual.join("\0")) {
      issues.push({ code: "LOCALE_PLACEHOLDER_MISMATCH", key, message: `Translation placeholders differ for ${key}.` });
    }
  }
  for (const key of candidateKeys) {
    if (!baselineSet.has(key)) issues.push({ code: "LOCALE_KEY_EXTRA", key, message: `Unexpected translation key: ${key}.` });
  }
  return Object.freeze(issues);
}
