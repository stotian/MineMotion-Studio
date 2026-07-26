import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBrowserBlob } from "./BrowserDownload";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser downloads", () => {
  it("revokes object URLs after a successful click", () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:download"),
      revokeObjectURL
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({ href: "", download: "", click }))
    });

    downloadBrowserBlob(new Blob(["data"]), "scene.bin");

    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
  });

  it("revokes object URLs when link activation fails", () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:failed"),
      revokeObjectURL
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click: () => {
          throw new Error("blocked");
        }
      }))
    });

    expect(() =>
      downloadBrowserBlob(new Blob(["data"]), "scene.bin")
    ).toThrow("blocked");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:failed");
  });
});
