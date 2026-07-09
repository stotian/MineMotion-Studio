export interface McaChunkLocation {
  localX: number;
  localZ: number;
  chunkX: number;
  chunkZ: number;
  offsetSector: number;
  sectorCount: number;
  timestamp: number;
}

export interface McaRegionHeader {
  regionX: number;
  regionZ: number;
  locations: McaChunkLocation[];
}

export interface McaChunkPayload {
  compressionType: number;
  data: Uint8Array;
}

const SECTOR_BYTES = 4096;

export class McaFileReader {
  static parseRegionCoordinates(filename: string): {
    regionX: number;
    regionZ: number;
  } | null {
    const match = /r\.(-?\d+)\.(-?\d+)\.mca$/i.exec(filename);
    if (!match) return null;
    return {
      regionX: Number(match[1]),
      regionZ: Number(match[2])
    };
  }

  static readHeader(
    buffer: ArrayBuffer,
    regionX: number,
    regionZ: number
  ): McaRegionHeader {
    if (buffer.byteLength < SECTOR_BYTES * 2) {
      throw new Error("Invalid Anvil region: header is smaller than 8192 bytes.");
    }

    const view = new DataView(buffer);
    const locations: McaChunkLocation[] = [];

    for (let index = 0; index < 1024; index += 1) {
      const byteOffset = index * 4;
      const offsetSector =
        (view.getUint8(byteOffset) << 16) |
        (view.getUint8(byteOffset + 1) << 8) |
        view.getUint8(byteOffset + 2);
      const sectorCount = view.getUint8(byteOffset + 3);
      if (offsetSector === 0 || sectorCount === 0) continue;

      const localX = index % 32;
      const localZ = Math.floor(index / 32);
      locations.push({
        localX,
        localZ,
        chunkX: regionX * 32 + localX,
        chunkZ: regionZ * 32 + localZ,
        offsetSector,
        sectorCount,
        timestamp: view.getUint32(SECTOR_BYTES + byteOffset, false)
      });
    }

    return {
      regionX,
      regionZ,
      locations
    };
  }

  static readChunkPayload(
    buffer: ArrayBuffer,
    location: McaChunkLocation
  ): McaChunkPayload {
    const byteOffset = location.offsetSector * SECTOR_BYTES;
    if (byteOffset + 5 > buffer.byteLength) {
      throw new Error(
        `Chunk ${location.chunkX},${location.chunkZ} points outside the region file.`
      );
    }

    const view = new DataView(buffer);
    const length = view.getUint32(byteOffset, false);
    if (length <= 1 || byteOffset + 4 + length > buffer.byteLength) {
      throw new Error(
        `Chunk ${location.chunkX},${location.chunkZ} has an invalid payload length.`
      );
    }

    return {
      compressionType: view.getUint8(byteOffset + 4),
      data: new Uint8Array(buffer, byteOffset + 5, length - 1)
    };
  }
}
