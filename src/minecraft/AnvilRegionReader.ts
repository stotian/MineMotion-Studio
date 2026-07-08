export interface RegionChunkLocation {
  chunkX: number;
  chunkZ: number;
  offsetSector: number;
  sectorCount: number;
}

export class AnvilRegionReader {
  static parseRegionCoordinates(filename: string): {
    regionX: number;
    regionZ: number;
  } | null {
    const match = /r\.(-?\d+)\.(-?\d+)\.mca$/i.exec(filename);
    if (!match) {
      return null;
    }

    return {
      regionX: Number(match[1]),
      regionZ: Number(match[2])
    };
  }

  static readLocationTable(buffer: ArrayBuffer): RegionChunkLocation[] {
    if (buffer.byteLength < 4096) {
      throw new Error("Invalid Anvil region: header is smaller than 4096 bytes.");
    }

    const view = new DataView(buffer);
    const locations: RegionChunkLocation[] = [];

    for (let index = 0; index < 1024; index += 1) {
      const byteOffset = index * 4;
      const offsetSector =
        (view.getUint8(byteOffset) << 16) |
        (view.getUint8(byteOffset + 1) << 8) |
        view.getUint8(byteOffset + 2);
      const sectorCount = view.getUint8(byteOffset + 3);

      if (offsetSector === 0 || sectorCount === 0) {
        continue;
      }

      locations.push({
        chunkX: index % 32,
        chunkZ: Math.floor(index / 32),
        offsetSector,
        sectorCount
      });
    }

    return locations;
  }
}

