import { useEffect, useRef } from "react";
import type { MineMotionProject } from "../project/ProjectFile";
import { AudioManager } from "./AudioManager";

export function useProjectAudioPlayback(project: MineMotionProject): void {
  const managerRef = useRef<AudioManager | null>(null);
  useEffect(() => {
    managerRef.current ??= new AudioManager();
    managerRef.current.syncClips(
      project.audio.clips,
      project.animation.currentFrame,
      project.animation.fps,
      project.animation.isPlaying
    );
  }, [project.animation.currentFrame, project.animation.fps, project.animation.isPlaying, project.audio.clips]);

  useEffect(() => () => {
    const manager = managerRef.current;
    managerRef.current = null;
    if (manager) void manager.dispose();
  }, []);
}
