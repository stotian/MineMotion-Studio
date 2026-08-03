import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const LIGHTING_AND_LOOK_DEVELOPMENT_PROGRAM = defineUltraProgram({
  "id": "lighting-and-look-development",
  "arc": "lighting",
  "program": "Lighting and look development",
  "problem": "lighting subjects and sets independently while preserving exposure, continuity and Minecraft readability",
  "fixture": "day-to-night hero shot",
  "inspiration": "Blender lighting/lookdev patterns plus MineMotion continuity",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/LightingAndLookDevelopmentEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 8704,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 271,
      "title": "Three-point light setup",
      "operatorId": "lighting.and.look.development.three.point.light.setup",
      "testId": "P271_THREE_POINT_LIGHT_SETUP_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Three-point light setup typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for three-point light setup"
      ]
    },
    {
      "phase": 272,
      "title": "Light linking",
      "operatorId": "lighting.and.look.development.light.linking",
      "testId": "P272_LIGHT_LINKING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Light linking typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for light linking"
      ]
    },
    {
      "phase": 273,
      "title": "Light groups",
      "operatorId": "lighting.and.look.development.light.groups",
      "testId": "P273_LIGHT_GROUPS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Light groups typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for light groups"
      ]
    },
    {
      "phase": 274,
      "title": "Gobo and cookie library",
      "operatorId": "lighting.and.look.development.gobo.and.cookie.library",
      "testId": "P274_GOBO_AND_COOKIE_LIBRARY_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Gobo and cookie library typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gobo and cookie library"
      ]
    },
    {
      "phase": 275,
      "title": "Reflection cards",
      "operatorId": "lighting.and.look.development.reflection.cards",
      "testId": "P275_REFLECTION_CARDS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Reflection cards typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for reflection cards"
      ]
    },
    {
      "phase": 276,
      "title": "Shadow blockers",
      "operatorId": "lighting.and.look.development.shadow.blockers",
      "testId": "P276_SHADOW_BLOCKERS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Shadow blockers typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shadow blockers"
      ]
    },
    {
      "phase": 277,
      "title": "Exposure calibration",
      "operatorId": "lighting.and.look.development.exposure.calibration",
      "testId": "P277_EXPOSURE_CALIBRATION_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Exposure calibration typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for exposure calibration"
      ]
    },
    {
      "phase": 278,
      "title": "White balance workflow",
      "operatorId": "lighting.and.look.development.white.balance.workflow",
      "testId": "P278_WHITE_BALANCE_WORKFLOW_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "White balance workflow typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for white balance workflow"
      ]
    },
    {
      "phase": 279,
      "title": "Lookdev turntable",
      "operatorId": "lighting.and.look.development.lookdev.turntable",
      "testId": "P279_LOOKDEV_TURNTABLE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Lookdev turntable typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lookdev turntable"
      ]
    },
    {
      "phase": 280,
      "title": "Reference image matching",
      "operatorId": "lighting.and.look.development.reference.image.matching",
      "testId": "P280_REFERENCE_IMAGE_MATCHING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Reference image matching typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for reference image matching"
      ]
    },
    {
      "phase": 281,
      "title": "Light mixer",
      "operatorId": "lighting.and.look.development.light.mixer",
      "testId": "P281_LIGHT_MIXER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Light mixer typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for light mixer"
      ]
    },
    {
      "phase": 282,
      "title": "Shot lighting overrides",
      "operatorId": "lighting.and.look.development.shot.lighting.overrides",
      "testId": "P282_SHOT_LIGHTING_OVERRIDES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Shot lighting overrides typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shot lighting overrides"
      ]
    },
    {
      "phase": 283,
      "title": "Day and night continuity",
      "operatorId": "lighting.and.look.development.day.and.night.continuity",
      "testId": "P283_DAY_AND_NIGHT_CONTINUITY_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Day and night continuity typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for day and night continuity"
      ]
    },
    {
      "phase": 284,
      "title": "Light budget profiler",
      "operatorId": "lighting.and.look.development.light.budget.profiler",
      "testId": "P284_LIGHT_BUDGET_PROFILER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Light budget profiler typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for light budget profiler"
      ]
    },
    {
      "phase": 285,
      "title": "Lighting validation plates",
      "operatorId": "lighting.and.look.development.lighting.validation.plates",
      "testId": "P285_LIGHTING_VALIDATION_PLATES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Lighting validation plates typed contract, reversible command and deterministic evaluator",
        "Lighting and look development workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lighting validation plates"
      ]
    }
  ]
});
