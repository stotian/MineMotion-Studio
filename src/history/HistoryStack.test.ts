import { describe, expect, it } from "vitest";
import { HistoryStack } from "./HistoryStack";

describe("HistoryStack", () => {
  it("supports undo and redo snapshots", () => {
    const history = new HistoryStack<{ value: number }>();

    history.push({ value: 1 }, "one");
    const undo = history.undo({ value: 2 });
    const redo = history.redo({ value: 1 });

    expect(undo).toEqual({ value: 1 });
    expect(redo).toEqual({ value: 2 });
  });
});

