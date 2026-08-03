import { describe, expect, it } from "vitest";
import { DimensionScanner } from "./DimensionScanner";

function file(path: string): File {
  const value = new File([], path.split("/").at(-1) ?? path);
  Object.defineProperty(value, "webkitRelativePath", { value: path });
  return value;
}

describe("DimensionScanner", () => {
  it("discovers standard and custom dimensions while ignoring non-region MCA files", () => {
    const result = DimensionScanner.scan([
      file("World/region/r.-1.2.mca"),
      file("World/DIM-1/region/r.0.0.mca"),
      file("World/DIM1/region/r.1.-2.mca"),
      file("World/dimensions/example/moon/region/r.4.5.mca"),
      file("World/dimensions/example/space/station/region/r.-3.7.mca"),
      file("World/entities/r.0.0.mca"),
      file("World/poi/r.0.0.mca")
    ]);

    expect(result.map((dimension) => dimension.id)).toEqual([
      "overworld",
      "nether",
      "end",
      "custom:example:moon",
      "custom:example:space:station"
    ]);
    expect(result[0].regionFiles[0]).toMatchObject({ regionX: -1, regionZ: 2 });
    expect(result[3]).toMatchObject({
      label: "example:moon",
      estimatedChunks: 1024
    });
    expect(result.flatMap((dimension) => dimension.regionFiles)).toHaveLength(5);
  });
});
