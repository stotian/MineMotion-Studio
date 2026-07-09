import type { BlockDefinition, BlockId } from "./MinecraftWorldTypes";

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
  glass: {
    id: "glass",
    label: "Glass",
    color: "#b7ecff",
    transparent: true,
    opacity: 0.35
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

export function getBlockDefinition(id: BlockId): BlockDefinition {
  return BLOCK_PALETTE[id];
}

export function listRenderableBlockIds(): BlockId[] {
  return (Object.keys(BLOCK_PALETTE) as BlockId[]).filter((id) => id !== "air");
}
