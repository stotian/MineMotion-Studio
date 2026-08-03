import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const CAMERA_AND_VIRTUAL_PRODUCTION_PROGRAM = defineUltraProgram({
  "id": "camera-and-virtual-production",
  "arc": "camera",
  "program": "Camera and virtual production",
  "problem": "designing stable cinematic camera moves, focus and metadata across many shots",
  "fixture": "multi-camera chase sequence",
  "inspiration": "Blender camera tools plus virtual-production ideas",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/CameraAndVirtualProductionEngine.ts",
  "maximumOperations": 8,
  "maximumResourceUnits": 9216,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 286,
      "title": "Physical camera presets",
      "operatorId": "camera.and.virtual.production.physical.camera.presets",
      "testId": "P286_PHYSICAL_CAMERA_PRESETS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Physical camera presets typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for physical camera presets"
      ]
    },
    {
      "phase": 287,
      "title": "Camera rig builder",
      "operatorId": "camera.and.virtual.production.camera.rig.builder",
      "testId": "P287_CAMERA_RIG_BUILDER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Camera rig builder typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for camera rig builder"
      ]
    },
    {
      "phase": 288,
      "title": "Dolly and crane path editor",
      "operatorId": "camera.and.virtual.production.dolly.and.crane.path.editor",
      "testId": "P288_DOLLY_AND_CRANE_PATH_EDITOR_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Dolly and crane path editor typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dolly and crane path editor"
      ]
    },
    {
      "phase": 289,
      "title": "Handheld noise profiles",
      "operatorId": "camera.and.virtual.production.handheld.noise.profiles",
      "testId": "P289_HANDHELD_NOISE_PROFILES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Handheld noise profiles typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for handheld noise profiles"
      ]
    },
    {
      "phase": 290,
      "title": "Camera collision",
      "operatorId": "camera.and.virtual.production.camera.collision",
      "testId": "P290_CAMERA_COLLISION_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Camera collision typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for camera collision"
      ]
    },
    {
      "phase": 291,
      "title": "Horizon stabilization",
      "operatorId": "camera.and.virtual.production.horizon.stabilization",
      "testId": "P291_HORIZON_STABILIZATION_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Horizon stabilization typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for horizon stabilization"
      ]
    },
    {
      "phase": 292,
      "title": "Safe framing guides",
      "operatorId": "camera.and.virtual.production.safe.framing.guides",
      "testId": "P292_SAFE_FRAMING_GUIDES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Safe framing guides typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for safe framing guides"
      ]
    },
    {
      "phase": 293,
      "title": "Lens breathing",
      "operatorId": "camera.and.virtual.production.lens.breathing",
      "testId": "P293_LENS_BREATHING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Lens breathing typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lens breathing"
      ]
    },
    {
      "phase": 294,
      "title": "Focus pull assistant",
      "operatorId": "camera.and.virtual.production.focus.pull.assistant",
      "testId": "P294_FOCUS_PULL_ASSISTANT_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Focus pull assistant typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for focus pull assistant"
      ]
    },
    {
      "phase": 295,
      "title": "Multi-camera switching",
      "operatorId": "camera.and.virtual.production.multi.camera.switching",
      "testId": "P295_MULTI_CAMERA_SWITCHING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Multi-camera switching typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for multi-camera switching"
      ]
    },
    {
      "phase": 296,
      "title": "Camera bookmarks",
      "operatorId": "camera.and.virtual.production.camera.bookmarks",
      "testId": "P296_CAMERA_BOOKMARKS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Camera bookmarks typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for camera bookmarks"
      ]
    },
    {
      "phase": 297,
      "title": "Shot matching",
      "operatorId": "camera.and.virtual.production.shot.matching",
      "testId": "P297_SHOT_MATCHING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Shot matching typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shot matching"
      ]
    },
    {
      "phase": 298,
      "title": "Virtual production overlays",
      "operatorId": "camera.and.virtual.production.virtual.production.overlays",
      "testId": "P298_VIRTUAL_PRODUCTION_OVERLAYS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Virtual production overlays typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for virtual production overlays"
      ]
    },
    {
      "phase": 299,
      "title": "Camera metadata export",
      "operatorId": "camera.and.virtual.production.camera.metadata.export",
      "testId": "P299_CAMERA_METADATA_EXPORT_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Camera metadata export typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for camera metadata export"
      ]
    },
    {
      "phase": 300,
      "title": "Camera continuity report",
      "operatorId": "camera.and.virtual.production.camera.continuity.report",
      "testId": "P300_CAMERA_CONTINUITY_REPORT_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Camera continuity report typed contract, reversible command and deterministic evaluator",
        "Camera and virtual production workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for camera continuity report"
      ]
    }
  ]
});
