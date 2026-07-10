import { describe, expect, it } from "vitest";
import { BlockbenchImporter } from "./BlockbenchImporter";
import { BbmodelParser } from "./BbmodelParser";

const FIXTURE = JSON.stringify({
  name: "Test Sword",
  meta: {
    format_version: "4.10",
    model_format: "free"
  },
  elements: [
    {
      name: "blade",
      from: [0, 0, 0],
      to: [1, 8, 1],
      faces: {}
    }
  ],
  groups: [
    {
      name: "root",
      children: []
    }
  ],
  textures: [
    {
      name: "texture"
    }
  ]
});

describe("BbmodelParser", () => {
  it("parses Blockbench metadata and cube elements", () => {
    const parsed = BbmodelParser.parse(FIXTURE);

    expect(parsed.name).toBe("Test Sword");
    expect(parsed.elements).toHaveLength(1);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.textures).toHaveLength(1);
  });

  it("exports parsed cubes as static OBJ geometry", () => {
    const parsed = BbmodelParser.parse(FIXTURE);
    const obj = BlockbenchImporter.toObj(parsed);

    expect(obj).toContain("o Test_Sword");
    expect(obj).toContain("g blade");
    expect(obj.match(/^v /gm)).toHaveLength(8);
  });
});
