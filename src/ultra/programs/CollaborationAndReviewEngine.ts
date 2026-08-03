import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const COLLABORATION_AND_REVIEW_PROGRAM = defineUltraProgram({
  "id": "collaboration-and-review",
  "arc": "collaboration",
  "program": "Collaboration and review",
  "problem": "collecting actionable review notes and approvals without exposing private assets or losing version context",
  "fixture": "remote director review",
  "inspiration": "Community review workflow plus MineMotion privacy controls",
  "strategy": "review",
  "sourceCore": "src/ultra/programs/CollaborationAndReviewEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 15872,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 481,
      "title": "Review sessions",
      "operatorId": "collaboration.and.review.review.sessions",
      "testId": "P481_REVIEW_SESSIONS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Review sessions typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for review sessions"
      ]
    },
    {
      "phase": 482,
      "title": "Frame annotations",
      "operatorId": "collaboration.and.review.frame.annotations",
      "testId": "P482_FRAME_ANNOTATIONS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Frame annotations typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for frame annotations"
      ]
    },
    {
      "phase": 483,
      "title": "Version compare",
      "operatorId": "collaboration.and.review.version.compare",
      "testId": "P483_VERSION_COMPARE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Version compare typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for version compare"
      ]
    },
    {
      "phase": 484,
      "title": "Side-by-side takes",
      "operatorId": "collaboration.and.review.side.by.side.takes",
      "testId": "P484_SIDE_BY_SIDE_TAKES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Side-by-side takes typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for side-by-side takes"
      ]
    },
    {
      "phase": 485,
      "title": "Approval states",
      "operatorId": "collaboration.and.review.approval.states",
      "testId": "P485_APPROVAL_STATES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Approval states typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for approval states"
      ]
    },
    {
      "phase": 486,
      "title": "Assigned notes",
      "operatorId": "collaboration.and.review.assigned.notes",
      "testId": "P486_ASSIGNED_NOTES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Assigned notes typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for assigned notes"
      ]
    },
    {
      "phase": 487,
      "title": "Due dates",
      "operatorId": "collaboration.and.review.due.dates",
      "testId": "P487_DUE_DATES_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Due dates typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for due dates"
      ]
    },
    {
      "phase": 488,
      "title": "Comment threads",
      "operatorId": "collaboration.and.review.comment.threads",
      "testId": "P488_COMMENT_THREADS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Comment threads typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for comment threads"
      ]
    },
    {
      "phase": 489,
      "title": "Offline review package",
      "operatorId": "collaboration.and.review.offline.review.package",
      "testId": "P489_OFFLINE_REVIEW_PACKAGE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Offline review package typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for offline review package"
      ]
    },
    {
      "phase": 490,
      "title": "Redacted review export",
      "operatorId": "collaboration.and.review.redacted.review.export",
      "testId": "P490_REDACTED_REVIEW_EXPORT_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Redacted review export typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for redacted review export"
      ]
    },
    {
      "phase": 491,
      "title": "Conflict-free note merge",
      "operatorId": "collaboration.and.review.conflict.free.note.merge",
      "testId": "P491_CONFLICT_FREE_NOTE_MERGE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Conflict-free note merge typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for conflict-free note merge"
      ]
    },
    {
      "phase": 492,
      "title": "Team activity log",
      "operatorId": "collaboration.and.review.team.activity.log",
      "testId": "P492_TEAM_ACTIVITY_LOG_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Team activity log typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for team activity log"
      ]
    },
    {
      "phase": 493,
      "title": "Role permissions",
      "operatorId": "collaboration.and.review.role.permissions",
      "testId": "P493_ROLE_PERMISSIONS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Role permissions typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for role permissions"
      ]
    },
    {
      "phase": 494,
      "title": "Review analytics",
      "operatorId": "collaboration.and.review.review.analytics",
      "testId": "P494_REVIEW_ANALYTICS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Review analytics typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for review analytics"
      ]
    },
    {
      "phase": 495,
      "title": "Final sign-off ledger",
      "operatorId": "collaboration.and.review.final.sign.off.ledger",
      "testId": "P495_FINAL_SIGN_OFF_LEDGER_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Final sign-off ledger typed contract, reversible command and deterministic evaluator",
        "Collaboration and review workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for final sign-off ledger"
      ]
    }
  ]
});
