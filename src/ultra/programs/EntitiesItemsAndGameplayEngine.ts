import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const ENTITIES_ITEMS_AND_GAMEPLAY_PROGRAM = defineUltraProgram({
  "id": "entities-items-and-gameplay",
  "arc": "entities",
  "program": "Entities items and gameplay",
  "problem": "staging Minecraft actors, props and gameplay events with explicit version compatibility",
  "fixture": "raid choreography scene",
  "inspiration": "MineMotion original entity and event workflow",
  "strategy": "simulation",
  "sourceCore": "src/ultra/programs/EntitiesItemsAndGameplayEngine.ts",
  "maximumOperations": 8,
  "maximumResourceUnits": 11776,
  "maximumSelection": 16384,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 361,
      "title": "Entity catalog sync",
      "operatorId": "entities.items.and.gameplay.entity.catalog.sync",
      "testId": "P361_ENTITY_CATALOG_SYNC_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Entity catalog sync typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for entity catalog sync"
      ]
    },
    {
      "phase": 362,
      "title": "Item and block model catalog",
      "operatorId": "entities.items.and.gameplay.item.and.block.model.catalog",
      "testId": "P362_ITEM_AND_BLOCK_MODEL_CATALOG_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Item and block model catalog typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for item and block model catalog"
      ]
    },
    {
      "phase": 363,
      "title": "Equipment slots",
      "operatorId": "entities.items.and.gameplay.equipment.slots",
      "testId": "P363_EQUIPMENT_SLOTS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Equipment slots typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for equipment slots"
      ]
    },
    {
      "phase": 364,
      "title": "Inventory prop layouts",
      "operatorId": "entities.items.and.gameplay.inventory.prop.layouts",
      "testId": "P364_INVENTORY_PROP_LAYOUTS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Inventory prop layouts typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for inventory prop layouts"
      ]
    },
    {
      "phase": 365,
      "title": "Villager professions",
      "operatorId": "entities.items.and.gameplay.villager.professions",
      "testId": "P365_VILLAGER_PROFESSIONS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Villager professions typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for villager professions"
      ]
    },
    {
      "phase": 366,
      "title": "Mob variants",
      "operatorId": "entities.items.and.gameplay.mob.variants",
      "testId": "P366_MOB_VARIANTS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Mob variants typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for mob variants"
      ]
    },
    {
      "phase": 367,
      "title": "Boss rigs",
      "operatorId": "entities.items.and.gameplay.boss.rigs",
      "testId": "P367_BOSS_RIGS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Boss rigs typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for boss rigs"
      ]
    },
    {
      "phase": 368,
      "title": "Projectile trajectories",
      "operatorId": "entities.items.and.gameplay.projectile.trajectories",
      "testId": "P368_PROJECTILE_TRAJECTORIES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Projectile trajectories typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for projectile trajectories"
      ]
    },
    {
      "phase": 369,
      "title": "Redstone event hooks",
      "operatorId": "entities.items.and.gameplay.redstone.event.hooks",
      "testId": "P369_REDSTONE_EVENT_HOOKS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Redstone event hooks typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for redstone event hooks"
      ]
    },
    {
      "phase": 370,
      "title": "Potion and status effects",
      "operatorId": "entities.items.and.gameplay.potion.and.status.effects",
      "testId": "P370_POTION_AND_STATUS_EFFECTS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Potion and status effects typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for potion and status effects"
      ]
    },
    {
      "phase": 371,
      "title": "Damage state visuals",
      "operatorId": "entities.items.and.gameplay.damage.state.visuals",
      "testId": "P371_DAMAGE_STATE_VISUALS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Damage state visuals typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for damage state visuals"
      ]
    },
    {
      "phase": 372,
      "title": "Spawn choreography",
      "operatorId": "entities.items.and.gameplay.spawn.choreography",
      "testId": "P372_SPAWN_CHOREOGRAPHY_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Spawn choreography typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for spawn choreography"
      ]
    },
    {
      "phase": 373,
      "title": "Mount and passenger relations",
      "operatorId": "entities.items.and.gameplay.mount.and.passenger.relations",
      "testId": "P373_MOUNT_AND_PASSENGER_RELATIONS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Mount and passenger relations typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for mount and passenger relations"
      ]
    },
    {
      "phase": 374,
      "title": "Gameplay event recording",
      "operatorId": "entities.items.and.gameplay.gameplay.event.recording",
      "testId": "P374_GAMEPLAY_EVENT_RECORDING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Gameplay event recording typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gameplay event recording"
      ]
    },
    {
      "phase": 375,
      "title": "Entity compatibility report",
      "operatorId": "entities.items.and.gameplay.entity.compatibility.report",
      "testId": "P375_ENTITY_COMPATIBILITY_REPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Entity compatibility report typed contract, reversible command and deterministic evaluator",
        "Entities items and gameplay workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for entity compatibility report"
      ]
    }
  ]
});
