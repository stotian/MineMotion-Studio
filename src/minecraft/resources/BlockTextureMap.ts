import type { BlockId } from "../MinecraftWorldTypes";
import type { BlockTextureFace } from "./ResourcePackTypes";

type FaceCandidates = Partial<Record<BlockTextureFace, string[]>>;

export const BLOCK_TEXTURE_MAP: Record<BlockId, FaceCandidates> = {
  air: {},
  grass: {
    all: ["grass_block_top", "grass"],
    top: ["grass_block_top", "grass"],
    side: ["grass_block_side", "grass_block_top", "grass"],
    bottom: ["dirt"]
  },
  grass_block: {
    all: ["grass_block_side", "grass_block_top"],
    top: ["grass_block_top"],
    side: ["grass_block_side", "grass_block_top"],
    bottom: ["dirt"]
  },
  dirt: { all: ["dirt"] },
  stone: { all: ["stone"] },
  cobblestone: { all: ["cobblestone"] },
  deepslate: { all: ["deepslate"] },
  oak_log: {
    all: ["oak_log"],
    side: ["oak_log"],
    top: ["oak_log_top", "oak_log"],
    bottom: ["oak_log_top", "oak_log"]
  },
  oak_leaves: { all: ["oak_leaves"] },
  water: { all: ["water_still", "water_flow", "water"] },
  glass: { all: ["glass"] },
  sand: { all: ["sand", "red_sand"] },
  gravel: { all: ["gravel"] },
  snow: { all: ["snow", "snow_block"] },
  netherrack: { all: ["netherrack"] },
  end_stone: { all: ["end_stone"] },
  ore: {
    all: [
      "diamond_ore",
      "iron_ore",
      "gold_ore",
      "coal_ore",
      "copper_ore",
      "redstone_ore",
      "emerald_ore",
      "lapis_ore"
    ]
  },
  unknown: {}
};

export function getTextureCandidates(
  blockId: BlockId,
  face: BlockTextureFace
): string[] {
  const mapping = BLOCK_TEXTURE_MAP[blockId];
  return mapping[face] ?? mapping.all ?? [];
}
