import { getBlockDefinition, listRenderableBlockIds } from "../BlockPalette";
import type { BlockId } from "../MinecraftWorldTypes";
import { getTextureCandidates } from "./BlockTextureMap";
import type {
  BlockTextureFace,
  ResourcePackAsset,
  ResourcePackResolutionReport,
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
  static createResolutionReport(
    pack: ResourcePackAsset
  ): ResourcePackResolutionReport {
    const faces: readonly BlockTextureFace[] = [
      "side",
      "top",
      "bottom",
      "front",
      "back"
    ];
    const missing: ResourcePackResolutionReport["missing"][number][] = [];
    let resolvedFaces = 0;
    let fallbackFaces = 0;
    for (const blockId of listRenderableBlockIds()) {
      for (const face of faces) {
        const result = TextureResolver.resolve(pack, blockId, face);
        if (result.status === "resolved") {
          resolvedFaces += 1;
        } else {
          fallbackFaces += 1;
          missing.push({ blockId, face, reason: result.reason });
        }
      }
    }
    return { resolvedFaces, fallbackFaces, missing };
  }

}
