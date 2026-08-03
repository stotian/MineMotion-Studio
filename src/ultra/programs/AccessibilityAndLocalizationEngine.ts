import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const ACCESSIBILITY_AND_LOCALIZATION_PROGRAM = defineUltraProgram({
  "id": "accessibility-and-localization",
  "arc": "accessibility",
  "program": "Accessibility and localization",
  "problem": "making every primary workflow keyboard-accessible, readable, translatable and testable",
  "fixture": "keyboard-only localized project",
  "inspiration": "Accessibility standards adapted to MineMotion workflows",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/AccessibilityAndLocalizationEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 18432,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 556,
      "title": "Full keyboard navigation",
      "operatorId": "accessibility.and.localization.full.keyboard.navigation",
      "testId": "P556_FULL_KEYBOARD_NAVIGATION_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Full keyboard navigation typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for full keyboard navigation"
      ]
    },
    {
      "phase": 557,
      "title": "Screen-reader labels",
      "operatorId": "accessibility.and.localization.screen.reader.labels",
      "testId": "P557_SCREEN_READER_LABELS_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Screen-reader labels typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for screen-reader labels"
      ]
    },
    {
      "phase": 558,
      "title": "High-contrast theme",
      "operatorId": "accessibility.and.localization.high.contrast.theme",
      "testId": "P558_HIGH_CONTRAST_THEME_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "High-contrast theme typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for high-contrast theme"
      ]
    },
    {
      "phase": 559,
      "title": "Reduced motion",
      "operatorId": "accessibility.and.localization.reduced.motion",
      "testId": "P559_REDUCED_MOTION_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Reduced motion typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for reduced motion"
      ]
    },
    {
      "phase": 560,
      "title": "Color-blind-safe indicators",
      "operatorId": "accessibility.and.localization.color.blind.safe.indicators",
      "testId": "P560_COLOR_BLIND_SAFE_INDICATORS_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Color-blind-safe indicators typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for color-blind-safe indicators"
      ]
    },
    {
      "phase": 561,
      "title": "Scalable typography",
      "operatorId": "accessibility.and.localization.scalable.typography",
      "testId": "P561_SCALABLE_TYPOGRAPHY_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Scalable typography typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for scalable typography"
      ]
    },
    {
      "phase": 562,
      "title": "Touch target sizing",
      "operatorId": "accessibility.and.localization.touch.target.sizing",
      "testId": "P562_TOUCH_TARGET_SIZING_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Touch target sizing typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for touch target sizing"
      ]
    },
    {
      "phase": 563,
      "title": "Focus visibility",
      "operatorId": "accessibility.and.localization.focus.visibility",
      "testId": "P563_FOCUS_VISIBILITY_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Focus visibility typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for focus visibility"
      ]
    },
    {
      "phase": 564,
      "title": "Shortcut conflict checker",
      "operatorId": "accessibility.and.localization.shortcut.conflict.checker",
      "testId": "P564_SHORTCUT_CONFLICT_CHECKER_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Shortcut conflict checker typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shortcut conflict checker"
      ]
    },
    {
      "phase": 565,
      "title": "Remappable shortcuts",
      "operatorId": "accessibility.and.localization.remappable.shortcuts",
      "testId": "P565_REMAPPABLE_SHORTCUTS_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Remappable shortcuts typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for remappable shortcuts"
      ]
    },
    {
      "phase": 566,
      "title": "Locale switching",
      "operatorId": "accessibility.and.localization.locale.switching",
      "testId": "P566_LOCALE_SWITCHING_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Locale switching typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for locale switching"
      ]
    },
    {
      "phase": 567,
      "title": "Pluralization",
      "operatorId": "accessibility.and.localization.pluralization",
      "testId": "P567_PLURALIZATION_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Pluralization typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for pluralization"
      ]
    },
    {
      "phase": 568,
      "title": "Right-to-left readiness",
      "operatorId": "accessibility.and.localization.right.to.left.readiness",
      "testId": "P568_RIGHT_TO_LEFT_READINESS_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Right-to-left readiness typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for right-to-left readiness"
      ]
    },
    {
      "phase": 569,
      "title": "Translation completeness",
      "operatorId": "accessibility.and.localization.translation.completeness",
      "testId": "P569_TRANSLATION_COMPLETENESS_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Translation completeness typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for translation completeness"
      ]
    },
    {
      "phase": 570,
      "title": "Accessibility regression suite",
      "operatorId": "accessibility.and.localization.accessibility.regression.suite",
      "testId": "P570_ACCESSIBILITY_REGRESSION_SUITE_ACCEPTANCE",
      "evidence": "accessibility",
      "deliverables": [
        "Accessibility regression suite typed contract, reversible command and deterministic evaluator",
        "Accessibility and localization workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for accessibility regression suite"
      ]
    }
  ]
});
