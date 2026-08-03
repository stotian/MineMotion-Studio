import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const ANIMATION_EDITING_PROGRAM = defineUltraProgram({
  "id": "animation-editing",
  "arc": "animation",
  "program": "Animation editing",
  "problem": "making timing, curves, poses and nonlinear clips faster to inspect and safer to modify",
  "fixture": "parkour performance clip",
  "inspiration": "Blender animation-editor patterns plus MineMotion diagnostics",
  "strategy": "timeline",
  "sourceCore": "src/ultra/programs/AnimationEditingEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 10240,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 316,
      "title": "Keyframe insertion sets",
      "operatorId": "animation.editing.keyframe.insertion.sets",
      "testId": "P316_KEYFRAME_INSERTION_SETS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Keyframe insertion sets typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for keyframe insertion sets"
      ]
    },
    {
      "phase": 317,
      "title": "Dope Sheet channels",
      "operatorId": "animation.editing.dope.sheet.channels",
      "testId": "P317_DOPE_SHEET_CHANNELS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Dope Sheet channels typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dope sheet channels"
      ]
    },
    {
      "phase": 318,
      "title": "Graph curve handles",
      "operatorId": "animation.editing.graph.curve.handles",
      "testId": "P318_GRAPH_CURVE_HANDLES_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Graph curve handles typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for graph curve handles"
      ]
    },
    {
      "phase": 319,
      "title": "Breakdown pose tools",
      "operatorId": "animation.editing.breakdown.pose.tools",
      "testId": "P319_BREAKDOWN_POSE_TOOLS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Breakdown pose tools typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for breakdown pose tools"
      ]
    },
    {
      "phase": 320,
      "title": "Hold and stepped keys",
      "operatorId": "animation.editing.hold.and.stepped.keys",
      "testId": "P320_HOLD_AND_STEPPED_KEYS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Hold and stepped keys typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for hold and stepped keys"
      ]
    },
    {
      "phase": 321,
      "title": "Keyframe types and colors",
      "operatorId": "animation.editing.keyframe.types.and.colors",
      "testId": "P321_KEYFRAME_TYPES_AND_COLORS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Keyframe types and colors typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for keyframe types and colors"
      ]
    },
    {
      "phase": 322,
      "title": "Ghost and onion skin",
      "operatorId": "animation.editing.ghost.and.onion.skin",
      "testId": "P322_GHOST_AND_ONION_SKIN_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Ghost and onion skin typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for ghost and onion skin"
      ]
    },
    {
      "phase": 323,
      "title": "Motion paths",
      "operatorId": "animation.editing.motion.paths",
      "testId": "P323_MOTION_PATHS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Motion paths typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for motion paths"
      ]
    },
    {
      "phase": 324,
      "title": "Timeline markers",
      "operatorId": "animation.editing.timeline.markers",
      "testId": "P324_TIMELINE_MARKERS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Timeline markers typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for timeline markers"
      ]
    },
    {
      "phase": 325,
      "title": "Time scaling",
      "operatorId": "animation.editing.time.scaling",
      "testId": "P325_TIME_SCALING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Time scaling typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for time scaling"
      ]
    },
    {
      "phase": 326,
      "title": "Nonlinear strips",
      "operatorId": "animation.editing.nonlinear.strips",
      "testId": "P326_NONLINEAR_STRIPS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Nonlinear strips typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for nonlinear strips"
      ]
    },
    {
      "phase": 327,
      "title": "Additive animation layers",
      "operatorId": "animation.editing.additive.animation.layers",
      "testId": "P327_ADDITIVE_ANIMATION_LAYERS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Additive animation layers typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for additive animation layers"
      ]
    },
    {
      "phase": 328,
      "title": "Animation channel filters",
      "operatorId": "animation.editing.animation.channel.filters",
      "testId": "P328_ANIMATION_CHANNEL_FILTERS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Animation channel filters typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for animation channel filters"
      ]
    },
    {
      "phase": 329,
      "title": "Curve cleanup",
      "operatorId": "animation.editing.curve.cleanup",
      "testId": "P329_CURVE_CLEANUP_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Curve cleanup typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for curve cleanup"
      ]
    },
    {
      "phase": 330,
      "title": "Animation validation",
      "operatorId": "animation.editing.animation.validation",
      "testId": "P330_ANIMATION_VALIDATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Animation validation typed contract, reversible command and deterministic evaluator",
        "Animation editing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for animation validation"
      ]
    }
  ]
});
