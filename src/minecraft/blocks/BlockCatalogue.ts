import {
  MINECRAFT_NAMESPACE,
  registerBlockSource,
  registerBlocks,
  blockRegistrySize
} from "./BlockRegistry";
import { createVanillaBlockCatalogue } from "./VanillaBlocks";

/**
 * Seeds the registry with the vanilla catalogue.
 *
 * Called once at startup, before anything resolves a block. Mods and resource
 * packs register afterwards, so their definitions win for ids they override.
 */
let seeded = false;

export function ensureVanillaBlocksRegistered(): number {
  if (seeded) return blockRegistrySize();
  registerBlockSource({
    namespace: MINECRAFT_NAMESPACE,
    label: "Minecraft",
    kind: "vanilla"
  });
  registerBlocks(createVanillaBlockCatalogue());
  seeded = true;
  return blockRegistrySize();
}

/** Test seam: allows a suite to re-seed after resetting the registry. */
export function resetVanillaSeed(): void {
  seeded = false;
}
