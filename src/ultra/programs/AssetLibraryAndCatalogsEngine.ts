import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const ASSET_LIBRARY_AND_CATALOGS_PROGRAM = defineUltraProgram({
  "id": "asset-library-and-catalogs",
  "arc": "assets",
  "program": "Asset library and catalogs",
  "problem": "reusing portable assets with clear previews, versions, licenses and missing-file recovery",
  "fixture": "shared cinematic asset catalog",
  "inspiration": "Blender Asset Browser pattern plus production metadata",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/AssetLibraryAndCatalogsEngine.ts",
  "maximumOperations": 12,
  "maximumResourceUnits": 6144,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 196,
      "title": "Indexed asset catalog",
      "operatorId": "asset.library.and.catalogs.indexed.asset.catalog",
      "testId": "P196_INDEXED_ASSET_CATALOG_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Indexed asset catalog typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for indexed asset catalog"
      ]
    },
    {
      "phase": 197,
      "title": "Asset previews",
      "operatorId": "asset.library.and.catalogs.asset.previews",
      "testId": "P197_ASSET_PREVIEWS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Asset previews typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for asset previews"
      ]
    },
    {
      "phase": 198,
      "title": "Tag taxonomies",
      "operatorId": "asset.library.and.catalogs.tag.taxonomies",
      "testId": "P198_TAG_TAXONOMIES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Tag taxonomies typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for tag taxonomies"
      ]
    },
    {
      "phase": 199,
      "title": "Favorites and recent assets",
      "operatorId": "asset.library.and.catalogs.favorites.and.recent.assets",
      "testId": "P199_FAVORITES_AND_RECENT_ASSETS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Favorites and recent assets typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for favorites and recent assets"
      ]
    },
    {
      "phase": 200,
      "title": "Drag-and-drop import",
      "operatorId": "asset.library.and.catalogs.drag.and.drop.import",
      "testId": "P200_DRAG_AND_DROP_IMPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Drag-and-drop import typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for drag-and-drop import"
      ]
    },
    {
      "phase": 201,
      "title": "Linked versus local assets",
      "operatorId": "asset.library.and.catalogs.linked.versus.local.assets",
      "testId": "P201_LINKED_VERSUS_LOCAL_ASSETS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Linked versus local assets typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for linked versus local assets"
      ]
    },
    {
      "phase": 202,
      "title": "Asset version pinning",
      "operatorId": "asset.library.and.catalogs.asset.version.pinning",
      "testId": "P202_ASSET_VERSION_PINNING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Asset version pinning typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for asset version pinning"
      ]
    },
    {
      "phase": 203,
      "title": "Dependency packaging",
      "operatorId": "asset.library.and.catalogs.dependency.packaging",
      "testId": "P203_DEPENDENCY_PACKAGING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Dependency packaging typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dependency packaging"
      ]
    },
    {
      "phase": 204,
      "title": "Duplicate detection",
      "operatorId": "asset.library.and.catalogs.duplicate.detection",
      "testId": "P204_DUPLICATE_DETECTION_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Duplicate detection typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for duplicate detection"
      ]
    },
    {
      "phase": 205,
      "title": "Missing asset relink",
      "operatorId": "asset.library.and.catalogs.missing.asset.relink",
      "testId": "P205_MISSING_ASSET_RELINK_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Missing asset relink typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for missing asset relink"
      ]
    },
    {
      "phase": 206,
      "title": "Asset provenance",
      "operatorId": "asset.library.and.catalogs.asset.provenance",
      "testId": "P206_ASSET_PROVENANCE_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Asset provenance typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for asset provenance"
      ]
    },
    {
      "phase": 207,
      "title": "License metadata",
      "operatorId": "asset.library.and.catalogs.license.metadata",
      "testId": "P207_LICENSE_METADATA_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "License metadata typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for license metadata"
      ]
    },
    {
      "phase": 208,
      "title": "Content rating and safety",
      "operatorId": "asset.library.and.catalogs.content.rating.and.safety",
      "testId": "P208_CONTENT_RATING_AND_SAFETY_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Content rating and safety typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for content rating and safety"
      ]
    },
    {
      "phase": 209,
      "title": "Remote read-only catalogs",
      "operatorId": "asset.library.and.catalogs.remote.read.only.catalogs",
      "testId": "P209_REMOTE_READ_ONLY_CATALOGS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Remote read-only catalogs typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for remote read-only catalogs"
      ]
    },
    {
      "phase": 210,
      "title": "Offline catalog cache",
      "operatorId": "asset.library.and.catalogs.offline.catalog.cache",
      "testId": "P210_OFFLINE_CATALOG_CACHE_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Offline catalog cache typed contract, reversible command and deterministic evaluator",
        "Asset library and catalogs workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for offline catalog cache"
      ]
    }
  ]
});
