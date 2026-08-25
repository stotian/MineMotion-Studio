import type { BlockDefinition, BlockId } from "./MinecraftWorldTypes";
import {
  ensureVanillaBlocksRegistered,
  seedVanillaBlocks
} from "./blocks/BlockCatalogue";
import {
  getBlockDefinition as registryGetBlockDefinition,
  listRenderableBlockIds as registryListRenderableBlockIds
} from "./blocks/BlockRegistry";

export const BLOCK_PALETTE: Record<BlockId, BlockDefinition> = {
  air: {
    id: "air",
    label: "Air",
    color: "#000000",
    transparent: true,
    opacity: 0
  },
  grass: {
    id: "grass",
    label: "Grass",
    color: "#5da545",
    transparent: false,
    opacity: 1
  },
  grass_block: {
    id: "grass_block",
    label: "Grass Block",
    color: "#5da545",
    transparent: false,
    opacity: 1
  },
  dirt: {
    id: "dirt",
    label: "Dirt",
    color: "#79553a",
    transparent: false,
    opacity: 1
  },
  stone: {
    id: "stone",
    label: "Stone",
    color: "#858585",
    transparent: false,
    opacity: 1
  },
  cobblestone: {
    id: "cobblestone",
    label: "Cobblestone",
    color: "#747474",
    transparent: false,
    opacity: 1
  },
  deepslate: {
    id: "deepslate",
    label: "Deepslate",
    color: "#55565c",
    transparent: false,
    opacity: 1
  },
  oak_log: {
    id: "oak_log",
    label: "Oak Log",
    color: "#8a633f",
    transparent: false,
    opacity: 1
  },
  oak_leaves: {
    id: "oak_leaves",
    label: "Oak Leaves",
    color: "#3d7f35",
    transparent: true,
    opacity: 0.78
  },
  water: {
    id: "water",
    label: "Water",
    color: "#2f6dce",
    transparent: true,
    opacity: 0.55
  },
  lava: {
    id: "lava",
    label: "Lava",
    color: "#ff5a1f",
    transparent: false,
    opacity: 1
  },
  glass: {
    id: "glass",
    label: "Glass",
    color: "#b7ecff",
    transparent: true,
    opacity: 0.35
  },
  glowstone: {
    id: "glowstone",
    label: "Glowstone",
    color: "#ffd37a",
    transparent: false,
    opacity: 1
  },
  torch: {
    id: "torch",
    label: "Torch",
    color: "#ffb14a",
    transparent: true,
    opacity: 1
  },
  redstone_lamp: {
    id: "redstone_lamp",
    label: "Redstone Lamp",
    color: "#ff9c45",
    transparent: false,
    opacity: 1
  },
  sand: {
    id: "sand",
    label: "Sand",
    color: "#d8c27a",
    transparent: false,
    opacity: 1
  },
  gravel: {
    id: "gravel",
    label: "Gravel",
    color: "#77736f",
    transparent: false,
    opacity: 1
  },
  snow: {
    id: "snow",
    label: "Snow",
    color: "#eef5ff",
    transparent: false,
    opacity: 1
  },
  netherrack: {
    id: "netherrack",
    label: "Netherrack",
    color: "#743030",
    transparent: false,
    opacity: 1
  },
  end_stone: {
    id: "end_stone",
    label: "End Stone",
    color: "#d8d89a",
    transparent: false,
    opacity: 1
  },
  ore: {
    id: "ore",
    label: "Ore Placeholder",
    color: "#7fb0d6",
    transparent: false,
    opacity: 1
  },
  unknown: {
    id: "unknown",
    label: "Unknown Block",
    color: "#ff5fb8",
    transparent: false,
    opacity: 1
  }
};

/*
 * These two functions are the seam the mesher and texture resolver call
 * through. They now answer from the runtime registry — which holds the full
 * vanilla catalogue plus whatever mods and resource packs have registered —
 * instead of the 22-entry record above.
 *
 * BLOCK_PALETTE is kept as the seed for those core ids so terrain presets and
 * the Anvil importer keep resolving even before the catalogue is registered.
 */
export function getBlockDefinition(id: BlockId): BlockDefinition {
  seedVanillaBlocks();
  // The seed record wins for the ids it defines: those colours are what
  // existing projects were authored against, and the catalogue's approximations
  // must not silently restyle a scene someone already made.
  const seeded = BLOCK_PALETTE[id];
  if (seeded) return seeded;
  return registryGetBlockDefinition(id);
}

export function listRenderableBlockIds(): BlockId[] {
  ensureVanillaBlocksRegistered();
  return registryListRenderableBlockIds();
}
