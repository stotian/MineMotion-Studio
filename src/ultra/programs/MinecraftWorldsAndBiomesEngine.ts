import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const MINECRAFT_WORLDS_AND_BIOMES_PROGRAM = defineUltraProgram({
  "id": "minecraft-worlds-and-biomes",
  "arc": "minecraft",
  "program": "Minecraft worlds and biomes",
  "problem": "importing and staging huge worlds read-only while making terrain, structures and environment understandable",
  "fixture": "large overworld region",
  "inspiration": "MineMotion original Minecraft-native workflow",
  "strategy": "simulation",
  "sourceCore": "src/ultra/programs/MinecraftWorldsAndBiomesEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 11264,
  "maximumSelection": 16384,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 346,
      "title": "World region streaming",
      "operatorId": "minecraft.worlds.and.biomes.world.region.streaming",
      "testId": "P346_WORLD_REGION_STREAMING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "World region streaming typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for world region streaming"
      ]
    },
    {
      "phase": 347,
      "title": "Chunk selection",
      "operatorId": "minecraft.worlds.and.biomes.chunk.selection",
      "testId": "P347_CHUNK_SELECTION_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Chunk selection typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for chunk selection"
      ]
    },
    {
      "phase": 348,
      "title": "Dimension switching",
      "operatorId": "minecraft.worlds.and.biomes.dimension.switching",
      "testId": "P348_DIMENSION_SWITCHING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Dimension switching typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dimension switching"
      ]
    },
    {
      "phase": 349,
      "title": "Biome catalog",
      "operatorId": "minecraft.worlds.and.biomes.biome.catalog",
      "testId": "P349_BIOME_CATALOG_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Biome catalog typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for biome catalog"
      ]
    },
    {
      "phase": 350,
      "title": "Heightmap editing",
      "operatorId": "minecraft.worlds.and.biomes.heightmap.editing",
      "testId": "P350_HEIGHTMAP_EDITING_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Heightmap editing typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for heightmap editing"
      ]
    },
    {
      "phase": 351,
      "title": "Terrain layers",
      "operatorId": "minecraft.worlds.and.biomes.terrain.layers",
      "testId": "P351_TERRAIN_LAYERS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Terrain layers typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for terrain layers"
      ]
    },
    {
      "phase": 352,
      "title": "Structure discovery",
      "operatorId": "minecraft.worlds.and.biomes.structure.discovery",
      "testId": "P352_STRUCTURE_DISCOVERY_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Structure discovery typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for structure discovery"
      ]
    },
    {
      "phase": 353,
      "title": "Cave visualization",
      "operatorId": "minecraft.worlds.and.biomes.cave.visualization",
      "testId": "P353_CAVE_VISUALIZATION_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Cave visualization typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for cave visualization"
      ]
    },
    {
      "phase": 354,
      "title": "Lighting data import",
      "operatorId": "minecraft.worlds.and.biomes.lighting.data.import",
      "testId": "P354_LIGHTING_DATA_IMPORT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Lighting data import typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lighting data import"
      ]
    },
    {
      "phase": 355,
      "title": "Weather zones",
      "operatorId": "minecraft.worlds.and.biomes.weather.zones",
      "testId": "P355_WEATHER_ZONES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Weather zones typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for weather zones"
      ]
    },
    {
      "phase": 356,
      "title": "Season overrides",
      "operatorId": "minecraft.worlds.and.biomes.season.overrides",
      "testId": "P356_SEASON_OVERRIDES_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Season overrides typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for season overrides"
      ]
    },
    {
      "phase": 357,
      "title": "World diff layers",
      "operatorId": "minecraft.worlds.and.biomes.world.diff.layers",
      "testId": "P357_WORLD_DIFF_LAYERS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "World diff layers typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for world diff layers"
      ]
    },
    {
      "phase": 358,
      "title": "Read-only source enforcement",
      "operatorId": "minecraft.worlds.and.biomes.read.only.source.enforcement",
      "testId": "P358_READ_ONLY_SOURCE_ENFORCEMENT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Read-only source enforcement typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for read-only source enforcement"
      ]
    },
    {
      "phase": 359,
      "title": "World cache management",
      "operatorId": "minecraft.worlds.and.biomes.world.cache.management",
      "testId": "P359_WORLD_CACHE_MANAGEMENT_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "World cache management typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for world cache management"
      ]
    },
    {
      "phase": 360,
      "title": "Huge-world diagnostics",
      "operatorId": "minecraft.worlds.and.biomes.huge.world.diagnostics",
      "testId": "P360_HUGE_WORLD_DIAGNOSTICS_ACCEPTANCE",
      "evidence": "performance",
      "deliverables": [
        "Huge-world diagnostics typed contract, reversible command and deterministic evaluator",
        "Minecraft worlds and biomes workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for huge-world diagnostics"
      ]
    }
  ]
});
