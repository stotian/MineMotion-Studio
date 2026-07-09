import { describe, expect, it } from "vitest";
import { createStoredZip } from "./ZipWriter";

describe("createStoredZip", () => {
  it("creates a ZIP blob with local and end-of-central-directory signatures", async () => {
    const blob = createStoredZip([
      {
        filename: "frame_000001.png",
        data: new Uint8Array([1, 2, 3])
      }
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe("application/zip");
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));
    expect(bytes.slice(-22, -18)).toEqual(
      new Uint8Array([0x50, 0x4b, 0x05, 0x06])
    );
  });
});
