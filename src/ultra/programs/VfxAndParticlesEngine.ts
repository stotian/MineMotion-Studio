import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const VFX_AND_PARTICLES_PROGRAM = defineUltraProgram({
  "id": "vfx-and-particles",
  "arc": "vfx",
  "program": "VFX and particles",
  "problem": "authoring reusable Minecraft-readable effects with budgets, LOD and event synchronization",
  "fixture": "portal explosion benchmark",
  "inspiration": "Blender node/particle patterns plus MineMotion VFX library",
  "strategy": "graph",
  "sourceCore": "src/ultra/programs/VfxAndParticlesEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 12800,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 391,
      "title": "Particle emitter graph",
      "operatorId": "vfx.and.particles.particle.emitter.graph",
      "testId": "P391_PARTICLE_EMITTER_GRAPH_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Particle emitter graph typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for particle emitter graph"
      ]
    },
    {
      "phase": 392,
      "title": "Event-driven spawning",
      "operatorId": "vfx.and.particles.event.driven.spawning",
      "testId": "P392_EVENT_DRIVEN_SPAWNING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Event-driven spawning typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for event-driven spawning"
      ]
    },
    {
      "phase": 393,
      "title": "Trail renderer",
      "operatorId": "vfx.and.particles.trail.renderer",
      "testId": "P393_TRAIL_RENDERER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Trail renderer typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for trail renderer"
      ]
    },
    {
      "phase": 394,
      "title": "Ribbon renderer",
      "operatorId": "vfx.and.particles.ribbon.renderer",
      "testId": "P394_RIBBON_RENDERER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Ribbon renderer typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for ribbon renderer"
      ]
    },
    {
      "phase": 395,
      "title": "Mesh particles",
      "operatorId": "vfx.and.particles.mesh.particles",
      "testId": "P395_MESH_PARTICLES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Mesh particles typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for mesh particles"
      ]
    },
    {
      "phase": 396,
      "title": "Sprite sheets",
      "operatorId": "vfx.and.particles.sprite.sheets",
      "testId": "P396_SPRITE_SHEETS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Sprite sheets typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for sprite sheets"
      ]
    },
    {
      "phase": 397,
      "title": "Volumetric smoke",
      "operatorId": "vfx.and.particles.volumetric.smoke",
      "testId": "P397_VOLUMETRIC_SMOKE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Volumetric smoke typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for volumetric smoke"
      ]
    },
    {
      "phase": 398,
      "title": "Explosion builder",
      "operatorId": "vfx.and.particles.explosion.builder",
      "testId": "P398_EXPLOSION_BUILDER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Explosion builder typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for explosion builder"
      ]
    },
    {
      "phase": 399,
      "title": "Magic effect builder",
      "operatorId": "vfx.and.particles.magic.effect.builder",
      "testId": "P399_MAGIC_EFFECT_BUILDER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Magic effect builder typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for magic effect builder"
      ]
    },
    {
      "phase": 400,
      "title": "Electric arc builder",
      "operatorId": "vfx.and.particles.electric.arc.builder",
      "testId": "P400_ELECTRIC_ARC_BUILDER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Electric arc builder typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for electric arc builder"
      ]
    },
    {
      "phase": 401,
      "title": "Environmental ambience",
      "operatorId": "vfx.and.particles.environmental.ambience",
      "testId": "P401_ENVIRONMENTAL_AMBIENCE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Environmental ambience typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for environmental ambience"
      ]
    },
    {
      "phase": 402,
      "title": "Screen-space effects",
      "operatorId": "vfx.and.particles.screen.space.effects",
      "testId": "P402_SCREEN_SPACE_EFFECTS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Screen-space effects typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for screen-space effects"
      ]
    },
    {
      "phase": 403,
      "title": "VFX LOD",
      "operatorId": "vfx.and.particles.vfx.lod",
      "testId": "P403_VFX_LOD_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "VFX LOD typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for vfx lod"
      ]
    },
    {
      "phase": 404,
      "title": "VFX preset packaging",
      "operatorId": "vfx.and.particles.vfx.preset.packaging",
      "testId": "P404_VFX_PRESET_PACKAGING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "VFX preset packaging typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for vfx preset packaging"
      ]
    },
    {
      "phase": 405,
      "title": "VFX debugger",
      "operatorId": "vfx.and.particles.vfx.debugger",
      "testId": "P405_VFX_DEBUGGER_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "VFX debugger typed contract, reversible command and deterministic evaluator",
        "VFX and particles workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for vfx debugger"
      ]
    }
  ]
});
