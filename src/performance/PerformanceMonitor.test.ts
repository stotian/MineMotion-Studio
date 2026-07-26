import { describe, expect, it } from "vitest";
import { PerformanceMonitor } from "./PerformanceMonitor";

describe("PerformanceMonitor", () => {
  it("reports deterministic rolling frame statistics and percentiles", () => {
    const monitor = new PerformanceMonitor();
    monitor.sample(0);
    monitor.sample(10);
    monitor.sample(30);
    monitor.sample(60);
    const stats = monitor.stats();

    expect(stats).toEqual({
      fps: 50,
      bestFrameMs: 10,
      averageFrameMs: 20,
      p95FrameMs: 30,
      worstFrameMs: 30,
      droppedFrames: 0,
      samples: 3
    });
  });

  it("bounds the rolling window and ignores invalid or reversed clocks", () => {
    const monitor = new PerformanceMonitor();
    monitor.sample(1);
    for (let index = 1; index <= 130; index += 1) {
      monitor.sample(1 + index * 40);
    }
    monitor.sample(Number.NaN);
    monitor.sample(2);
    expect(monitor.stats()).toMatchObject({
      bestFrameMs: 40,
      averageFrameMs: 40,
      p95FrameMs: 40,
      worstFrameMs: 40,
      droppedFrames: 120,
      samples: 120
    });
    monitor.reset();
    expect(monitor.stats().samples).toBe(0);
  });
});
