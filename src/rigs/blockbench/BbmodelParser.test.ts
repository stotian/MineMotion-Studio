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
      uuid: "element_blade",
      name: "blade",
      from: [0, 0, 0],
      to: [16, 4, 4],
      origin: [0, 0, 0],
      rotation: [0, 0, 90],
      faces: {}
    }
  ],
  outliner: [
    {
      name: "root",
      children: ["element_blade"]
    }
  ],
  textures: [
    {
      name: "texture"
    }
  ],
  animations: [
    {
      name: "swing",
      length: 0.5,
      snapping: 20,
      animators: {}
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
    expect(parsed.animations).toHaveLength(1);
    expect(parsed.report.rotatedElementCount).toBe(1);
    expect(parsed.report.animationNames).toEqual(["swing"]);
    expect(parsed.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("BLOCKBENCH_TEXTURE_PREVIEW_UNSUPPORTED"),
      expect.stringContaining("BLOCKBENCH_ANIMATION_MAPPING_REQUIRED")
    ]));
  });

  it("bakes element pivots and rotations into deterministic OBJ geometry", () => {
    const parsed = BbmodelParser.parse(FIXTURE);
    const obj = BlockbenchImporter.toObj(parsed);

    expect(obj).toContain("o Test_Sword");
    expect(obj).toContain("g root_blade");
    expect(obj.match(/^v /gm)).toHaveLength(8);
    expect(obj).toContain("v 0 1 0");
    expect(BlockbenchImporter.toObj(parsed)).toBe(obj);
  });

  it("bakes nested group rotations around their pivots", () => {
    const parsed = BbmodelParser.fromJson({
      name: "Grouped",
      elements: [{
        uuid: "cube",
        from: [0, 0, 0],
        to: [16, 4, 4]
      }],
      outliner: [{
        name: "root",
        origin: [0, 0, 0],
        rotation: [0, 0, 90],
        children: [{
          name: "hand",
          origin: [0, 0, 0],
          children: ["cube"]
        }]
      }]
    });
    const obj = BlockbenchImporter.toObj(parsed);

    expect(parsed.report.rotatedGroupCount).toBe(1);
    expect(obj).toContain("g root_hand_cube_1");
    expect(obj).toContain("v 0 1 0");
  });

  it("bounds hostile arrays and rejects oversized JSON", () => {
    const parsed = BbmodelParser.fromJson({
      elements: [
        { from: [0, 0, 0], to: [1, 1, 1] },
        { from: [0, Number.NaN, 0], to: [1, 1, 1] }
      ]
    });
    expect(parsed.elements).toHaveLength(1);
    expect(parsed.warnings[0]).toContain("BLOCKBENCH_ELEMENTS_SKIPPED");
    expect(() => BbmodelParser.parse(" ".repeat(16_000_001)))
      .toThrow("BLOCKBENCH_FILE_TOO_LARGE");
  });
});
