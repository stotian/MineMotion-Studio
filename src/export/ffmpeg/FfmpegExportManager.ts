import { invoke } from "@tauri-apps/api/core";
import type { ExportSettings } from "../ExportTypes";
import { buildFfmpegCommand, type FfmpegCommandPlan } from "./FfmpegCommandBuilder";
import { FfmpegExecutionError, NativeRuntimeRequiredError } from "./FfmpegErrors";
import type { FfmpegSettings } from "./FfmpegSettings";
import { isTauriRuntime } from "./FfmpegDetector";

interface NativeRunResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export class FfmpegExportSession {
  private readonly jobId: string;
  private closed = false;

  private constructor(jobId: string) {
    this.jobId = jobId;
  }

  static async create(jobId: string): Promise<FfmpegExportSession> {
    if (!isTauriRuntime()) throw new NativeRuntimeRequiredError();
    await invoke<string>("ffmpeg_create_job", { jobId });
    return new FfmpegExportSession(jobId);
  }

  async writeFrame(frameIndex: number, blob: Blob): Promise<void> {
    this.assertOpen();
    const filename = `frame_${String(frameIndex).padStart(6, "0")}.png`;
    await this.writeFile(filename, blob);
  }

  async writeAudio(blob: Blob): Promise<void> {
    this.assertOpen();
    await this.writeFile("audio.wav", blob);
  }

  async finish(options: {
    exportSettings: ExportSettings;
    ffmpegSettings: FfmpegSettings;
    audioAvailable: boolean;
  }): Promise<FfmpegCommandPlan> {
    this.assertOpen();
    const plan = buildFfmpegCommand(options);
    const result = await invoke<NativeRunResult>("ffmpeg_run_job", {
      jobId: this.jobId,
      executable: plan.executable,
      args: plan.args
    });
    if (!result.success) {
      throw new FfmpegExecutionError(
        result.stderr.trim() || result.stdout.trim() || "FFmpeg export failed.",
        result.exitCode
      );
    }
    await invoke<void>("ffmpeg_cleanup_job", { jobId: this.jobId });
    this.closed = true;
    return plan;
  }

  async cleanup(): Promise<void> {
    if (this.closed || !isTauriRuntime()) return;
    this.closed = true;
    await invoke<void>("ffmpeg_cleanup_job", { jobId: this.jobId });
  }

  private async writeFile(filename: string, blob: Blob): Promise<void> {
    const data = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke<void>("ffmpeg_write_file", {
      jobId: this.jobId,
      filename,
      data
    });
  }

  private assertOpen(): void {
    if (this.closed) throw new Error("FFmpeg export session is already closed.");
  }
}
