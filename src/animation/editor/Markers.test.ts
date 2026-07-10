import { describe, expect, it } from "vitest";
import {
  createTimelineMarker,
  parseMarkers,
  serializeMarkers,
  upsertMarker
} from "./Markers";

describe("Markers", () => {
  it("serializes named markers in frame order", () => {
    const late = createTimelineMarker("Impact", 42, "#ff0000");
    const early = createTimelineMarker("Beat", 12, "#00ff00");
    const markers = upsertMarker(upsertMarker([], late), early);
    const parsed = parseMarkers(serializeMarkers(markers));

    expect(parsed.map((marker) => marker.name)).toEqual(["Beat", "Impact"]);
    expect(parsed[1].color).toBe("#ff0000");
  });

  it("sanitizes invalid marker fields", () => {
    const parsed = parseMarkers('[{"frame":-4,"color":"bad"}]');

    expect(parsed[0].frame).toBe(0);
    expect(parsed[0].color).toBe("#f7d56b");
  });
});
