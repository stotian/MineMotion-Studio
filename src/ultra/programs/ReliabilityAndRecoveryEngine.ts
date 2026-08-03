import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const RELIABILITY_AND_RECOVERY_PROGRAM = defineUltraProgram({
  "id": "reliability-and-recovery",
  "arc": "reliability",
  "program": "Reliability and recovery",
  "problem": "preventing lost work and recovering safely from crashes, low disk, corruption and interrupted exports",
  "fixture": "forced-crash recovery drill",
  "inspiration": "Community lost-work pain points plus MineMotion fail-safe design",
  "strategy": "review",
  "sourceCore": "src/ultra/programs/ReliabilityAndRecoveryEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 17920,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 541,
      "title": "Crash-safe journal",
      "operatorId": "reliability.and.recovery.crash.safe.journal",
      "testId": "P541_CRASH_SAFE_JOURNAL_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Crash-safe journal typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for crash-safe journal"
      ]
    },
    {
      "phase": 542,
      "title": "Autosave rotation",
      "operatorId": "reliability.and.recovery.autosave.rotation",
      "testId": "P542_AUTOSAVE_ROTATION_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Autosave rotation typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for autosave rotation"
      ]
    },
    {
      "phase": 543,
      "title": "Recovery browser",
      "operatorId": "reliability.and.recovery.recovery.browser",
      "testId": "P543_RECOVERY_BROWSER_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Recovery browser typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for recovery browser"
      ]
    },
    {
      "phase": 544,
      "title": "Corruption detection",
      "operatorId": "reliability.and.recovery.corruption.detection",
      "testId": "P544_CORRUPTION_DETECTION_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Corruption detection typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for corruption detection"
      ]
    },
    {
      "phase": 545,
      "title": "Partial project salvage",
      "operatorId": "reliability.and.recovery.partial.project.salvage",
      "testId": "P545_PARTIAL_PROJECT_SALVAGE_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Partial project salvage typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for partial project salvage"
      ]
    },
    {
      "phase": 546,
      "title": "Undo integrity checks",
      "operatorId": "reliability.and.recovery.undo.integrity.checks",
      "testId": "P546_UNDO_INTEGRITY_CHECKS_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Undo integrity checks typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for undo integrity checks"
      ]
    },
    {
      "phase": 547,
      "title": "Transactional saves",
      "operatorId": "reliability.and.recovery.transactional.saves",
      "testId": "P547_TRANSACTIONAL_SAVES_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Transactional saves typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for transactional saves"
      ]
    },
    {
      "phase": 548,
      "title": "Atomic cache writes",
      "operatorId": "reliability.and.recovery.atomic.cache.writes",
      "testId": "P548_ATOMIC_CACHE_WRITES_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Atomic cache writes typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for atomic cache writes"
      ]
    },
    {
      "phase": 549,
      "title": "Stale lock handling",
      "operatorId": "reliability.and.recovery.stale.lock.handling",
      "testId": "P549_STALE_LOCK_HANDLING_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Stale lock handling typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for stale lock handling"
      ]
    },
    {
      "phase": 550,
      "title": "Low-disk warnings",
      "operatorId": "reliability.and.recovery.low.disk.warnings",
      "testId": "P550_LOW_DISK_WARNINGS_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Low-disk warnings typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for low-disk warnings"
      ]
    },
    {
      "phase": 551,
      "title": "Interrupted export recovery",
      "operatorId": "reliability.and.recovery.interrupted.export.recovery",
      "testId": "P551_INTERRUPTED_EXPORT_RECOVERY_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Interrupted export recovery typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for interrupted export recovery"
      ]
    },
    {
      "phase": 552,
      "title": "Dependency fallback",
      "operatorId": "reliability.and.recovery.dependency.fallback",
      "testId": "P552_DEPENDENCY_FALLBACK_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Dependency fallback typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dependency fallback"
      ]
    },
    {
      "phase": 553,
      "title": "Support bundle",
      "operatorId": "reliability.and.recovery.support.bundle",
      "testId": "P553_SUPPORT_BUNDLE_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Support bundle typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for support bundle"
      ]
    },
    {
      "phase": 554,
      "title": "Privacy-safe logs",
      "operatorId": "reliability.and.recovery.privacy.safe.logs",
      "testId": "P554_PRIVACY_SAFE_LOGS_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Privacy-safe logs typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for privacy-safe logs"
      ]
    },
    {
      "phase": 555,
      "title": "Disaster recovery drill",
      "operatorId": "reliability.and.recovery.disaster.recovery.drill",
      "testId": "P555_DISASTER_RECOVERY_DRILL_ACCEPTANCE",
      "evidence": "reliability",
      "deliverables": [
        "Disaster recovery drill typed contract, reversible command and deterministic evaluator",
        "Reliability and recovery workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for disaster recovery drill"
      ]
    }
  ]
});
