import { getBlockDefinition } from "../BlockPalette";
import type { BlockId } from "../MinecraftWorldTypes";
import { getTextureCandidates } from "./BlockTextureMap";
import type {
  BlockTextureFace,
  ResourcePackAsset,
  TextureResolution
} from "./ResourcePackTypes";

export class TextureResolver {
  static resolve(
    pack: ResourcePackAsset | null | undefined,
    blockId: BlockId,
    face: BlockTextureFace = "all"
  ): TextureResolution {
    const fallbackColor = getBlockDefinition(blockId).color;
    if (!pack) {
      return {
        status: "fallback",
        blockId,
        face,
        texture: null,
        fallbackColor,
        reason: "No active resource pack."
      };
    }

    const candidates = getTextureCandidates(blockId, face);
    const texture = candidates
      .map((candidate) =>
        pack.textures.find(
          (entry) =>
            entry.blockName === candidate || entry.blockName.endsWith(`/${candidate}`)
        )
      )
      .find((entry) => Boolean(entry));

    if (!texture) {
      return {
        status: "fallback",
        blockId,
        face,
        texture: null,
        fallbackColor,
        reason:
          candidates.length === 0
            ? `No texture mapping is defined for ${blockId}.`
            : `Missing texture candidates: ${candidates.join(", ")}.`
      };
    }

    return {
      status: "resolved",
      blockId,
      face,
      texture,
      fallbackColor,
      reason: `Resolved ${texture.path}.`
    };
  }
}
