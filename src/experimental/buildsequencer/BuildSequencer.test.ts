import { describe, expect, it } from "vitest";
import {
  blockRevealFrame,
  blockRevealOpacity,
  buildBuildSchedule,
  isBlockRevealed,
  revealedBlockCount
} from "./BuildSequencer";
import {
  BUILD_SEQUENCER_MAX_BLOCKS,
  type BuildBlockPoint,
  type BuildRevealStrategy,
  type BuildSequenceSettings
} from "./BuildSequenceTypes";

// A small solid 4x3x4 structure (like a house footprint) with distinct coords.
function structure(): BuildBlockPoint[] {
  const blocks: BuildBlockPoint[] = [];
  for (let x = 0; x < 4; x += 1) {
    for (let y = 0; y < 3; y += 1) {
      for (let z = 0; z < 4; z += 1) {
        blocks.push({ x, y, z });
      }
    }
  }
  return blocks;
}

const ALL_STRATEGIES: BuildRevealStrategy[] = [
  { kind: "layer", axis: "y", direction: "ascending" },
  { kind: "layer", axis: "y", direction: "descending" },
  { kind: "scan", axis: "x", direction: "ascending" },
  { kind: "scan", axis: "z", direction: "descending" },
  { kind: "radial", origin: [1.5, 0, 1.5], direction: "ascending" },
  { kind: "radial", origin: [1.5, 0, 1.5], direction: "descending" },
  { kind: "scatter", seed: 1337 }
];

function settingsFor(strategy: BuildRevealStrategy, over: Partial<BuildSequenceSettings> = {}): BuildSequenceSettings {
  return { strategy, startFrame: 10, durationFrames: 90, fadeFrames: 0, ...over };
}

