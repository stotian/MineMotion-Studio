import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const AUTOMATION_AND_SCRIPTING_PROGRAM = defineUltraProgram({
  "id": "automation-and-scripting",
  "arc": "automation",
  "program": "Automation and scripting",
  "problem": "removing repetitive production work through deterministic permissioned local automation",
  "fixture": "batch shot processing job",
  "inspiration": "Blender scripting ideas with a safer MineMotion boundary",
  "strategy": "graph",
  "sourceCore": "src/ultra/programs/AutomationAndScriptingEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 16384,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 496,
      "title": "Macro recorder",
      "operatorId": "automation.and.scripting.macro.recorder",
      "testId": "P496_MACRO_RECORDER_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Macro recorder typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for macro recorder"
      ]
    },
    {
      "phase": 497,
      "title": "Batch rename scripts",
      "operatorId": "automation.and.scripting.batch.rename.scripts",
      "testId": "P497_BATCH_RENAME_SCRIPTS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Batch rename scripts typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for batch rename scripts"
      ]
    },
    {
      "phase": 498,
      "title": "Batch render recipes",
      "operatorId": "automation.and.scripting.batch.render.recipes",
      "testId": "P498_BATCH_RENDER_RECIPES_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Batch render recipes typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for batch render recipes"
      ]
    },
    {
      "phase": 499,
      "title": "Command palette actions",
      "operatorId": "automation.and.scripting.command.palette.actions",
      "testId": "P499_COMMAND_PALETTE_ACTIONS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Command palette actions typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for command palette actions"
      ]
    },
    {
      "phase": 500,
      "title": "Safe expression engine",
      "operatorId": "automation.and.scripting.safe.expression.engine",
      "testId": "P500_SAFE_EXPRESSION_ENGINE_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Safe expression engine typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for safe expression engine"
      ]
    },
    {
      "phase": 501,
      "title": "Node graph automation",
      "operatorId": "automation.and.scripting.node.graph.automation",
      "testId": "P501_NODE_GRAPH_AUTOMATION_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Node graph automation typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for node graph automation"
      ]
    },
    {
      "phase": 502,
      "title": "Project template automation",
      "operatorId": "automation.and.scripting.project.template.automation",
      "testId": "P502_PROJECT_TEMPLATE_AUTOMATION_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Project template automation typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for project template automation"
      ]
    },
    {
      "phase": 503,
      "title": "Event hooks",
      "operatorId": "automation.and.scripting.event.hooks",
      "testId": "P503_EVENT_HOOKS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Event hooks typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for event hooks"
      ]
    },
    {
      "phase": 504,
      "title": "Scheduled local jobs",
      "operatorId": "automation.and.scripting.scheduled.local.jobs",
      "testId": "P504_SCHEDULED_LOCAL_JOBS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Scheduled local jobs typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for scheduled local jobs"
      ]
    },
    {
      "phase": 505,
      "title": "Headless CLI",
      "operatorId": "automation.and.scripting.headless.cli",
      "testId": "P505_HEADLESS_CLI_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Headless CLI typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for headless cli"
      ]
    },
    {
      "phase": 506,
      "title": "Deterministic job manifests",
      "operatorId": "automation.and.scripting.deterministic.job.manifests",
      "testId": "P506_DETERMINISTIC_JOB_MANIFESTS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Deterministic job manifests typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for deterministic job manifests"
      ]
    },
    {
      "phase": 507,
      "title": "Parameter sweeps",
      "operatorId": "automation.and.scripting.parameter.sweeps",
      "testId": "P507_PARAMETER_SWEEPS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Parameter sweeps typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for parameter sweeps"
      ]
    },
    {
      "phase": 508,
      "title": "Report generation",
      "operatorId": "automation.and.scripting.report.generation",
      "testId": "P508_REPORT_GENERATION_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Report generation typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for report generation"
      ]
    },
    {
      "phase": 509,
      "title": "Script permission prompts",
      "operatorId": "automation.and.scripting.script.permission.prompts",
      "testId": "P509_SCRIPT_PERMISSION_PROMPTS_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Script permission prompts typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for script permission prompts"
      ]
    },
    {
      "phase": 510,
      "title": "Automation audit log",
      "operatorId": "automation.and.scripting.automation.audit.log",
      "testId": "P510_AUTOMATION_AUDIT_LOG_ACCEPTANCE",
      "evidence": "security",
      "deliverables": [
        "Automation audit log typed contract, reversible command and deterministic evaluator",
        "Automation and scripting workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for automation audit log"
      ]
    }
  ]
});
