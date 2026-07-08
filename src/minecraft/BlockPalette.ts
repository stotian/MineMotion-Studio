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
  }
};

export function getBlockDefinition(id: BlockId): BlockDefinition {
  return BLOCK_PALETTE[id];
}

export function listRenderableBlockIds(): BlockId[] {
  return (Object.keys(BLOCK_PALETTE) as BlockId[]).filter((id) => id !== "air");
}

