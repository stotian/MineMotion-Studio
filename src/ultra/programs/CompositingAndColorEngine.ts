import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const COMPOSITING_AND_COLOR_PROGRAM = defineUltraProgram({
  "id": "compositing-and-color",
  "arc": "compositing",
  "program": "Compositing and color",
  "problem": "finishing render passes, masks and color consistently across SDR and HDR deliveries",
  "fixture": "multi-pass night shot",
  "inspiration": "Blender compositor/color patterns plus MineMotion delivery checks",
  "strategy": "graph",
  "sourceCore": "src/ultra/programs/CompositingAndColorEngine.ts",
  "maximumOperations": 8,
  "maximumResourceUnits": 14336,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 436,
      "title": "Node compositing workspace",
      "operatorId": "compositing.and.color.node.compositing.workspace",
      "testId": "P436_NODE_COMPOSITING_WORKSPACE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Node compositing workspace typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for node compositing workspace"
      ]
    },
    {
      "phase": 437,
      "title": "Render layer inputs",
      "operatorId": "compositing.and.color.render.layer.inputs",
      "testId": "P437_RENDER_LAYER_INPUTS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Render layer inputs typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render layer inputs"
      ]
    },
    {
      "phase": 438,
      "title": "Cryptomatte selections",
      "operatorId": "compositing.and.color.cryptomatte.selections",
      "testId": "P438_CRYPTOMATTE_SELECTIONS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Cryptomatte selections typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for cryptomatte selections"
      ]
    },
    {
      "phase": 439,
      "title": "Rotoshape masks",
      "operatorId": "compositing.and.color.rotoshape.masks",
      "testId": "P439_ROTOSHAPE_MASKS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Rotoshape masks typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for rotoshape masks"
      ]
    },
    {
      "phase": 440,
      "title": "Keying tools",
      "operatorId": "compositing.and.color.keying.tools",
      "testId": "P440_KEYING_TOOLS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Keying tools typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for keying tools"
      ]
    },
    {
      "phase": 441,
      "title": "Tracking data import",
      "operatorId": "compositing.and.color.tracking.data.import",
      "testId": "P441_TRACKING_DATA_IMPORT_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Tracking data import typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for tracking data import"
      ]
    },
    {
      "phase": 442,
      "title": "Glow blur and sharpen",
      "operatorId": "compositing.and.color.glow.blur.and.sharpen",
      "testId": "P442_GLOW_BLUR_AND_SHARPEN_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Glow blur and sharpen typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for glow blur and sharpen"
      ]
    },
    {
      "phase": 443,
      "title": "Depth effects",
      "operatorId": "compositing.and.color.depth.effects",
      "testId": "P443_DEPTH_EFFECTS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Depth effects typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for depth effects"
      ]
    },
    {
      "phase": 444,
      "title": "Color wheels",
      "operatorId": "compositing.and.color.color.wheels",
      "testId": "P444_COLOR_WHEELS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Color wheels typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for color wheels"
      ]
    },
    {
      "phase": 445,
      "title": "Curves and levels",
      "operatorId": "compositing.and.color.curves.and.levels",
      "testId": "P445_CURVES_AND_LEVELS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Curves and levels typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for curves and levels"
      ]
    },
    {
      "phase": 446,
      "title": "LUT management",
      "operatorId": "compositing.and.color.lut.management",
      "testId": "P446_LUT_MANAGEMENT_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "LUT management typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lut management"
      ]
    },
    {
      "phase": 447,
      "title": "Shot matching",
      "operatorId": "compositing.and.color.shot.matching",
      "testId": "P447_SHOT_MATCHING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Shot matching typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shot matching"
      ]
    },
    {
      "phase": 448,
      "title": "HDR scopes",
      "operatorId": "compositing.and.color.hdr.scopes",
      "testId": "P448_HDR_SCOPES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "HDR scopes typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for hdr scopes"
      ]
    },
    {
      "phase": 449,
      "title": "Display transform preview",
      "operatorId": "compositing.and.color.display.transform.preview",
      "testId": "P449_DISPLAY_TRANSFORM_PREVIEW_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Display transform preview typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for display transform preview"
      ]
    },
    {
      "phase": 450,
      "title": "Delivery color validation",
      "operatorId": "compositing.and.color.delivery.color.validation",
      "testId": "P450_DELIVERY_COLOR_VALIDATION_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Delivery color validation typed contract, reversible command and deterministic evaluator",
        "Compositing and color workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for delivery color validation"
      ]
    }
  ]
});
