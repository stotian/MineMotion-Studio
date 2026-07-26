import { useEffect, useRef } from "react";
import type { MineMotionProject } from "../project/ProjectFile";
import { AudioManager } from "./AudioManager";
import { findClipsStartingAtFrame } from "./AudioTimelineIntegration";

export function useProjectAudioPlayback(project: MineMotionProject): void {
  const managerRef = useRef<AudioManager | null>(null);
  const previousFrameRef = useRef(0);

  useEffect(() => {
    managerRef.current ??= new AudioManager();
    if (!project.animation.isPlaying) {
      previousFrameRef.current = project.animation.currentFrame;
      return;
    }

    const previousFrame = previousFrameRef.current;
    const currentFrame = project.animation.currentFrame;
    for (const clip of findClipsStartingAtFrame(
      project.audio.clips,
      currentFrame,
      previousFrame
    )) {
      managerRef.current.playClip(clip);
    }
    previousFrameRef.current = currentFrame;
  }, [
    project.animation.currentFrame,
    project.animation.isPlaying,
    project.audio.clips
  ]);

  useEffect(
    () => () => {
      const manager = managerRef.current;
      managerRef.current = null;
      if (manager) void manager.dispose();
    },
    []
  );
}
