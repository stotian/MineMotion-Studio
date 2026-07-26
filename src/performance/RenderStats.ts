export interface RenderStats {
  fps: number;
  bestFrameMs: number;
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  droppedFrames: number;
  samples: number;
}

export const EMPTY_RENDER_STATS: RenderStats = {
  fps: 0,
  bestFrameMs: 0,
  averageFrameMs: 0,
  p95FrameMs: 0,
  worstFrameMs: 0,
  droppedFrames: 0,
  samples: 0
};
