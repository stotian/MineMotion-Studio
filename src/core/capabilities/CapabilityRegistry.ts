export type CapabilityId =
  | "webgl"
  | "webgl2"
  | "webgpu"
  | "canvas-export"
  | "media-recorder"
  | "webm-recording"
  | "audio-decoding"
  | "audio-mixdown"
  | "tauri-runtime"
  | "ffmpeg"
  | "browser-filesystem"
  | "native-filesystem"
  | "plugin-sandbox";

export type CapabilityStatus =
  | "available"
  | "unavailable"
  | "experimental"
  | "requires-native"
  | "disabled";

export interface RuntimeProbe {
  webgl: boolean;
  webgl2: boolean;
  webgpu: boolean;
  canvasImageExport: boolean;
  canvasCaptureStream: boolean;
  mediaRecorder: boolean;
  webmVp8: boolean;
  webmVp9: boolean;
  webmOpus: boolean;
  audioDecoding: boolean;
  offlineAudio: boolean;
  tauriRuntime: boolean;
  browserFileSystem: boolean;
}

export interface FfmpegCapabilityEvidence {
  available: boolean;
  message?: string;
  codecs?: readonly string[];
}

export interface Capability {
  id: CapabilityId;
  label: string;
  available: boolean;
  status: CapabilityStatus;
  message: string;
}

export interface CapabilityDetectionOptions {
  probe?: RuntimeProbe;
  ffmpeg?: FfmpegCapabilityEvidence;
}

function createCapability(
  id: CapabilityId,
  label: string,
  available: boolean,
  status: CapabilityStatus,
  message: string
): Capability {
  return Object.freeze({ id, label, available, status, message });
}

export function probeRuntimeEnvironment(): RuntimeProbe {
  const hasWindow = typeof window !== "undefined";
  const canvasPrototype =
    typeof HTMLCanvasElement !== "undefined"
      ? HTMLCanvasElement.prototype
      : undefined;
  const recorderAvailable = typeof MediaRecorder !== "undefined";
  let webgl = false;
  let webgl2 = false;

  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      const webgl2Context = canvas.getContext("webgl2");
      const context = webgl2Context ?? canvas.getContext("webgl");
      webgl2 = Boolean(webgl2Context);
      webgl = Boolean(context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webgl = false;
      webgl2 = false;
    }
  }

  const supportsRecorderType = (mimeType: string): boolean => {
    if (!recorderAvailable) return false;
    try {
      return MediaRecorder.isTypeSupported(mimeType);
    } catch {
      return false;
    }
  };

  const globalWithWebkitAudio = globalThis as typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

  return {
    webgl,
    webgl2,
    webgpu:
      typeof navigator !== "undefined" &&
      "gpu" in (navigator as Navigator & { gpu?: unknown }),
    canvasImageExport: Boolean(canvasPrototype && "toBlob" in canvasPrototype),
    canvasCaptureStream: Boolean(canvasPrototype && "captureStream" in canvasPrototype),
    mediaRecorder: recorderAvailable,
    webmVp8: supportsRecorderType("video/webm;codecs=vp8"),
    webmVp9: supportsRecorderType("video/webm;codecs=vp9"),
    webmOpus: supportsRecorderType("video/webm;codecs=vp9,opus"),
    audioDecoding:
      typeof AudioContext !== "undefined" ||
      typeof globalWithWebkitAudio.webkitAudioContext !== "undefined",
    offlineAudio: typeof OfflineAudioContext !== "undefined",
    tauriRuntime: hasWindow && "__TAURI_INTERNALS__" in window,
    browserFileSystem:
      hasWindow &&
      ("showOpenFilePicker" in window || "showDirectoryPicker" in window)
  };
}

