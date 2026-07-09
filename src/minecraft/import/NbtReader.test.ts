import { describe, expect, it } from "vitest";
import { LevelDatReader } from "./LevelDatReader";
import { NbtReader } from "./NbtReader";

describe("NbtReader", () => {
  it("parses a small uncompressed level.dat-style compound", () => {
    const root = NbtReader.parseUncompressed(
      new Uint8Array([
        10, 0, 0,
        8, 0, 9, 76, 101, 118, 101, 108, 78, 97, 109, 101, 0, 9, 84, 105, 110, 121, 87, 111, 114, 108, 100,
        3, 0, 6, 83, 112, 97, 119, 110, 88, 0, 0, 0, 32,
        3, 0, 6, 83, 112, 97, 119, 110, 89, 0, 0, 0, 72,
        3, 0, 6, 83, 112, 97, 119, 110, 90, 255, 255, 255, 240,
        0
      ])
    );
    const summary = LevelDatReader.summarize(root);

    expect(summary.levelName).toBe("TinyWorld");
    expect(summary.spawn).toEqual([32, 72, -16]);
  });
});
