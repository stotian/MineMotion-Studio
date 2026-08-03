import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const PROCEDURAL_GEOMETRY_AND_NODES_PROGRAM = defineUltraProgram({
  "id": "procedural-geometry-and-nodes",
  "arc": "procedural",
  "program": "Procedural geometry and nodes",
  "problem": "generating reusable environments and variations through inspectable deterministic graphs",
  "fixture": "seeded village generator",
  "inspiration": "Blender Geometry Nodes pattern adapted to Minecraft",
  "strategy": "graph",
  "sourceCore": "src/ultra/programs/ProceduralGeometryAndNodesEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 7680,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 241,
      "title": "Geometry node graph",
      "operatorId": "procedural.geometry.and.nodes.geometry.node.graph",
      "testId": "P241_GEOMETRY_NODE_GRAPH_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Geometry node graph typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for geometry node graph"
      ]
    },
    {
      "phase": 242,
      "title": "Typed sockets",
      "operatorId": "procedural.geometry.and.nodes.typed.sockets",
      "testId": "P242_TYPED_SOCKETS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Typed sockets typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for typed sockets"
      ]
    },
    {
      "phase": 243,
      "title": "Node group assets",
      "operatorId": "procedural.geometry.and.nodes.node.group.assets",
      "testId": "P243_NODE_GROUP_ASSETS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Node group assets typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for node group assets"
      ]
    },
    {
      "phase": 244,
      "title": "Field evaluation",
      "operatorId": "procedural.geometry.and.nodes.field.evaluation",
      "testId": "P244_FIELD_EVALUATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Field evaluation typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for field evaluation"
      ]
    },
    {
      "phase": 245,
      "title": "Instance distribution",
      "operatorId": "procedural.geometry.and.nodes.instance.distribution",
      "testId": "P245_INSTANCE_DISTRIBUTION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Instance distribution typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for instance distribution"
      ]
    },
    {
      "phase": 246,
      "title": "Attribute capture",
      "operatorId": "procedural.geometry.and.nodes.attribute.capture",
      "testId": "P246_ATTRIBUTE_CAPTURE_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Attribute capture typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for attribute capture"
      ]
    },
    {
      "phase": 247,
      "title": "Procedural roads",
      "operatorId": "procedural.geometry.and.nodes.procedural.roads",
      "testId": "P247_PROCEDURAL_ROADS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Procedural roads typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for procedural roads"
      ]
    },
    {
      "phase": 248,
      "title": "Procedural vegetation",
      "operatorId": "procedural.geometry.and.nodes.procedural.vegetation",
      "testId": "P248_PROCEDURAL_VEGETATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Procedural vegetation typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for procedural vegetation"
      ]
    },
    {
      "phase": 249,
      "title": "Procedural buildings",
      "operatorId": "procedural.geometry.and.nodes.procedural.buildings",
      "testId": "P249_PROCEDURAL_BUILDINGS_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Procedural buildings typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for procedural buildings"
      ]
    },
    {
      "phase": 250,
      "title": "Procedural caves",
      "operatorId": "procedural.geometry.and.nodes.procedural.caves",
      "testId": "P250_PROCEDURAL_CAVES_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Procedural caves typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for procedural caves"
      ]
    },
    {
      "phase": 251,
      "title": "Procedural damage",
      "operatorId": "procedural.geometry.and.nodes.procedural.damage",
      "testId": "P251_PROCEDURAL_DAMAGE_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Procedural damage typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for procedural damage"
      ]
    },
    {
      "phase": 252,
      "title": "Seeded variation",
      "operatorId": "procedural.geometry.and.nodes.seeded.variation",
      "testId": "P252_SEEDED_VARIATION_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Seeded variation typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for seeded variation"
      ]
    },
    {
      "phase": 253,
      "title": "Node debugger",
      "operatorId": "procedural.geometry.and.nodes.node.debugger",
      "testId": "P253_NODE_DEBUGGER_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Node debugger typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for node debugger"
      ]
    },
    {
      "phase": 254,
      "title": "Graph performance profiler",
      "operatorId": "procedural.geometry.and.nodes.graph.performance.profiler",
      "testId": "P254_GRAPH_PERFORMANCE_PROFILER_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Graph performance profiler typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for graph performance profiler"
      ]
    },
    {
      "phase": 255,
      "title": "Bake procedural result",
      "operatorId": "procedural.geometry.and.nodes.bake.procedural.result",
      "testId": "P255_BAKE_PROCEDURAL_RESULT_ACCEPTANCE",
      "evidence": "deterministic",
      "deliverables": [
        "Bake procedural result typed contract, reversible command and deterministic evaluator",
        "Procedural geometry and nodes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for bake procedural result"
      ]
    }
  ]
});
