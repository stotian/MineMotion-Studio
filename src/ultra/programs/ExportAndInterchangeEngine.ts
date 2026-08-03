import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const EXPORT_AND_INTERCHANGE_PROGRAM = defineUltraProgram({
  "id": "export-and-interchange",
  "arc": "export",
  "program": "Export and interchange",
  "problem": "delivering images, video, audio, caches and project packages with explicit manifests and compatibility",
  "fixture": "multi-format delivery package",
  "inspiration": "MineMotion interoperability and professional handoff",
  "strategy": "io",
  "sourceCore": "src/ultra/programs/ExportAndInterchangeEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 15360,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": true,
  "phases": [
    {
      "phase": 466,
      "title": "Image sequence export",
      "operatorId": "export.and.interchange.image.sequence.export",
      "testId": "P466_IMAGE_SEQUENCE_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Image sequence export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for image sequence export"
      ]
    },
    {
      "phase": 467,
      "title": "Video export",
      "operatorId": "export.and.interchange.video.export",
      "testId": "P467_VIDEO_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Video export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for video export"
      ]
    },
    {
      "phase": 468,
      "title": "Alpha export",
      "operatorId": "export.and.interchange.alpha.export",
      "testId": "P468_ALPHA_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Alpha export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for alpha export"
      ]
    },
    {
      "phase": 469,
      "title": "Audio stem export",
      "operatorId": "export.and.interchange.audio.stem.export",
      "testId": "P469_AUDIO_STEM_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Audio stem export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for audio stem export"
      ]
    },
    {
      "phase": 470,
      "title": "Project archive export",
      "operatorId": "export.and.interchange.project.archive.export",
      "testId": "P470_PROJECT_ARCHIVE_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Project archive export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for project archive export"
      ]
    },
    {
      "phase": 471,
      "title": "Blender interchange",
      "operatorId": "export.and.interchange.blender.interchange",
      "testId": "P471_BLENDER_INTERCHANGE_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Blender interchange typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for blender interchange"
      ]
    },
    {
      "phase": 472,
      "title": "Blockbench interchange",
      "operatorId": "export.and.interchange.blockbench.interchange",
      "testId": "P472_BLOCKBENCH_INTERCHANGE_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Blockbench interchange typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for blockbench interchange"
      ]
    },
    {
      "phase": 473,
      "title": "glTF export",
      "operatorId": "export.and.interchange.gltf.export",
      "testId": "P473_GLTF_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "glTF export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gltf export"
      ]
    },
    {
      "phase": 474,
      "title": "Alembic-like cache plan",
      "operatorId": "export.and.interchange.alembic.like.cache.plan",
      "testId": "P474_ALEMBIC_LIKE_CACHE_PLAN_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Alembic-like cache plan typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for alembic-like cache plan"
      ]
    },
    {
      "phase": 475,
      "title": "EDL and XML export",
      "operatorId": "export.and.interchange.edl.and.xml.export",
      "testId": "P475_EDL_AND_XML_EXPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "EDL and XML export typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for edl and xml export"
      ]
    },
    {
      "phase": 476,
      "title": "Minecraft datapack handoff",
      "operatorId": "export.and.interchange.minecraft.datapack.handoff",
      "testId": "P476_MINECRAFT_DATAPACK_HANDOFF_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Minecraft datapack handoff typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for minecraft datapack handoff"
      ]
    },
    {
      "phase": 477,
      "title": "Resource-pack handoff",
      "operatorId": "export.and.interchange.resource.pack.handoff",
      "testId": "P477_RESOURCE_PACK_HANDOFF_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Resource-pack handoff typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for resource-pack handoff"
      ]
    },
    {
      "phase": 478,
      "title": "Render manifest",
      "operatorId": "export.and.interchange.render.manifest",
      "testId": "P478_RENDER_MANIFEST_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Render manifest typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for render manifest"
      ]
    },
    {
      "phase": 479,
      "title": "Checksums and signatures",
      "operatorId": "export.and.interchange.checksums.and.signatures",
      "testId": "P479_CHECKSUMS_AND_SIGNATURES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Checksums and signatures typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for checksums and signatures"
      ]
    },
    {
      "phase": 480,
      "title": "Delivery package validator",
      "operatorId": "export.and.interchange.delivery.package.validator",
      "testId": "P480_DELIVERY_PACKAGE_VALIDATOR_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Delivery package validator typed contract, reversible command and deterministic evaluator",
        "Export and interchange workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for delivery package validator"
      ]
    }
  ]
});
