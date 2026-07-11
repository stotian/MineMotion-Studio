import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { buildFfmpegCommand } from "./FfmpegCommandBuilder";
import { DEFAULT_FFMPEG_SETTINGS } from "./FfmpegSettings";

describe("FFmpeg command builder", () => {
  it("builds an H.264 sequence and audio mux command without shell syntax", () => {
    const project = createInitialProject();
    const plan = buildFfmpegCommand({
      exportSettings: {
        ...project.exportSettings,
        format: "mp4_h264",
        outputName: "Final Fight"
      },
      ffmpegSettings: {
        ...DEFAULT_FFMPEG_SETTINGS,
        outputDirectory: "C:\\Renders",
        overwriteExisting: true
      },
      audioAvailable: true
    });

    expect(plan.outputPath).toBe("C:\\Renders\\final-fight.mp4");
    expect(plan.args).toContain("frame_%06d.png");
    expect(plan.args).toContain("audio.wav");
    expect(plan.args).toContain("libx264");
    expect(plan.args.join(" ")).not.toContain("cmd.exe");
  });

  it("builds MP3 from the staged WAV and rejects missing output directory", () => {
    const project = createInitialProject();
    const settings = { ...project.exportSettings, format: "mp3_audio" as const };
    const plan = buildFfmpegCommand({
      exportSettings: settings,
      ffmpegSettings: {
        ...DEFAULT_FFMPEG_SETTINGS,
        outputDirectory: "D:/Exports"
      },
      audioAvailable: true
    });

    expect(plan.args).toEqual(expect.arrayContaining(["audio.wav", "libmp3lame"]));
    expect(plan.outputPath).toBe("D:/Exports/render.mp3");
    expect(() =>
      buildFfmpegCommand({
        exportSettings: settings,
        ffmpegSettings: DEFAULT_FFMPEG_SETTINGS,
        audioAvailable: true
      })
    ).toThrow(/output directory/i);
  });
});
