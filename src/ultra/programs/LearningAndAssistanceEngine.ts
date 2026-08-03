import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const LEARNING_AND_ASSISTANCE_PROGRAM = defineUltraProgram({
  "id": "learning-and-assistance",
  "arc": "learning",
  "program": "Learning and assistance",
  "problem": "helping new and expert users discover the correct workflow without fake automation or destructive guesses",
  "fixture": "first cinematic onboarding",
  "inspiration": "Community discoverability pain points plus MineMotion teaching tools",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/LearningAndAssistanceEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 18944,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 571,
      "title": "Guided onboarding",
      "operatorId": "learning.and.assistance.guided.onboarding",
      "testId": "P571_GUIDED_ONBOARDING_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Guided onboarding typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for guided onboarding"
      ]
    },
    {
      "phase": 572,
      "title": "Context help",
      "operatorId": "learning.and.assistance.context.help",
      "testId": "P572_CONTEXT_HELP_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Context help typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for context help"
      ]
    },
    {
      "phase": 573,
      "title": "Interactive tutorials",
      "operatorId": "learning.and.assistance.interactive.tutorials",
      "testId": "P573_INTERACTIVE_TUTORIALS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Interactive tutorials typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for interactive tutorials"
      ]
    },
    {
      "phase": 574,
      "title": "Sample projects",
      "operatorId": "learning.and.assistance.sample.projects",
      "testId": "P574_SAMPLE_PROJECTS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Sample projects typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for sample projects"
      ]
    },
    {
      "phase": 575,
      "title": "Template chooser",
      "operatorId": "learning.and.assistance.template.chooser",
      "testId": "P575_TEMPLATE_CHOOSER_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Template chooser typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for template chooser"
      ]
    },
    {
      "phase": 576,
      "title": "Empty-state guidance",
      "operatorId": "learning.and.assistance.empty.state.guidance",
      "testId": "P576_EMPTY_STATE_GUIDANCE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Empty-state guidance typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for empty-state guidance"
      ]
    },
    {
      "phase": 577,
      "title": "Error recovery suggestions",
      "operatorId": "learning.and.assistance.error.recovery.suggestions",
      "testId": "P577_ERROR_RECOVERY_SUGGESTIONS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Error recovery suggestions typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for error recovery suggestions"
      ]
    },
    {
      "phase": 578,
      "title": "Shortcut coach",
      "operatorId": "learning.and.assistance.shortcut.coach",
      "testId": "P578_SHORTCUT_COACH_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Shortcut coach typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for shortcut coach"
      ]
    },
    {
      "phase": 579,
      "title": "Workflow checklists",
      "operatorId": "learning.and.assistance.workflow.checklists",
      "testId": "P579_WORKFLOW_CHECKLISTS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Workflow checklists typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for workflow checklists"
      ]
    },
    {
      "phase": 580,
      "title": "Production presets",
      "operatorId": "learning.and.assistance.production.presets",
      "testId": "P580_PRODUCTION_PRESETS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Production presets typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for production presets"
      ]
    },
    {
      "phase": 581,
      "title": "Searchable documentation",
      "operatorId": "learning.and.assistance.searchable.documentation",
      "testId": "P581_SEARCHABLE_DOCUMENTATION_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Searchable documentation typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for searchable documentation"
      ]
    },
    {
      "phase": 582,
      "title": "In-app changelog",
      "operatorId": "learning.and.assistance.in.app.changelog",
      "testId": "P582_IN_APP_CHANGELOG_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "In-app changelog typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for in-app changelog"
      ]
    },
    {
      "phase": 583,
      "title": "Skill-level modes",
      "operatorId": "learning.and.assistance.skill.level.modes",
      "testId": "P583_SKILL_LEVEL_MODES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Skill-level modes typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for skill-level modes"
      ]
    },
    {
      "phase": 584,
      "title": "Non-destructive experimentation",
      "operatorId": "learning.and.assistance.non.destructive.experimentation",
      "testId": "P584_NON_DESTRUCTIVE_EXPERIMENTATION_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Non-destructive experimentation typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for non-destructive experimentation"
      ]
    },
    {
      "phase": 585,
      "title": "Learning progress dashboard",
      "operatorId": "learning.and.assistance.learning.progress.dashboard",
      "testId": "P585_LEARNING_PROGRESS_DASHBOARD_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Learning progress dashboard typed contract, reversible command and deterministic evaluator",
        "Learning and assistance workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for learning progress dashboard"
      ]
    }
  ]
});
