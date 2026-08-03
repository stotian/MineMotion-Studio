import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const PHYSICS_AND_SIMULATION_PROGRAM = defineUltraProgram({
  "id": "physics-and-simulation",
  "arc": "simulation",
  "program": "Physics and simulation",
  "problem": "producing deterministic art-directable motion with bounded caches and clear diagnostics",
  "fixture": "destruction and cloth benchmark",
  "inspiration": "Blender simulation concepts adapted to deterministic Minecraft scenes",
  "strategy": "simulation",
  "sourceCore": "src/ultra/programs/PhysicsAndSimulationEngine.ts",
  "maximumOperations": 9,
  "maximumResourceUnits": 12288,
  "maximumSelection": 16384,
  "supportsPreview": true,
  "requiresConfirmation": true,
  "phases": [
    {
      "phase": 376,
      "title": "Rigid bodies",
      "operatorId": "physics.and.simulation.rigid.bodies",
      "testId": "P376_RIGID_BODIES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Rigid bodies typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for rigid bodies"
      ]
    },
    {
      "phase": 377,
      "title": "Constraints",
      "operatorId": "physics.and.simulation.constraints",
      "testId": "P377_CONSTRAINTS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Constraints typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for constraints"
      ]
    },
    {
      "phase": 378,
      "title": "Cloth capes",
      "operatorId": "physics.and.simulation.cloth.capes",
      "testId": "P378_CLOTH_CAPES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Cloth capes typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for cloth capes"
      ]
    },
    {
      "phase": 379,
      "title": "Hair chains",
      "operatorId": "physics.and.simulation.hair.chains",
      "testId": "P379_HAIR_CHAINS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Hair chains typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for hair chains"
      ]
    },
    {
      "phase": 380,
      "title": "Soft-body squish",
      "operatorId": "physics.and.simulation.soft.body.squish",
      "testId": "P380_SOFT_BODY_SQUISH_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Soft-body squish typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for soft-body squish"
      ]
    },
    {
      "phase": 381,
      "title": "Particle collisions",
      "operatorId": "physics.and.simulation.particle.collisions",
      "testId": "P381_PARTICLE_COLLISIONS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Particle collisions typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for particle collisions"
      ]
    },
    {
      "phase": 382,
      "title": "Wind fields",
      "operatorId": "physics.and.simulation.wind.fields",
      "testId": "P382_WIND_FIELDS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Wind fields typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for wind fields"
      ]
    },
    {
      "phase": 383,
      "title": "Force fields",
      "operatorId": "physics.and.simulation.force.fields",
      "testId": "P383_FORCE_FIELDS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Force fields typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for force fields"
      ]
    },
    {
      "phase": 384,
      "title": "Fluid surfaces",
      "operatorId": "physics.and.simulation.fluid.surfaces",
      "testId": "P384_FLUID_SURFACES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Fluid surfaces typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for fluid surfaces"
      ]
    },
    {
      "phase": 385,
      "title": "Fire spread",
      "operatorId": "physics.and.simulation.fire.spread",
      "testId": "P385_FIRE_SPREAD_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Fire spread typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for fire spread"
      ]
    },
    {
      "phase": 386,
      "title": "Destruction caches",
      "operatorId": "physics.and.simulation.destruction.caches",
      "testId": "P386_DESTRUCTION_CACHES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Destruction caches typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for destruction caches"
      ]
    },
    {
      "phase": 387,
      "title": "Simulation substeps",
      "operatorId": "physics.and.simulation.simulation.substeps",
      "testId": "P387_SIMULATION_SUBSTEPS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Simulation substeps typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for simulation substeps"
      ]
    },
    {
      "phase": 388,
      "title": "Deterministic seeds",
      "operatorId": "physics.and.simulation.deterministic.seeds",
      "testId": "P388_DETERMINISTIC_SEEDS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Deterministic seeds typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for deterministic seeds"
      ]
    },
    {
      "phase": 389,
      "title": "Simulation bake manager",
      "operatorId": "physics.and.simulation.simulation.bake.manager",
      "testId": "P389_SIMULATION_BAKE_MANAGER_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Simulation bake manager typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for simulation bake manager"
      ]
    },
    {
      "phase": 390,
      "title": "Simulation diagnostics",
      "operatorId": "physics.and.simulation.simulation.diagnostics",
      "testId": "P390_SIMULATION_DIAGNOSTICS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Simulation diagnostics typed contract, reversible command and deterministic evaluator",
        "Physics and simulation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for simulation diagnostics"
      ]
    }
  ]
});
