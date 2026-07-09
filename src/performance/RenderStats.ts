export interface RenderStats {
  fps: number;
  averageFrameMs: number;
  worstFrameMs: number;
  droppedFrames: number;
  samples: number;
}

export const EMPTY_RENDER_STATS: RenderStats = {
  fps: 0,
  averageFrameMs: 0,
  worstFrameMs: 0,
  droppedFrames: 0,
  samples: 0
};
