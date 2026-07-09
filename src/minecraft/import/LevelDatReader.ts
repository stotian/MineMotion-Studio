import { NbtReader } from "./NbtReader";
import {
  asCompound,
  compoundValue,
  tagNumber,
  tagString,
  type NbtTag
} from "./NbtTypes";
import type { MinecraftLevelDatSummary } from "./MinecraftChunkTypes";

export class LevelDatReader {
  static async read(file: File | null): Promise<MinecraftLevelDatSummary> {
    if (!file) {
      return {
        found: false,
        levelName: "",
        dataVersion: null,
        spawn: null,
        warnings: ["level.dat was not found."]
      };
    }

    try {
      const raw = new Uint8Array(await file.arrayBuffer());
      const decompressed = await LevelDatReader.decompressLevelDat(raw);
      return LevelDatReader.summarize(NbtReader.parseUncompressed(decompressed));
    } catch (error) {
      return {
        found: true,
        levelName: "",
        dataVersion: null,
        spawn: null,
        warnings: [
          error instanceof Error
            ? `level.dat could not be parsed: ${error.message}`
            : "level.dat could not be parsed."
        ]
      };
    }
  }

  static summarize(root: NbtTag): MinecraftLevelDatSummary {
    const rootCompound = asCompound(root);
    const data = rootCompound
      ? (asCompound(compoundValue(rootCompound, "Data")) ?? rootCompound)
      : {};
    const spawnX = tagNumber(compoundValue(data, "SpawnX"));
    const spawnY = tagNumber(compoundValue(data, "SpawnY"));
    const spawnZ = tagNumber(compoundValue(data, "SpawnZ"));

    return {
      found: true,
      levelName: tagString(compoundValue(data, "LevelName")) ?? "",
      dataVersion: tagNumber(compoundValue(data, "DataVersion")) ?? null,
      spawn:
        spawnX === undefined || spawnY === undefined || spawnZ === undefined
          ? null
          : [spawnX, spawnY, spawnZ],
      warnings: []
    };
  }

  private static async decompressLevelDat(data: Uint8Array): Promise<Uint8Array> {
    const isGzip = data[0] === 0x1f && data[1] === 0x8b;
    if (!isGzip) {
      return data;
    }
    if (typeof DecompressionStream === "undefined") {
      throw new Error("gzip DecompressionStream is unavailable.");
    }
    const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(
      new DecompressionStream("gzip")
    );
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
}
