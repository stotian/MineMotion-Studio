import type { BlockPaletteStyle } from "../settings/SettingsTypes";

export interface BlockPalettePreset {
  id: BlockPaletteStyle;
  name: string;
  description: string;
}

export const BLOCK_PALETTE_PRESETS: BlockPalettePreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Bright generated Minecraft-like colors."
  },
  {
    id: "muted",
    name: "Muted",
    description: "Lower saturation colors for cinematic scenes."
  },
  {
    id: "nether",
    name: "Nether",
    description: "Warm dark palette for Nether mood scenes."
  }
];

