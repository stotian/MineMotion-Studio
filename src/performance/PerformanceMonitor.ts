import type { RenderStats } from "./RenderStats";
import { EMPTY_RENDER_STATS } from "./RenderStats";

export class PerformanceMonitor {
  private lastTime = 0;
  private readonly frameTimes: number[] = [];

  sample(time = performance.now()): RenderStats {
    if (this.lastTime > 0) {
      const frameMs = time - this.lastTime;
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length > 120) {
        this.frameTimes.shift();
      }
    }
    this.lastTime = time;
    return this.stats();
  }

  reset(): void {
    this.lastTime = 0;
    this.frameTimes.length = 0;
  }

  stats(): RenderStats {
    if (this.frameTimes.length === 0) {
      return EMPTY_RENDER_STATS;
    }
    const total = this.frameTimes.reduce((sum, value) => sum + value, 0);
    const average = total / this.frameTimes.length;
    const worst = Math.max(...this.frameTimes);
    return {
      fps: average > 0 ? 1000 / average : 0,
      averageFrameMs: average,
      worstFrameMs: worst,
      droppedFrames: this.frameTimes.filter((value) => value > 1000 / 30).length,
      samples: this.frameTimes.length
    };
  }
}
