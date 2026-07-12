import { describe, expect, it } from "vitest";
import {
  mergeCanonicalTimelineTracks,
  sanitizeTimelineTracks
} from "./TimelineTrackSanitizer";

describe("TimelineTrackSanitizer", () => {
  it("preserves a valid foreign lane as plain data", () => {
    const lane = {
      id: "track_camera_notes",
      type: "camera",
      name: "Camera Notes",
      items: [
        {
          id: "item_camera_note",
          type: "camera",
          label: "Camera note",
          startFrame: 12,
          durationFrames: 1,
          targetId: "camera_main"
        }
      ]
    };

    expect(sanitizeTimelineTracks([lane])).toEqual([lane]);
  });

  it("drops stale effect items because the canonical lane is derived", () => {
    expect(
      sanitizeTimelineTracks([
        {
          id: "track_effects_main",
          type: "effect",
          name: "Effects",
          items: [null]
        }
      ])[0].items
    ).toEqual([]);
  });

  it("ignores the size and shape of stale items in a derived effect lane", () => {
    const staleItems = new Array(4_097);

    expect(
      sanitizeTimelineTracks([
        {
          id: "track_effects_main",
          type: "effect",
          name: "Effects",
          items: staleItems
        }
      ])[0].items
    ).toEqual([]);
  });

  it("keeps foreign lanes in their source position around canonical lanes", () => {
    const transform = { id: "transform", type: "transform" as const, name: "T", items: [] };
    const effects = { id: "effects", type: "effect" as const, name: "FX", items: [] };
    const foreign = { id: "foreign", type: "camera" as const, name: "F", items: [] };

    expect(
      mergeCanonicalTimelineTracks(
        [foreign, transform, effects],
        [transform, effects]
      ).map((track) => track.id)
    ).toEqual(["foreign", "transform", "effects"]);
  });

  it.each([
    [[null], /plain track/i],
    [[{ id: "x", type: "camera", name: "X", items: null }], /items must be an array/i],
    [[{ id: "x", type: "camera", name: "X", items: [null] }], /plain timeline item/i],
    [[{
      id: "x",
      type: "camera",
      name: "X",
      items: [{
        id: "item",
        type: "camera",
        label: "Item",
        targetId: "camera",
        startFrame: Number.POSITIVE_INFINITY,
        durationFrames: 1
      }]
    }], /startFrame/i]
  ])("rejects malformed foreign timeline data", (tracks, message) => {
    expect(() => sanitizeTimelineTracks(tracks)).toThrow(message);
  });

  it("rejects sparse tracks and sparse foreign items", () => {
    expect(() => sanitizeTimelineTracks(new Array(1))).toThrow(/dense/i);
    expect(() =>
      sanitizeTimelineTracks([
        {
          id: "x",
          type: "camera",
          name: "X",
          items: new Array(1)
        }
      ])
    ).toThrow(/dense/i);
  });
});
