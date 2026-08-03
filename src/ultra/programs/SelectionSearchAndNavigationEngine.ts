import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const SELECTION_SEARCH_AND_NAVIGATION_PROGRAM = defineUltraProgram({
  "id": "selection-search-and-navigation",
  "arc": "navigation",
  "program": "Selection search and navigation",
  "problem": "finding and isolating the correct object, shot, channel or asset without breaking flow",
  "fixture": "2000-object battle scene",
  "inspiration": "Community discoverability feedback plus MineMotion originals",
  "strategy": "editor",
  "sourceCore": "src/ultra/programs/SelectionSearchAndNavigationEngine.ts",
  "maximumOperations": 10,
  "maximumResourceUnits": 5120,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 166,
      "title": "Universal fuzzy search",
      "operatorId": "selection.search.and.navigation.universal.fuzzy.search",
      "testId": "P166_UNIVERSAL_FUZZY_SEARCH_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Universal fuzzy search typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for universal fuzzy search"
      ]
    },
    {
      "phase": 167,
      "title": "Search by semantic tag",
      "operatorId": "selection.search.and.navigation.search.by.semantic.tag",
      "testId": "P167_SEARCH_BY_SEMANTIC_TAG_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Search by semantic tag typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for search by semantic tag"
      ]
    },
    {
      "phase": 168,
      "title": "Select by type",
      "operatorId": "selection.search.and.navigation.select.by.type",
      "testId": "P168_SELECT_BY_TYPE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Select by type typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for select by type"
      ]
    },
    {
      "phase": 169,
      "title": "Select by material",
      "operatorId": "selection.search.and.navigation.select.by.material",
      "testId": "P169_SELECT_BY_MATERIAL_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Select by material typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for select by material"
      ]
    },
    {
      "phase": 170,
      "title": "Select by hierarchy",
      "operatorId": "selection.search.and.navigation.select.by.hierarchy",
      "testId": "P170_SELECT_BY_HIERARCHY_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Select by hierarchy typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for select by hierarchy"
      ]
    },
    {
      "phase": 171,
      "title": "Select by visibility",
      "operatorId": "selection.search.and.navigation.select.by.visibility",
      "testId": "P171_SELECT_BY_VISIBILITY_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Select by visibility typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for select by visibility"
      ]
    },
    {
      "phase": 172,
      "title": "Select by animation state",
      "operatorId": "selection.search.and.navigation.select.by.animation.state",
      "testId": "P172_SELECT_BY_ANIMATION_STATE_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Select by animation state typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for select by animation state"
      ]
    },
    {
      "phase": 173,
      "title": "Selection sets",
      "operatorId": "selection.search.and.navigation.selection.sets",
      "testId": "P173_SELECTION_SETS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Selection sets typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for selection sets"
      ]
    },
    {
      "phase": 174,
      "title": "Named filters",
      "operatorId": "selection.search.and.navigation.named.filters",
      "testId": "P174_NAMED_FILTERS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Named filters typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for named filters"
      ]
    },
    {
      "phase": 175,
      "title": "Invert grow and shrink selection",
      "operatorId": "selection.search.and.navigation.invert.grow.and.shrink.selection",
      "testId": "P175_INVERT_GROW_AND_SHRINK_SELECTION_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Invert grow and shrink selection typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for invert grow and shrink selection"
      ]
    },
    {
      "phase": 176,
      "title": "Isolate and local view",
      "operatorId": "selection.search.and.navigation.isolate.and.local.view",
      "testId": "P176_ISOLATE_AND_LOCAL_VIEW_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Isolate and local view typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for isolate and local view"
      ]
    },
    {
      "phase": 177,
      "title": "View bookmarks",
      "operatorId": "selection.search.and.navigation.view.bookmarks",
      "testId": "P177_VIEW_BOOKMARKS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "View bookmarks typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for view bookmarks"
      ]
    },
    {
      "phase": 178,
      "title": "Frame selected across editors",
      "operatorId": "selection.search.and.navigation.frame.selected.across.editors",
      "testId": "P178_FRAME_SELECTED_ACROSS_EDITORS_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Frame selected across editors typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for frame selected across editors"
      ]
    },
    {
      "phase": 179,
      "title": "Navigation history",
      "operatorId": "selection.search.and.navigation.navigation.history",
      "testId": "P179_NAVIGATION_HISTORY_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Navigation history typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for navigation history"
      ]
    },
    {
      "phase": 180,
      "title": "Lost-object recovery",
      "operatorId": "selection.search.and.navigation.lost.object.recovery",
      "testId": "P180_LOST_OBJECT_RECOVERY_ACCEPTANCE",
      "evidence": "workflow",
      "deliverables": [
        "Lost-object recovery typed contract, reversible command and deterministic evaluator",
        "Selection search and navigation workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lost-object recovery"
      ]
    }
  ]
});
