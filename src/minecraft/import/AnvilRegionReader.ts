import { NbtReader } from "./NbtReader";
import type { NbtTag } from "./NbtTypes";
import { McaFileReader, type McaChunkLocation } from "./McaFileReader";

export class AnvilRegionReader {
  static parseRegionCoordinates(filename: string): {
    regionX: number;
    regionZ: number;
  } | null {
    return McaFileReader.parseRegionCoordinates(filename);
  }

  static readLocationTable(buffer: ArrayBuffer): McaChunkLocation[] {
    return McaFileReader.readHeader(buffer, 0, 0).locations;
  }

  static async readChunkNbt(
    buffer: ArrayBuffer,
    location: McaChunkLocation
  ): Promise<NbtTag> {
    const payload = McaFileReader.readChunkPayload(buffer, location);
    const decompressed = await decompressMcaPayload(
      payload.data,
      payload.compressionType
    );
    return NbtReader.parseUncompressed(decompressed);
  }
}

export async function decompressMcaPayload(
  data: Uint8Array,
  compressionType: number
): Promise<Uint8Array> {
  if (compressionType === 3) {
    return data;
  }
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support MCA decompression.");
  }

  const format = compressionType === 1 ? "gzip" : compressionType === 2 ? "deflate" : "";
  if (!format) {
    throw new Error(`Unsupported MCA compression type: ${compressionType}.`);
  }

  const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(
    new DecompressionStream(format as CompressionFormat)
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
}
