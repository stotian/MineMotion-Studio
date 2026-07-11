export class FfmpegUnavailableError extends Error {
  constructor(message = "FFmpeg is not available in the native desktop runtime.") {
    super(message);
    this.name = "FfmpegUnavailableError";
  }
}

export class FfmpegExecutionError extends Error {
  readonly exitCode: number | null;

  constructor(message: string, exitCode: number | null = null) {
    super(message);
    this.name = "FfmpegExecutionError";
    this.exitCode = exitCode;
  }
}

export class NativeRuntimeRequiredError extends Error {
  constructor() {
    super("This export requires the MineMotion Studio desktop/Tauri runtime.");
    this.name = "NativeRuntimeRequiredError";
  }
}
