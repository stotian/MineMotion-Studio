import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const RENDERING_AND_SCALABILITY_PROGRAM = defineUltraProgram({
  "id": "rendering-and-scalability",
  "arc": "final-render",
  "program": "Rendering and scalability",
  "problem": "keeping preview and final rendering predictable from small laptops to large distributed scenes",
  "fixture": "million-instance benchmark scene",
  "inspiration": "Blender render workflow plus MineMotion scalability constraints",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/RenderingAndScalabilityEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 14848,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 451,
      "title": "Preview renderer profiles",
      "operatorId": "rendering.and.scalability.preview.renderer.profiles",
      "testId": "P451_PREVIEW_RENDERER_PROFILES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Preview renderer profiles typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for preview renderer profiles"
      ]
    },
    {
      "phase": 452,
      "title": "Final renderer profiles",
      "operatorId": "rendering.and.scalability.final.renderer.profiles",
      "testId": "P452_FINAL_RENDERER_PROFILES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Final renderer profiles typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for final renderer profiles"
      ]
    },
    {
      "phase": 453,
      "title": "Adaptive sampling",
      "operatorId": "rendering.and.scalability.adaptive.sampling",
      "testId": "P453_ADAPTIVE_SAMPLING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Adaptive sampling typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for adaptive sampling"
      ]
    },
    {
      "phase": 454,
      "title": "Tile scheduling",
      "operatorId": "rendering.and.scalability.tile.scheduling",
      "testId": "P454_TILE_SCHEDULING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Tile scheduling typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for tile scheduling"
      ]
    },
    {
      "phase": 455,
      "title": "Render checkpoints",
      "operatorId": "rendering.and.scalability.render.checkpoints",
      "testId": "P455_RENDER_CHECKPOINTS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Render checkpoints typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render checkpoints"
      ]
    },
    {
      "phase": 456,
      "title": "Denoising",
      "operatorId": "rendering.and.scalability.denoising",
      "testId": "P456_DENOISING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Denoising typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for denoising"
      ]
    },
    {
      "phase": 457,
      "title": "Render passes",
      "operatorId": "rendering.and.scalability.render.passes",
      "testId": "P457_RENDER_PASSES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Render passes typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render passes"
      ]
    },
    {
      "phase": 458,
      "title": "Motion blur",
      "operatorId": "rendering.and.scalability.motion.blur",
      "testId": "P458_MOTION_BLUR_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Motion blur typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for motion blur"
      ]
    },
    {
      "phase": 459,
      "title": "Depth of field",
      "operatorId": "rendering.and.scalability.depth.of.field",
      "testId": "P459_DEPTH_OF_FIELD_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Depth of field typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for depth of field"
      ]
    },
    {
      "phase": 460,
      "title": "Volumetrics",
      "operatorId": "rendering.and.scalability.volumetrics",
      "testId": "P460_VOLUMETRICS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Volumetrics typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for volumetrics"
      ]
    },
    {
      "phase": 461,
      "title": "Large-scene culling",
      "operatorId": "rendering.and.scalability.large.scene.culling",
      "testId": "P461_LARGE_SCENE_CULLING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Large-scene culling typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for large-scene culling"
      ]
    },
    {
      "phase": 462,
      "title": "Instancing",
      "operatorId": "rendering.and.scalability.instancing",
      "testId": "P462_INSTANCING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Instancing typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for instancing"
      ]
    },
    {
      "phase": 463,
      "title": "Out-of-core textures",
      "operatorId": "rendering.and.scalability.out.of.core.textures",
      "testId": "P463_OUT_OF_CORE_TEXTURES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Out-of-core textures typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for out-of-core textures"
      ]
    },
    {
      "phase": 464,
      "title": "Distributed rendering",
      "operatorId": "rendering.and.scalability.distributed.rendering",
      "testId": "P464_DISTRIBUTED_RENDERING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Distributed rendering typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for distributed rendering"
      ]
    },
    {
      "phase": 465,
      "title": "Render regression suite",
      "operatorId": "rendering.and.scalability.render.regression.suite",
      "testId": "P465_RENDER_REGRESSION_SUITE_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Render regression suite typed contract, reversible command and deterministic evaluator",
        "Rendering and scalability workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render regression suite"
      ]
    }
  ]
});
