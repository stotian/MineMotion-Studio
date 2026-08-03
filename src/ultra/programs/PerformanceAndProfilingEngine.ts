import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const PERFORMANCE_AND_PROFILING_PROGRAM = defineUltraProgram({
  "id": "performance-and-profiling",
  "arc": "performance-tools",
  "program": "Performance and profiling",
  "problem": "making CPU GPU memory I/O and evaluation costs visible before they become production blockers",
  "fixture": "heavy battle benchmark",
  "inspiration": "Blender-style statistics plus MineMotion measurable budgets",
  "strategy": "simulation",
  "sourceCore": "src/ultra/programs/PerformanceAndProfilingEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 17408,
  "maximumSelection": 16384,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 526,
      "title": "Frame-time HUD",
      "operatorId": "performance.and.profiling.frame.time.hud",
      "testId": "P526_FRAME_TIME_HUD_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Frame-time HUD typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for frame-time hud"
      ]
    },
    {
      "phase": 527,
      "title": "CPU profiler",
      "operatorId": "performance.and.profiling.cpu.profiler",
      "testId": "P527_CPU_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "CPU profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for cpu profiler"
      ]
    },
    {
      "phase": 528,
      "title": "GPU profiler",
      "operatorId": "performance.and.profiling.gpu.profiler",
      "testId": "P528_GPU_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "GPU profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gpu profiler"
      ]
    },
    {
      "phase": 529,
      "title": "Memory profiler",
      "operatorId": "performance.and.profiling.memory.profiler",
      "testId": "P529_MEMORY_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Memory profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for memory profiler"
      ]
    },
    {
      "phase": 530,
      "title": "Asset memory report",
      "operatorId": "performance.and.profiling.asset.memory.report",
      "testId": "P530_ASSET_MEMORY_REPORT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Asset memory report typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for asset memory report"
      ]
    },
    {
      "phase": 531,
      "title": "Draw-call report",
      "operatorId": "performance.and.profiling.draw.call.report",
      "testId": "P531_DRAW_CALL_REPORT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Draw-call report typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for draw-call report"
      ]
    },
    {
      "phase": 532,
      "title": "Shader compile report",
      "operatorId": "performance.and.profiling.shader.compile.report",
      "testId": "P532_SHADER_COMPILE_REPORT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Shader compile report typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shader compile report"
      ]
    },
    {
      "phase": 533,
      "title": "Timeline evaluation profiler",
      "operatorId": "performance.and.profiling.timeline.evaluation.profiler",
      "testId": "P533_TIMELINE_EVALUATION_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Timeline evaluation profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for timeline evaluation profiler"
      ]
    },
    {
      "phase": 534,
      "title": "Simulation profiler",
      "operatorId": "performance.and.profiling.simulation.profiler",
      "testId": "P534_SIMULATION_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Simulation profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for simulation profiler"
      ]
    },
    {
      "phase": 535,
      "title": "I/O profiler",
      "operatorId": "performance.and.profiling.i.o.profiler",
      "testId": "P535_I_O_PROFILER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "I/O profiler typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for i/o profiler"
      ]
    },
    {
      "phase": 536,
      "title": "Background task monitor",
      "operatorId": "performance.and.profiling.background.task.monitor",
      "testId": "P536_BACKGROUND_TASK_MONITOR_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Background task monitor typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for background task monitor"
      ]
    },
    {
      "phase": 537,
      "title": "Performance budgets",
      "operatorId": "performance.and.profiling.performance.budgets",
      "testId": "P537_PERFORMANCE_BUDGETS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Performance budgets typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for performance budgets"
      ]
    },
    {
      "phase": 538,
      "title": "Regression baselines",
      "operatorId": "performance.and.profiling.regression.baselines",
      "testId": "P538_REGRESSION_BASELINES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Regression baselines typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for regression baselines"
      ]
    },
    {
      "phase": 539,
      "title": "Automatic quality scaling",
      "operatorId": "performance.and.profiling.automatic.quality.scaling",
      "testId": "P539_AUTOMATIC_QUALITY_SCALING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Automatic quality scaling typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for automatic quality scaling"
      ]
    },
    {
      "phase": 540,
      "title": "Optimization recommendations",
      "operatorId": "performance.and.profiling.optimization.recommendations",
      "testId": "P540_OPTIMIZATION_RECOMMENDATIONS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Optimization recommendations typed contract, reversible command and deterministic evaluator",
        "Performance and profiling workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for optimization recommendations"
      ]
    }
  ]
});
