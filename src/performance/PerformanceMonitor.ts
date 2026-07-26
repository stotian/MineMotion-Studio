import type { RenderStats } from "./RenderStats";
import { EMPTY_RENDER_STATS } from "./RenderStats";

export class PerformanceMonitor {
  private lastTime: number | null = null;
  private readonly frameTimes: number[] = [];

  sample(time = performance.now()): RenderStats {
    if (!Number.isFinite(time) || time < 0) return this.stats();
    if (this.lastTime !== null && time >= this.lastTime) {
      const frameMs = time - this.lastTime;
      if (frameMs > 0) this.frameTimes.push(frameMs);
      if (this.frameTimes.length > 120) {
        this.frameTimes.shift();
      }
    }
    this.lastTime = time;
    return this.stats();
  }

  reset(): void {
    this.lastTime = null;
    this.frameTimes.length = 0;
  }

  stats(): RenderStats {
    if (this.frameTimes.length === 0) {
      return EMPTY_RENDER_STATS;
    }
    const total = this.frameTimes.reduce((sum, value) => sum + value, 0);
    const average = total / this.frameTimes.length;
    const sorted = [...this.frameTimes].sort((left, right) => left - right);
    const worst = Math.max(...this.frameTimes);
    return {
      fps: average > 0 ? 1000 / average : 0,
      bestFrameMs: sorted[0],
      averageFrameMs: average,
      p95FrameMs: percentile(sorted, 0.95),
      worstFrameMs: worst,
      droppedFrames: this.frameTimes.filter((value) => value > 1000 / 30).length,
      samples: this.frameTimes.length
    };
  }
}

function percentile(sorted: readonly number[], amount: number): number {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * amount) - 1)
  );
  return sorted[index] ?? 0;
}
