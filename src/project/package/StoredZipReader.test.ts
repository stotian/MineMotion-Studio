import { describe, expect, it } from "vitest";
import { createStoredZip } from "../../export/ZipWriter";
import { readStoredZip } from "./StoredZipReader";

describe("StoredZipReader", () => {
  it("round-trips bounded stored entries", async () => {
    const blob = createStoredZip([{ filename: "project.json", data: new TextEncoder().encode("{}") }]);
    const entries = readStoredZip(new Uint8Array(await blob.arrayBuffer()));
    expect(entries[0]?.filename).toBe("project.json");
  });
  it("rejects unsafe paths", async () => {
    const blob = createStoredZip([{ filename: "../escape", data: new Uint8Array() }]);
    expect(() => readStoredZip(new Uint8Array(await blob.arrayBuffer()))).toThrow(/Unsafe ZIP/);
  });
});
