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

/**
 * Fast path for hot callers: a plain boolean check, with no size computation.
 * The mesher calls this once per block, so it must stay free.
 */
export function seedVanillaBlocks(): void {
  if (seeded) return;
  ensureVanillaBlocksRegistered();
}

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
