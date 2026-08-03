import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const MODELING_AND_BLOCK_AUTHORING_PROGRAM = defineUltraProgram({
  "id": "modeling-and-block-authoring",
  "arc": "modeling",
  "program": "Modeling and block authoring",
  "problem": "creating Minecraft-readable forms quickly while guarding silhouettes, snapping and collision intent",
  "fixture": "modular fortress kit",
  "inspiration": "Blender edit/modifier patterns adapted to blocks",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/ModelingAndBlockAuthoringEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 7168,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 226,
      "title": "Block primitive toolkit",
      "operatorId": "modeling.and.block.authoring.block.primitive.toolkit",
      "testId": "P226_BLOCK_PRIMITIVE_TOOLKIT_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Block primitive toolkit typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for block primitive toolkit"
      ]
    },
    {
      "phase": 227,
      "title": "Grid and voxel snapping",
      "operatorId": "modeling.and.block.authoring.grid.and.voxel.snapping",
      "testId": "P227_GRID_AND_VOXEL_SNAPPING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Grid and voxel snapping typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for grid and voxel snapping"
      ]
    },
    {
      "phase": 228,
      "title": "Face edge and vertex edit modes",
      "operatorId": "modeling.and.block.authoring.face.edge.and.vertex.edit.modes",
      "testId": "P228_FACE_EDGE_AND_VERTEX_EDIT_MODES_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Face edge and vertex edit modes typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for face edge and vertex edit modes"
      ]
    },
    {
      "phase": 229,
      "title": "Minecraft silhouette guard",
      "operatorId": "modeling.and.block.authoring.minecraft.silhouette.guard",
      "testId": "P229_MINECRAFT_SILHOUETTE_GUARD_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Minecraft silhouette guard typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for minecraft silhouette guard"
      ]
    },
    {
      "phase": 230,
      "title": "Non-destructive bevel substitute",
      "operatorId": "modeling.and.block.authoring.non.destructive.bevel.substitute",
      "testId": "P230_NON_DESTRUCTIVE_BEVEL_SUBSTITUTE_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Non-destructive bevel substitute typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for non-destructive bevel substitute"
      ]
    },
    {
      "phase": 231,
      "title": "Boolean block operations",
      "operatorId": "modeling.and.block.authoring.boolean.block.operations",
      "testId": "P231_BOOLEAN_BLOCK_OPERATIONS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Boolean block operations typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for boolean block operations"
      ]
    },
    {
      "phase": 232,
      "title": "Stair and slab shape composer",
      "operatorId": "modeling.and.block.authoring.stair.and.slab.shape.composer",
      "testId": "P232_STAIR_AND_SLAB_SHAPE_COMPOSER_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Stair and slab shape composer typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for stair and slab shape composer"
      ]
    },
    {
      "phase": 233,
      "title": "Modular kit assembly",
      "operatorId": "modeling.and.block.authoring.modular.kit.assembly",
      "testId": "P233_MODULAR_KIT_ASSEMBLY_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Modular kit assembly typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for modular kit assembly"
      ]
    },
    {
      "phase": 234,
      "title": "Symmetry and mirroring",
      "operatorId": "modeling.and.block.authoring.symmetry.and.mirroring",
      "testId": "P234_SYMMETRY_AND_MIRRORING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Symmetry and mirroring typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for symmetry and mirroring"
      ]
    },
    {
      "phase": 235,
      "title": "Array and radial duplication",
      "operatorId": "modeling.and.block.authoring.array.and.radial.duplication",
      "testId": "P235_ARRAY_AND_RADIAL_DUPLICATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Array and radial duplication typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for array and radial duplication"
      ]
    },
    {
      "phase": 236,
      "title": "Surface conform",
      "operatorId": "modeling.and.block.authoring.surface.conform",
      "testId": "P236_SURFACE_CONFORM_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Surface conform typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for surface conform"
      ]
    },
    {
      "phase": 237,
      "title": "Block palette replace",
      "operatorId": "modeling.and.block.authoring.block.palette.replace",
      "testId": "P237_BLOCK_PALETTE_REPLACE_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Block palette replace typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for block palette replace"
      ]
    },
    {
      "phase": 238,
      "title": "Topology cleanup",
      "operatorId": "modeling.and.block.authoring.topology.cleanup",
      "testId": "P238_TOPOLOGY_CLEANUP_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Topology cleanup typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for topology cleanup"
      ]
    },
    {
      "phase": 239,
      "title": "Collision proxy authoring",
      "operatorId": "modeling.and.block.authoring.collision.proxy.authoring",
      "testId": "P239_COLLISION_PROXY_AUTHORING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Collision proxy authoring typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for collision proxy authoring"
      ]
    },
    {
      "phase": 240,
      "title": "Model validation report",
      "operatorId": "modeling.and.block.authoring.model.validation.report",
      "testId": "P240_MODEL_VALIDATION_REPORT_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Model validation report typed contract, reversible command and deterministic evaluator",
        "Modeling and block authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for model validation report"
      ]
    }
  ]
});
