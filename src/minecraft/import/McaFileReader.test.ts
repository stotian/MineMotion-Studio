import { describe, expect, it } from "vitest";
import { McaFileReader } from "./McaFileReader";

describe("McaFileReader", () => {
  it("parses region coordinates and Anvil header locations", () => {
    const buffer = new ArrayBuffer(8192);
    const view = new DataView(buffer);
    view.setUint8(0, 0);
    view.setUint8(1, 0);
    view.setUint8(2, 2);
    view.setUint8(3, 1);
    view.setUint32(4096, 123, false);

    const header = McaFileReader.readHeader(buffer, -1, 2);

    expect(McaFileReader.parseRegionCoordinates("r.-1.2.mca")).toEqual({
      regionX: -1,
      regionZ: 2
    });
    expect(header.locations).toHaveLength(1);
    expect(header.locations[0].chunkX).toBe(-32);
    expect(header.locations[0].chunkZ).toBe(64);
    expect(header.locations[0].offsetSector).toBe(2);
    expect(header.locations[0].timestamp).toBe(123);
  });

  it("rejects payloads that escape their allocated sectors", () => {
    const buffer = new ArrayBuffer(4096 * 4);
    const view = new DataView(buffer);
    view.setUint32(4096 * 2, 5000, false);

    expect(() => McaFileReader.readChunkPayload(buffer, {
      localX: 0,
      localZ: 0,
      chunkX: 0,
      chunkZ: 0,
      offsetSector: 2,
      sectorCount: 1,
      timestamp: 0
    })).toThrow(/invalid payload length/i);
  });
});