function buildCapabilities(
  probe: RuntimeProbe,
  ffmpeg?: FfmpegCapabilityEvidence
): Readonly<Record<CapabilityId, Capability>> {
  const ffmpegAvailable = probe.tauriRuntime && ffmpeg?.available === true;
  const ffmpegStatus: CapabilityStatus = !probe.tauriRuntime
    ? "requires-native"
    : ffmpegAvailable
      ? "available"
      : "unavailable";

  return Object.freeze({
    webgl: createCapability(
      "webgl",
      "WebGL",
      probe.webgl,
      probe.webgl ? "available" : "unavailable",
      probe.webgl
        ? "WebGL rendering is available."
        : "WebGL is unavailable in this runtime."
    ),
    webgl2: createCapability(
      "webgl2",
      "WebGL 2",
      probe.webgl2,
      probe.webgl2 ? "available" : "unavailable",
      probe.webgl2
        ? "WebGL 2 rendering is available."
        : "WebGL 2 is unavailable in this runtime."
    ),
    webgpu: createCapability(
      "webgpu",
      "WebGPU",
      probe.webgpu,
      probe.webgpu ? "experimental" : "unavailable",
      probe.webgpu
        ? "WebGPU is detected but remains an experimental future path."
        : "WebGPU is not detected."
    ),
    "canvas-export": createCapability(
      "canvas-export",
      "Canvas image export",
      probe.canvasImageExport,
      probe.canvasImageExport ? "available" : "unavailable",
      probe.canvasImageExport
        ? "PNG capture is available."
        : "Canvas PNG capture is unavailable."
    ),
    "media-recorder": createCapability(
      "media-recorder",
      "MediaRecorder",
      probe.mediaRecorder,
      probe.mediaRecorder ? "available" : "unavailable",
      probe.mediaRecorder
        ? "Browser media recording is available."
        : "MediaRecorder is unavailable."
    ),
    "webm-recording": createCapability(
      "webm-recording",
      "WebM recording",
      probe.canvasCaptureStream && probe.mediaRecorder && probe.webmVp9,
      probe.canvasCaptureStream && probe.mediaRecorder && probe.webmVp9
        ? "available"
        : "unavailable",
      probe.canvasCaptureStream && probe.mediaRecorder && probe.webmVp9
        ? "VP9 WebM recording is available."
        : "VP9 MediaRecorder canvas capture is unavailable."
    ),
    "audio-decoding": createCapability(
      "audio-decoding",
      "Audio decoding",
      probe.audioDecoding,
      probe.audioDecoding ? "available" : "unavailable",
      probe.audioDecoding
        ? "Web Audio decoding is available."
        : "AudioContext is unavailable."
    ),
    "audio-mixdown": createCapability(
      "audio-mixdown",
      "Offline audio mixdown",
      probe.offlineAudio,
      probe.offlineAudio ? "available" : "unavailable",
      probe.offlineAudio
        ? "Offline WAV mixdown is available."
        : "OfflineAudioContext is unavailable."
    ),
    "tauri-runtime": createCapability(
      "tauri-runtime",
      "Tauri desktop runtime",
      probe.tauriRuntime,
      probe.tauriRuntime ? "available" : "unavailable",
      probe.tauriRuntime
        ? "The native desktop bridge is available."
        : "This is a web runtime."
    ),
    ffmpeg: createCapability(
      "ffmpeg",
      "FFmpeg",
      ffmpegAvailable,
      ffmpegStatus,
      probe.tauriRuntime
        ? ffmpeg?.message ?? "FFmpeg has not been detected in this capability snapshot."
        : "FFmpeg requires the MineMotion Studio desktop runtime."
    ),
    "browser-filesystem": createCapability(
      "browser-filesystem",
      "Browser filesystem picker",
      probe.browserFileSystem,
      probe.browserFileSystem ? "available" : "unavailable",
      probe.browserFileSystem
        ? "Browser file and directory pickers are available."
        : "Browser filesystem picker APIs are unavailable."
    ),
    "native-filesystem": createCapability(
      "native-filesystem",
      "Native filesystem",
      probe.tauriRuntime,
      probe.tauriRuntime ? "available" : "requires-native",
      probe.tauriRuntime
        ? "Native filesystem commands can be exposed through restricted Tauri commands."
        : "Native filesystem access requires the desktop runtime."
    ),
    "plugin-sandbox": createCapability(
      "plugin-sandbox",
      "Plugin code sandbox",
      false,
      "disabled",
      "External plugin code execution is disabled until a permissioned sandbox exists."
    )
  });
}

export class CapabilityRegistry {
  private readonly capabilities: Readonly<Record<CapabilityId, Capability>>;
  private readonly codecs: readonly string[];

  private constructor(
    capabilities: Readonly<Record<CapabilityId, Capability>>,
    codecs: readonly string[]
  ) {
    this.capabilities = capabilities;
    this.codecs = Object.freeze([...codecs]);
  }

  static detect(options: CapabilityDetectionOptions = {}): CapabilityRegistry {
    const probe = options.probe ?? probeRuntimeEnvironment();
    const codecs = [
      ...(probe.webmVp8 ? ["video/webm;codecs=vp8"] : []),
      ...(probe.webmVp9 ? ["video/webm;codecs=vp9"] : []),
      ...(probe.webmOpus ? ["video/webm;codecs=vp9,opus"] : []),
      ...(probe.tauriRuntime && options.ffmpeg?.available
        ? options.ffmpeg.codecs ?? []
        : [])
    ];
    return new CapabilityRegistry(
      buildCapabilities(probe, options.ffmpeg),
      [...new Set(codecs)]
    );
  }

  get(id: CapabilityId): Capability {
    return this.capabilities[id];
  }

  supports(id: CapabilityId): boolean {
    return this.capabilities[id].available;
  }

  list(): readonly Capability[] {
    return Object.freeze(Object.values(this.capabilities));
  }

  supportedCodecs(): readonly string[] {
    return this.codecs;
  }
}

let detectedRuntimeProbe: RuntimeProbe | undefined;
let detectedFfmpegEvidence: FfmpegCapabilityEvidence | undefined;
let detectedRuntimeRegistry: CapabilityRegistry | undefined;

export function getRuntimeCapabilityRegistry(): CapabilityRegistry {
  detectedRuntimeProbe ??= probeRuntimeEnvironment();
  detectedRuntimeRegistry ??= CapabilityRegistry.detect({
    probe: detectedRuntimeProbe,
    ffmpeg: detectedFfmpegEvidence
  });
  return detectedRuntimeRegistry;
}

export function refreshRuntimeCapabilityRegistry(): CapabilityRegistry {
  detectedRuntimeProbe = probeRuntimeEnvironment();
  detectedRuntimeRegistry = CapabilityRegistry.detect({
    probe: detectedRuntimeProbe,
    ffmpeg: detectedFfmpegEvidence
  });
  return detectedRuntimeRegistry;
}

export function updateRuntimeFfmpegCapability(
  evidence: FfmpegCapabilityEvidence
): CapabilityRegistry {
  detectedFfmpegEvidence = { ...evidence };
  detectedRuntimeProbe ??= probeRuntimeEnvironment();
  detectedRuntimeRegistry = CapabilityRegistry.detect({
    probe: detectedRuntimeProbe,
    ffmpeg: detectedFfmpegEvidence
  });
  return detectedRuntimeRegistry;
}

export function isTauriRuntimeAvailable(): boolean {
  return getRuntimeCapabilityRegistry().supports("tauri-runtime");
}

export function isWebMRecordingAvailable(): boolean {
  return getRuntimeCapabilityRegistry().supports("webm-recording");
}

export function isOfflineAudioAvailable(): boolean {
  return getRuntimeCapabilityRegistry().supports("audio-mixdown");
}
