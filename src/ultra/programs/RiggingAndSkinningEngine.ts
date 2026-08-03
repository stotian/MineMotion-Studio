import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const RIGGING_AND_SKINNING_PROGRAM = defineUltraProgram({
  "id": "rigging-and-skinning",
  "arc": "rigging",
  "program": "Rigging and skinning",
  "problem": "building portable controllable rigs with predictable weights, constraints and retargeting",
  "fixture": "custom boss rig",
  "inspiration": "Blender rigging patterns adapted to Minecraft rigs",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/RiggingAndSkinningEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 9728,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 301,
      "title": "Bone creation and edit",
      "operatorId": "rigging.and.skinning.bone.creation.and.edit",
      "testId": "P301_BONE_CREATION_AND_EDIT_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Bone creation and edit typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for bone creation and edit"
      ]
    },
    {
      "phase": 302,
      "title": "Parent and child tools",
      "operatorId": "rigging.and.skinning.parent.and.child.tools",
      "testId": "P302_PARENT_AND_CHILD_TOOLS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Parent and child tools typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for parent and child tools"
      ]
    },
    {
      "phase": 303,
      "title": "Bone roll normalization",
      "operatorId": "rigging.and.skinning.bone.roll.normalization",
      "testId": "P303_BONE_ROLL_NORMALIZATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Bone roll normalization typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for bone roll normalization"
      ]
    },
    {
      "phase": 304,
      "title": "Rig templates",
      "operatorId": "rigging.and.skinning.rig.templates",
      "testId": "P304_RIG_TEMPLATES_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Rig templates typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for rig templates"
      ]
    },
    {
      "phase": 305,
      "title": "Skin weight painting",
      "operatorId": "rigging.and.skinning.skin.weight.painting",
      "testId": "P305_SKIN_WEIGHT_PAINTING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Skin weight painting typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for skin weight painting"
      ]
    },
    {
      "phase": 306,
      "title": "Automatic weights",
      "operatorId": "rigging.and.skinning.automatic.weights",
      "testId": "P306_AUTOMATIC_WEIGHTS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Automatic weights typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for automatic weights"
      ]
    },
    {
      "phase": 307,
      "title": "Weight normalization",
      "operatorId": "rigging.and.skinning.weight.normalization",
      "testId": "P307_WEIGHT_NORMALIZATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Weight normalization typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for weight normalization"
      ]
    },
    {
      "phase": 308,
      "title": "Symmetry weights",
      "operatorId": "rigging.and.skinning.symmetry.weights",
      "testId": "P308_SYMMETRY_WEIGHTS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Symmetry weights typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for symmetry weights"
      ]
    },
    {
      "phase": 309,
      "title": "Constraint library",
      "operatorId": "rigging.and.skinning.constraint.library",
      "testId": "P309_CONSTRAINT_LIBRARY_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Constraint library typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for constraint library"
      ]
    },
    {
      "phase": 310,
      "title": "Custom properties",
      "operatorId": "rigging.and.skinning.custom.properties",
      "testId": "P310_CUSTOM_PROPERTIES_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Custom properties typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for custom properties"
      ]
    },
    {
      "phase": 311,
      "title": "Driver wiring",
      "operatorId": "rigging.and.skinning.driver.wiring",
      "testId": "P311_DRIVER_WIRING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Driver wiring typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for driver wiring"
      ]
    },
    {
      "phase": 312,
      "title": "Rig validation",
      "operatorId": "rigging.and.skinning.rig.validation",
      "testId": "P312_RIG_VALIDATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Rig validation typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for rig validation"
      ]
    },
    {
      "phase": 313,
      "title": "Retarget mapping",
      "operatorId": "rigging.and.skinning.retarget.mapping",
      "testId": "P313_RETARGET_MAPPING_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Retarget mapping typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for retarget mapping"
      ]
    },
    {
      "phase": 314,
      "title": "Control shape library",
      "operatorId": "rigging.and.skinning.control.shape.library",
      "testId": "P314_CONTROL_SHAPE_LIBRARY_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Control shape library typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for control shape library"
      ]
    },
    {
      "phase": 315,
      "title": "Rig performance LOD",
      "operatorId": "rigging.and.skinning.rig.performance.lod",
      "testId": "P315_RIG_PERFORMANCE_LOD_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Rig performance LOD typed contract, reversible command and deterministic evaluator",
        "Rigging and skinning workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for rig performance lod"
      ]
    }
  ]
});
