import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const EDITORIAL_AND_SEQUENCING_PROGRAM = defineUltraProgram({
  "id": "editorial-and-sequencing",
  "arc": "editing",
  "program": "Editorial and sequencing",
  "problem": "cutting long-form sequences with fast trims, proxies, conform and offline-media recovery",
  "fixture": "episode master sequence",
  "inspiration": "Blender VSE and professional NLE workflow patterns",
  "strategy": "timeline",
  "sourceCore": "src/ultra/programs/EditorialAndSequencingEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 13824,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 421,
      "title": "Shot bin",
      "operatorId": "editorial.and.sequencing.shot.bin",
      "testId": "P421_SHOT_BIN_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Shot bin typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shot bin"
      ]
    },
    {
      "phase": 422,
      "title": "Source and record monitors",
      "operatorId": "editorial.and.sequencing.source.and.record.monitors",
      "testId": "P422_SOURCE_AND_RECORD_MONITORS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Source and record monitors typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for source and record monitors"
      ]
    },
    {
      "phase": 423,
      "title": "Razor and trim tools",
      "operatorId": "editorial.and.sequencing.razor.and.trim.tools",
      "testId": "P423_RAZOR_AND_TRIM_TOOLS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Razor and trim tools typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for razor and trim tools"
      ]
    },
    {
      "phase": 424,
      "title": "Ripple roll slip and slide edits",
      "operatorId": "editorial.and.sequencing.ripple.roll.slip.and.slide.edits",
      "testId": "P424_RIPPLE_ROLL_SLIP_AND_SLIDE_EDITS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Ripple roll slip and slide edits typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for ripple roll slip and slide edits"
      ]
    },
    {
      "phase": 425,
      "title": "Multicam sync",
      "operatorId": "editorial.and.sequencing.multicam.sync",
      "testId": "P425_MULTICAM_SYNC_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Multicam sync typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for multicam sync"
      ]
    },
    {
      "phase": 426,
      "title": "Proxy workflows",
      "operatorId": "editorial.and.sequencing.proxy.workflows",
      "testId": "P426_PROXY_WORKFLOWS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Proxy workflows typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for proxy workflows"
      ]
    },
    {
      "phase": 427,
      "title": "Speed ramps",
      "operatorId": "editorial.and.sequencing.speed.ramps",
      "testId": "P427_SPEED_RAMPS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Speed ramps typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for speed ramps"
      ]
    },
    {
      "phase": 428,
      "title": "Adjustment clips",
      "operatorId": "editorial.and.sequencing.adjustment.clips",
      "testId": "P428_ADJUSTMENT_CLIPS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Adjustment clips typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for adjustment clips"
      ]
    },
    {
      "phase": 429,
      "title": "Nested sequences",
      "operatorId": "editorial.and.sequencing.nested.sequences",
      "testId": "P429_NESTED_SEQUENCES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Nested sequences typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for nested sequences"
      ]
    },
    {
      "phase": 430,
      "title": "Transition library",
      "operatorId": "editorial.and.sequencing.transition.library",
      "testId": "P430_TRANSITION_LIBRARY_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Transition library typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for transition library"
      ]
    },
    {
      "phase": 431,
      "title": "Editorial markers",
      "operatorId": "editorial.and.sequencing.editorial.markers",
      "testId": "P431_EDITORIAL_MARKERS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Editorial markers typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for editorial markers"
      ]
    },
    {
      "phase": 432,
      "title": "EDL import and export",
      "operatorId": "editorial.and.sequencing.edl.import.and.export",
      "testId": "P432_EDL_IMPORT_AND_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "EDL import and export typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for edl import and export"
      ]
    },
    {
      "phase": 433,
      "title": "Conform report",
      "operatorId": "editorial.and.sequencing.conform.report",
      "testId": "P433_CONFORM_REPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Conform report typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for conform report"
      ]
    },
    {
      "phase": 434,
      "title": "Offline media handling",
      "operatorId": "editorial.and.sequencing.offline.media.handling",
      "testId": "P434_OFFLINE_MEDIA_HANDLING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Offline media handling typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for offline media handling"
      ]
    },
    {
      "phase": 435,
      "title": "Master sequence validation",
      "operatorId": "editorial.and.sequencing.master.sequence.validation",
      "testId": "P435_MASTER_SEQUENCE_VALIDATION_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Master sequence validation typed contract, reversible command and deterministic evaluator",
        "Editorial and sequencing workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for master sequence validation"
      ]
    }
  ]
});
