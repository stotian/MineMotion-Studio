import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const SCENE_ORGANIZATION_AND_OUTLINER_PROGRAM = defineUltraProgram({
  "id": "scene-organization-and-outliner",
  "arc": "organization",
  "program": "Scene organization and Outliner",
  "problem": "keeping complex scenes readable while preserving hierarchy, visibility and ownership",
  "fixture": "nested castle production scene",
  "inspiration": "Blender Outliner pattern plus safer MineMotion rules",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/SceneOrganizationAndOutlinerEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 5632,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 181,
      "title": "Hierarchical collections",
      "operatorId": "scene.organization.and.outliner.hierarchical.collections",
      "testId": "P181_HIERARCHICAL_COLLECTIONS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Hierarchical collections typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for hierarchical collections"
      ]
    },
    {
      "phase": 182,
      "title": "Layered visibility",
      "operatorId": "scene.organization.and.outliner.layered.visibility",
      "testId": "P182_LAYERED_VISIBILITY_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Layered visibility typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for layered visibility"
      ]
    },
    {
      "phase": 183,
      "title": "Render and viewport overrides",
      "operatorId": "scene.organization.and.outliner.render.and.viewport.overrides",
      "testId": "P183_RENDER_AND_VIEWPORT_OVERRIDES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Render and viewport overrides typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render and viewport overrides"
      ]
    },
    {
      "phase": 184,
      "title": "Drag-safe reparenting",
      "operatorId": "scene.organization.and.outliner.drag.safe.reparenting",
      "testId": "P184_DRAG_SAFE_REPARENTING_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Drag-safe reparenting typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for drag-safe reparenting"
      ]
    },
    {
      "phase": 185,
      "title": "Dependency-aware delete",
      "operatorId": "scene.organization.and.outliner.dependency.aware.delete",
      "testId": "P185_DEPENDENCY_AWARE_DELETE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Dependency-aware delete typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dependency-aware delete"
      ]
    },
    {
      "phase": 186,
      "title": "Orphan detection",
      "operatorId": "scene.organization.and.outliner.orphan.detection",
      "testId": "P186_ORPHAN_DETECTION_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Orphan detection typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for orphan detection"
      ]
    },
    {
      "phase": 187,
      "title": "Broken link diagnostics",
      "operatorId": "scene.organization.and.outliner.broken.link.diagnostics",
      "testId": "P187_BROKEN_LINK_DIAGNOSTICS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Broken link diagnostics typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for broken link diagnostics"
      ]
    },
    {
      "phase": 188,
      "title": "Scene statistics columns",
      "operatorId": "scene.organization.and.outliner.scene.statistics.columns",
      "testId": "P188_SCENE_STATISTICS_COLUMNS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Scene statistics columns typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for scene statistics columns"
      ]
    },
    {
      "phase": 189,
      "title": "Custom Outliner columns",
      "operatorId": "scene.organization.and.outliner.custom.outliner.columns",
      "testId": "P189_CUSTOM_OUTLINER_COLUMNS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Custom Outliner columns typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for custom outliner columns"
      ]
    },
    {
      "phase": 190,
      "title": "Batch rename",
      "operatorId": "scene.organization.and.outliner.batch.rename",
      "testId": "P190_BATCH_RENAME_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Batch rename typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for batch rename"
      ]
    },
    {
      "phase": 191,
      "title": "Prefix and suffix transforms",
      "operatorId": "scene.organization.and.outliner.prefix.and.suffix.transforms",
      "testId": "P191_PREFIX_AND_SUFFIX_TRANSFORMS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Prefix and suffix transforms typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for prefix and suffix transforms"
      ]
    },
    {
      "phase": 192,
      "title": "Color labels",
      "operatorId": "scene.organization.and.outliner.color.labels",
      "testId": "P192_COLOR_LABELS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Color labels typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for color labels"
      ]
    },
    {
      "phase": 193,
      "title": "Lock and permission states",
      "operatorId": "scene.organization.and.outliner.lock.and.permission.states",
      "testId": "P193_LOCK_AND_PERMISSION_STATES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Lock and permission states typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lock and permission states"
      ]
    },
    {
      "phase": 194,
      "title": "Outliner filters",
      "operatorId": "scene.organization.and.outliner.outliner.filters",
      "testId": "P194_OUTLINER_FILTERS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Outliner filters typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for outliner filters"
      ]
    },
    {
      "phase": 195,
      "title": "Massive-scene virtualization",
      "operatorId": "scene.organization.and.outliner.massive.scene.virtualization",
      "testId": "P195_MASSIVE_SCENE_VIRTUALIZATION_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Massive-scene virtualization typed contract, reversible command and deterministic evaluator",
        "Scene organization and Outliner workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for massive-scene virtualization"
      ]
    }
  ]
});
