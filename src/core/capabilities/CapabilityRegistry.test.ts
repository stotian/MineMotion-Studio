import {
  CapabilityRegistry,
  type RuntimeProbe
} from "./CapabilityRegistry";

const WEB_PROBE: RuntimeProbe = {
  webgl: true,
  webgl2: true,
  webgpu: false,
  canvasImageExport: true,
  canvasCaptureStream: true,
  mediaRecorder: true,
  webmVp8: true,
  webmVp9: true,
  webmOpus: false,
  audioDecoding: true,
  offlineAudio: true,
  tauriRuntime: false,
  browserFileSystem: true
};

describe("CapabilityRegistry", () => {
  it("reports web features without claiming native features", () => {
    const registry = CapabilityRegistry.detect({ probe: WEB_PROBE });

    expect(registry.supports("webgl2")).toBe(true);
    expect(registry.supports("audio-decoding")).toBe(true);
    expect(registry.supports("webm-recording")).toBe(true);
    expect(registry.supportedCodecs()).toEqual([
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9"
    ]);
    expect(registry.get("ffmpeg").status).toBe("requires-native");
    expect(registry.get("plugin-sandbox").status).toBe("disabled");
  });

  it("requires positive FFmpeg evidence in Tauri", () => {
    const registry = CapabilityRegistry.detect({
      probe: { ...WEB_PROBE, tauriRuntime: true },
      ffmpeg: {
        available: true,
        message: "FFmpeg 7 detected.",
        codecs: ["video/mp4;codec=h264"]
      }
    });

    expect(registry.supports("tauri-runtime")).toBe(true);
    expect(registry.supports("native-filesystem")).toBe(true);
    expect(registry.supports("ffmpeg")).toBe(true);
    expect(registry.get("ffmpeg").message).toBe("FFmpeg 7 detected.");
    expect(registry.supportedCodecs()).toContain("video/mp4;codec=h264");
  });

  it("returns an immutable, complete capability list", () => {
    const registry = CapabilityRegistry.detect({ probe: WEB_PROBE });
    expect(registry.list()).toHaveLength(13);
    expect(Object.isFrozen(registry.get("webgl2"))).toBe(true);
    expect(Object.isFrozen(registry.list())).toBe(true);
  });
});
