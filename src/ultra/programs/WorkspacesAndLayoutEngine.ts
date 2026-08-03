import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const WORKSPACES_AND_LAYOUT_PROGRAM = defineUltraProgram({
  "id": "workspaces-and-layout",
  "arc": "workflow",
  "program": "Workspaces and layout",
  "problem": "adapting the interface to each production task, display size and team convention",
  "fixture": "dual-monitor shot workspace",
  "inspiration": "Blender workspace pattern plus MineMotion simplification",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/WorkspacesAndLayoutEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 4608,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 151,
      "title": "Workspace presets per task",
      "operatorId": "workspaces.and.layout.workspace.presets.per.task",
      "testId": "P151_WORKSPACE_PRESETS_PER_TASK_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Workspace presets per task typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for workspace presets per task"
      ]
    },
    {
      "phase": 152,
      "title": "User-defined workspace templates",
      "operatorId": "workspaces.and.layout.user.defined.workspace.templates",
      "testId": "P152_USER_DEFINED_WORKSPACE_TEMPLATES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "User-defined workspace templates typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for user-defined workspace templates"
      ]
    },
    {
      "phase": 153,
      "title": "Split and join editor areas",
      "operatorId": "workspaces.and.layout.split.and.join.editor.areas",
      "testId": "P153_SPLIT_AND_JOIN_EDITOR_AREAS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Split and join editor areas typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for split and join editor areas"
      ]
    },
    {
      "phase": 154,
      "title": "Temporary full-screen editor",
      "operatorId": "workspaces.and.layout.temporary.full.screen.editor",
      "testId": "P154_TEMPORARY_FULL_SCREEN_EDITOR_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Temporary full-screen editor typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for temporary full-screen editor"
      ]
    },
    {
      "phase": 155,
      "title": "Workspace snapshots",
      "operatorId": "workspaces.and.layout.workspace.snapshots",
      "testId": "P155_WORKSPACE_SNAPSHOTS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Workspace snapshots typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for workspace snapshots"
      ]
    },
    {
      "phase": 156,
      "title": "Per-shot workspace recall",
      "operatorId": "workspaces.and.layout.per.shot.workspace.recall",
      "testId": "P156_PER_SHOT_WORKSPACE_RECALL_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Per-shot workspace recall typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for per-shot workspace recall"
      ]
    },
    {
      "phase": 157,
      "title": "Dual-monitor layouts",
      "operatorId": "workspaces.and.layout.dual.monitor.layouts",
      "testId": "P157_DUAL_MONITOR_LAYOUTS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Dual-monitor layouts typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dual-monitor layouts"
      ]
    },
    {
      "phase": 158,
      "title": "Small-screen adaptive layout",
      "operatorId": "workspaces.and.layout.small.screen.adaptive.layout",
      "testId": "P158_SMALL_SCREEN_ADAPTIVE_LAYOUT_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Small-screen adaptive layout typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for small-screen adaptive layout"
      ]
    },
    {
      "phase": 159,
      "title": "High-DPI density profiles",
      "operatorId": "workspaces.and.layout.high.dpi.density.profiles",
      "testId": "P159_HIGH_DPI_DENSITY_PROFILES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "High-DPI density profiles typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for high-dpi density profiles"
      ]
    },
    {
      "phase": 160,
      "title": "Panel pinning and locking",
      "operatorId": "workspaces.and.layout.panel.pinning.and.locking",
      "testId": "P160_PANEL_PINNING_AND_LOCKING_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Panel pinning and locking typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for panel pinning and locking"
      ]
    },
    {
      "phase": 161,
      "title": "Editor type quick-switch",
      "operatorId": "workspaces.and.layout.editor.type.quick.switch",
      "testId": "P161_EDITOR_TYPE_QUICK_SWITCH_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Editor type quick-switch typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for editor type quick-switch"
      ]
    },
    {
      "phase": 162,
      "title": "Layout diff and restore",
      "operatorId": "workspaces.and.layout.layout.diff.and.restore",
      "testId": "P162_LAYOUT_DIFF_AND_RESTORE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Layout diff and restore typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for layout diff and restore"
      ]
    },
    {
      "phase": 163,
      "title": "Safe factory reset",
      "operatorId": "workspaces.and.layout.safe.factory.reset",
      "testId": "P163_SAFE_FACTORY_RESET_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Safe factory reset typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for safe factory reset"
      ]
    },
    {
      "phase": 164,
      "title": "Shared team workspaces",
      "operatorId": "workspaces.and.layout.shared.team.workspaces",
      "testId": "P164_SHARED_TEAM_WORKSPACES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Shared team workspaces typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shared team workspaces"
      ]
    },
    {
      "phase": 165,
      "title": "Workspace performance budget",
      "operatorId": "workspaces.and.layout.workspace.performance.budget",
      "testId": "P165_WORKSPACE_PERFORMANCE_BUDGET_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Workspace performance budget typed contract, reversible command and deterministic evaluator",
        "Workspaces and layout workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for workspace performance budget"
      ]
    }
  ]
});
