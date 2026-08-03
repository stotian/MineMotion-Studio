import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const MATERIALS_AND_TEXTURE_AUTHORING_PROGRAM = defineUltraProgram({
  "id": "materials-and-texture-authoring",
  "arc": "shading",
  "program": "Materials and texture authoring",
  "problem": "authoring cinematic materials without losing pixel-art identity, resource-pack mapping or memory control",
  "fixture": "resource-pack lookdev scene",
  "inspiration": "Blender shader workflow plus Minecraft texture safeguards",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/MaterialsAndTextureAuthoringEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 8192,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 256,
      "title": "Texture set importer",
      "operatorId": "materials.and.texture.authoring.texture.set.importer",
      "testId": "P256_TEXTURE_SET_IMPORTER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Texture set importer typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for texture set importer"
      ]
    },
    {
      "phase": 257,
      "title": "Pixel-art sampling guard",
      "operatorId": "materials.and.texture.authoring.pixel.art.sampling.guard",
      "testId": "P257_PIXEL_ART_SAMPLING_GUARD_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Pixel-art sampling guard typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for pixel-art sampling guard"
      ]
    },
    {
      "phase": 258,
      "title": "Material node graph",
      "operatorId": "materials.and.texture.authoring.material.node.graph",
      "testId": "P258_MATERIAL_NODE_GRAPH_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Material node graph typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for material node graph"
      ]
    },
    {
      "phase": 259,
      "title": "Layered materials",
      "operatorId": "materials.and.texture.authoring.layered.materials",
      "testId": "P259_LAYERED_MATERIALS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Layered materials typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for layered materials"
      ]
    },
    {
      "phase": 260,
      "title": "Decal authoring",
      "operatorId": "materials.and.texture.authoring.decal.authoring",
      "testId": "P260_DECAL_AUTHORING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Decal authoring typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for decal authoring"
      ]
    },
    {
      "phase": 261,
      "title": "Emissive masks",
      "operatorId": "materials.and.texture.authoring.emissive.masks",
      "testId": "P261_EMISSIVE_MASKS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Emissive masks typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for emissive masks"
      ]
    },
    {
      "phase": 262,
      "title": "Animated textures",
      "operatorId": "materials.and.texture.authoring.animated.textures",
      "testId": "P262_ANIMATED_TEXTURES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Animated textures typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for animated textures"
      ]
    },
    {
      "phase": 263,
      "title": "UV transform tools",
      "operatorId": "materials.and.texture.authoring.uv.transform.tools",
      "testId": "P263_UV_TRANSFORM_TOOLS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "UV transform tools typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for uv transform tools"
      ]
    },
    {
      "phase": 264,
      "title": "Texture atlas builder",
      "operatorId": "materials.and.texture.authoring.texture.atlas.builder",
      "testId": "P264_TEXTURE_ATLAS_BUILDER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Texture atlas builder typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for texture atlas builder"
      ]
    },
    {
      "phase": 265,
      "title": "PBR channel packing",
      "operatorId": "materials.and.texture.authoring.pbr.channel.packing",
      "testId": "P265_PBR_CHANNEL_PACKING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "PBR channel packing typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for pbr channel packing"
      ]
    },
    {
      "phase": 266,
      "title": "Minecraft resource-pack mapping",
      "operatorId": "materials.and.texture.authoring.minecraft.resource.pack.mapping",
      "testId": "P266_MINECRAFT_RESOURCE_PACK_MAPPING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Minecraft resource-pack mapping typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for minecraft resource-pack mapping"
      ]
    },
    {
      "phase": 267,
      "title": "Material variants",
      "operatorId": "materials.and.texture.authoring.material.variants",
      "testId": "P267_MATERIAL_VARIANTS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Material variants typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for material variants"
      ]
    },
    {
      "phase": 268,
      "title": "Material override stacks",
      "operatorId": "materials.and.texture.authoring.material.override.stacks",
      "testId": "P268_MATERIAL_OVERRIDE_STACKS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Material override stacks typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for material override stacks"
      ]
    },
    {
      "phase": 269,
      "title": "Texture memory diagnostics",
      "operatorId": "materials.and.texture.authoring.texture.memory.diagnostics",
      "testId": "P269_TEXTURE_MEMORY_DIAGNOSTICS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Texture memory diagnostics typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for texture memory diagnostics"
      ]
    },
    {
      "phase": 270,
      "title": "Missing texture recovery",
      "operatorId": "materials.and.texture.authoring.missing.texture.recovery",
      "testId": "P270_MISSING_TEXTURE_RECOVERY_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Missing texture recovery typed contract, reversible command and deterministic evaluator",
        "Materials and texture authoring workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for missing texture recovery"
      ]
    }
  ]
});
