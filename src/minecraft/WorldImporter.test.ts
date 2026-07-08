import { describe, expect, it } from "vitest";
import { AnvilRegionReader } from "./AnvilRegionReader";
import { WorldImporter } from "./WorldImporter";

describe("WorldImporter", () => {
  it("detects world folder structure from relative paths", () => {
    const files = [
      createFile("MyWorld/level.dat"),
      createFile("MyWorld/region/r.0.0.mca"),
      createFile("MyWorld/DIM-1/region/r.-1.2.mca"),
      createFile("MyWorld/DIM1/region/r.4.-3.mca")
    ];

    const scan = WorldImporter.scanFileList(files);

    expect(scan.sourceName).toBe("MyWorld");
    expect(scan.levelDat?.name).toBe("level.dat");
    expect(scan.overworldRegions).toHaveLength(1);
    expect(scan.netherRegions).toHaveLength(1);
    expect(scan.endRegions).toHaveLength(1);
  });

  it("parses Anvil region coordinates", () => {
    expect(AnvilRegionReader.parseRegionCoordinates("r.-3.12.mca")).toEqual({
      regionX: -3,
      regionZ: 12
    });
  });
});

function createFile(relativePath: string): File {
  const name = relativePath.split("/").at(-1) || "file";
  const file = new File([""], name);
  Object.defineProperty(file, "webkitRelativePath", {
    value: relativePath,
    configurable: true
  });
  return file;
}