describe("BuildSequencer core", () => {
  describe.each(ALL_STRATEGIES.map((strategy) => [strategy.kind + (":" + JSON.stringify(strategy)), strategy] as const))(
    "strategy %s",
    (_label, strategy) => {
      const blocks = structure();
      const settings = settingsFor(strategy);

      it("is fully deterministic across repeated calls", () => {
        expect(buildBuildSchedule(blocks, settings)).toEqual(buildBuildSchedule(blocks, settings));
      });

      it("is content-addressed: independent of input block order", () => {
        const shuffled = [...blocks].reverse();
        const base = buildBuildSchedule(blocks, settings);
        const other = buildBuildSchedule(shuffled, settings);
        // Map each coordinate to its reveal frame and compare the two maps.
        const frameByCoord = (bs: BuildBlockPoint[], schedule = buildBuildSchedule(bs, settings)) =>
          new Map(bs.map((b, i) => [`${b.x},${b.y},${b.z}`, schedule.revealFrames[i]]));
        expect(frameByCoord(shuffled, other)).toEqual(frameByCoord(blocks, base));
      });

      it("keeps every reveal frame inside the window and reveals all blocks by the end", () => {
        const schedule = buildBuildSchedule(blocks, settings);
        expect(schedule.blockCount).toBe(blocks.length);
        for (const frame of schedule.revealFrames) {
          expect(frame).toBeGreaterThanOrEqual(settings.startFrame);
          expect(frame).toBeLessThanOrEqual(settings.startFrame + settings.durationFrames);
        }
        expect(revealedBlockCount(schedule, settings.startFrame - 1)).toBe(0);
        expect(revealedBlockCount(schedule, schedule.completeFrame)).toBe(blocks.length);
        // Reveal is monotonic over time.
        let previous = 0;
        for (let frame = settings.startFrame - 1; frame <= schedule.completeFrame; frame += 1) {
          const count = revealedBlockCount(schedule, frame);
          expect(count).toBeGreaterThanOrEqual(previous);
          previous = count;
        }
      });
    }
  );

  it("reveals discrete layers together and in axis order (layer strategy)", () => {
    const blocks = structure();
    const schedule = buildBuildSchedule(blocks, settingsFor({ kind: "layer", axis: "y", direction: "ascending" }));
    // Exactly one distinct step per distinct Y value (0,1,2).
    expect(schedule.distinctSteps).toBe(3);
    // All blocks on the same Y layer share the same reveal frame, and lower Y reveals first.
    const frameByLayer = new Map<number, number>();
    blocks.forEach((block, index) => {
      const frame = schedule.revealFrames[index];
      const existing = frameByLayer.get(block.y);
      if (existing === undefined) frameByLayer.set(block.y, frame);
      else expect(frame).toBe(existing);
    });
    expect(frameByLayer.get(0)!).toBeLessThan(frameByLayer.get(1)!);
    expect(frameByLayer.get(1)!).toBeLessThan(frameByLayer.get(2)!);
  });

  it("sweeps continuously and monotonically along the axis (scan strategy)", () => {
    const blocks = structure();
    const schedule = buildBuildSchedule(blocks, settingsFor({ kind: "scan", axis: "x", direction: "ascending" }));
    blocks.forEach((a, i) => {
      blocks.forEach((b, j) => {
        if (a.x < b.x) expect(schedule.revealFrames[i]).toBeLessThanOrEqual(schedule.revealFrames[j]);
      });
    });
  });

  it("grows outward by distance from the anchor (radial ascending) and inward when descending", () => {
    const blocks = structure();
    const origin: [number, number, number] = [1.5, 0, 1.5];
    const dist2 = (b: BuildBlockPoint) => (b.x - origin[0]) ** 2 + (b.y - origin[1]) ** 2 + (b.z - origin[2]) ** 2;
    const asc = buildBuildSchedule(blocks, settingsFor({ kind: "radial", origin, direction: "ascending" }));
    const desc = buildBuildSchedule(blocks, settingsFor({ kind: "radial", origin, direction: "descending" }));
    blocks.forEach((a, i) => {
      blocks.forEach((b, j) => {
        if (dist2(a) < dist2(b)) {
          expect(asc.revealFrames[i]).toBeLessThanOrEqual(asc.revealFrames[j]);
          expect(desc.revealFrames[i]).toBeGreaterThanOrEqual(desc.revealFrames[j]);
        }
      });
    });
  });

  it("makes scatter reproducible per seed but different across seeds", () => {
    const blocks = structure();
    const a1 = buildBuildSchedule(blocks, settingsFor({ kind: "scatter", seed: 1 }));
    const a1Again = buildBuildSchedule(blocks, settingsFor({ kind: "scatter", seed: 1 }));
    const a2 = buildBuildSchedule(blocks, settingsFor({ kind: "scatter", seed: 2 }));
    expect(a1.revealFrames).toEqual(a1Again.revealFrames);
    expect(a1.revealFrames).not.toEqual(a2.revealFrames);
    // Every block still reveals within the window.
    expect(new Set(a1.revealFrames).size).toBeGreaterThan(1);
  });

  describe("fade / opacity", () => {
    it("pops instantly with a zero fade", () => {
      const blocks = structure();
      const schedule = buildBuildSchedule(blocks, settingsFor({ kind: "scan", axis: "x", direction: "ascending" }, { fadeFrames: 0 }));
      const reveal = blockRevealFrame(schedule, 0);
      expect(blockRevealOpacity(schedule, 0, reveal - 1)).toBe(0);
      expect(blockRevealOpacity(schedule, 0, reveal)).toBe(1);
    });

    it("ramps linearly across the fade window", () => {
      const blocks = structure();
      const schedule = buildBuildSchedule(blocks, settingsFor({ kind: "scan", axis: "x", direction: "ascending" }, { fadeFrames: 4 }));
      const reveal = blockRevealFrame(schedule, 0);
      expect(blockRevealOpacity(schedule, 0, reveal - 1)).toBe(0);
      expect(blockRevealOpacity(schedule, 0, reveal)).toBe(0);
      expect(blockRevealOpacity(schedule, 0, reveal + 2)).toBeCloseTo(0.5, 5);
      expect(blockRevealOpacity(schedule, 0, reveal + 4)).toBe(1);
      expect(blockRevealOpacity(schedule, 0, reveal + 100)).toBe(1);
      expect(isBlockRevealed(schedule, 0, reveal)).toBe(true);
      expect(isBlockRevealed(schedule, 0, reveal - 1)).toBe(false);
    });
  });

  describe("cinematic pacing", () => {
    // A 101-block line so reveal ranks spread uniformly along the axis.
    const line: BuildBlockPoint[] = Array.from({ length: 101 }, (_, x) => ({ x, y: 0, z: 0 }));
    const base = { strategy: { kind: "scan", axis: "x", direction: "ascending" } as const, startFrame: 0, durationFrames: 100, fadeFrames: 0 };
    const midFrame = 50;
    const revealedAtMid = (pacing: BuildSequenceSettings["pacing"]) =>
      revealedBlockCount(buildBuildSchedule(line, { ...base, pacing }), midFrame);

    it("defaults to linear", () => {
      expect(buildBuildSchedule(line, base).revealFrames).toEqual(
        buildBuildSchedule(line, { ...base, pacing: "linear" }).revealFrames
      );
    });

    it("orders reveal density ease-in < linear < ease-out at the midpoint", () => {
      const easeIn = revealedAtMid("ease-in");
      const linear = revealedAtMid("linear");
      const easeOut = revealedAtMid("ease-out");
      expect(easeIn).toBeLessThan(linear); // slow start
      expect(linear).toBeLessThan(easeOut); // fast start
      expect(linear).toBeGreaterThanOrEqual(50); // roughly half by the midpoint
    });

    it("keeps ease-in-out symmetric and slow at both ends", () => {
      const schedule = buildBuildSchedule(line, { ...base, pacing: "ease-in-out" });
      expect(revealedBlockCount(schedule, midFrame)).toBe(51); // half by the midpoint
      // Fewer revealed in the first quarter than the linear pace (slow start).
      const linear = buildBuildSchedule(line, { ...base, pacing: "linear" });
      expect(revealedBlockCount(schedule, 25)).toBeLessThan(revealedBlockCount(linear, 25));
    });

    it("preserves order, completeness and monotonicity under every pacing", () => {
      for (const pacing of ["linear", "ease-in", "ease-out", "ease-in-out"] as const) {
        const schedule = buildBuildSchedule(line, { ...base, pacing });
        expect(revealedBlockCount(schedule, base.startFrame - 1)).toBe(0);
        expect(revealedBlockCount(schedule, schedule.completeFrame)).toBe(line.length);
        // Reveal frames never decrease along the sweep axis (order preserved).
        for (let i = 1; i < line.length; i += 1) {
          expect(schedule.revealFrames[i]).toBeGreaterThanOrEqual(schedule.revealFrames[i - 1]);
        }
      }
    });

    it("rejects an unknown pacing", () => {
      expect(() =>
        buildBuildSchedule(line, { ...base, pacing: "bounce" as unknown as BuildSequenceSettings["pacing"] })
      ).toThrow(/unknown build pacing/i);
    });
  });

  describe("build direction (mode)", () => {
    const blocks = structure();
    const assembleSettings = settingsFor({ kind: "layer", axis: "y", direction: "ascending" }, { fadeFrames: 4 });
    const disSettings = { ...assembleSettings, mode: "disassemble" as const };

    it("records the mode on the schedule (defaulting to assemble)", () => {
      expect(buildBuildSchedule(blocks, assembleSettings).mode).toBe("assemble");
      expect(buildBuildSchedule(blocks, disSettings).mode).toBe("disassemble");
    });

    it("shares the same reveal frames as assemble but mirrors visibility", () => {
      const asm = buildBuildSchedule(blocks, assembleSettings);
      const dis = buildBuildSchedule(blocks, disSettings);
      expect(dis.revealFrames).toEqual(asm.revealFrames);
      // Disassemble starts full and empties out — the mirror of assemble.
      expect(revealedBlockCount(dis, dis.startFrame - 1)).toBe(blocks.length);
      expect(revealedBlockCount(dis, dis.completeFrame)).toBe(0);
      // Monotonically decreasing.
      let previous = blocks.length;
      for (let frame = dis.startFrame - 1; frame <= dis.completeFrame; frame += 1) {
        const count = revealedBlockCount(dis, frame);
        expect(count).toBeLessThanOrEqual(previous);
        previous = count;
      }
    });

    it("fades blocks out instead of in", () => {
      const dis = buildBuildSchedule(blocks, disSettings);
      const reveal = blockRevealFrame(dis, 0);
      expect(blockRevealOpacity(dis, 0, reveal - 1)).toBe(1);
      expect(blockRevealOpacity(dis, 0, reveal)).toBe(1);
      expect(blockRevealOpacity(dis, 0, reveal + 2)).toBeCloseTo(0.5, 5);
      expect(blockRevealOpacity(dis, 0, reveal + 4)).toBe(0);
    });

    it("rejects an unknown mode", () => {
      expect(() =>
        buildBuildSchedule(blocks, { ...assembleSettings, mode: "melt" as unknown as "assemble" })
      ).toThrow(/unknown build mode/i);
    });
  });

  describe("degenerate and invalid inputs", () => {
    it("returns an empty schedule for no blocks", () => {
      const schedule = buildBuildSchedule([], settingsFor({ kind: "scatter", seed: 5 }));
      expect(schedule.blockCount).toBe(0);
      expect(schedule.revealFrames).toEqual([]);
      expect(schedule.distinctSteps).toBe(0);
      expect(revealedBlockCount(schedule, 999)).toBe(0);
    });

    it("reveals a single block exactly at the start frame", () => {
      const schedule = buildBuildSchedule([{ x: 3, y: 3, z: 3 }], settingsFor({ kind: "radial", origin: [0, 0, 0], direction: "ascending" }));
      expect(schedule.revealFrames).toEqual([schedule.startFrame]);
      expect(schedule.lastRevealFrame).toBe(schedule.startFrame);
    });

    it("reveals the whole build at once with a zero duration", () => {
      const blocks = structure();
      const schedule = buildBuildSchedule(blocks, settingsFor({ kind: "layer", axis: "y", direction: "ascending" }, { durationFrames: 0 }));
      expect(new Set(schedule.revealFrames)).toEqual(new Set([schedule.startFrame]));
    });

    it("rejects more blocks than the safe cap", () => {
      const tooMany = Array.from({ length: BUILD_SEQUENCER_MAX_BLOCKS + 1 }, (_, i) => ({ x: i, y: 0, z: 0 }));
      expect(() => buildBuildSchedule(tooMany, settingsFor({ kind: "scatter", seed: 0 }))).toThrow(/limited to/i);
    });

    it("rejects non-finite coordinates and timing", () => {
      expect(() => buildBuildSchedule([{ x: 0, y: Number.NaN, z: 0 }], settingsFor({ kind: "scan", axis: "y", direction: "ascending" }))).toThrow(/non-finite/i);
      expect(() => buildBuildSchedule([{ x: 0, y: 0, z: 0 }], settingsFor({ kind: "scan", axis: "y", direction: "ascending" }, { startFrame: Number.POSITIVE_INFINITY }))).toThrow(/finite/i);
    });

    it("rejects malformed strategies", () => {
      expect(() => buildBuildSchedule([{ x: 0, y: 0, z: 0 }], settingsFor({ kind: "radial", origin: [0, 0] as unknown as [number, number, number], direction: "ascending" }))).toThrow(/three finite/i);
      expect(() => buildBuildSchedule([{ x: 0, y: 0, z: 0 }], { strategy: { kind: "spiral" } as unknown as BuildRevealStrategy, startFrame: 0, durationFrames: 10 })).toThrow(/unknown build strategy/i);
    });

    it("clamps negative duration and fade to zero", () => {
      const schedule = buildBuildSchedule([{ x: 0, y: 0, z: 0 }], settingsFor({ kind: "scatter", seed: 1 }, { durationFrames: -50, fadeFrames: -3 }));
      expect(schedule.completeFrame).toBe(schedule.startFrame);
      expect(schedule.fadeFrames).toBe(0);
    });
  });
});
