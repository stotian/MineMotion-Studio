import type { TimelineMarker } from "../../project/ProjectFile";

export function createTimelineMarker(
  name: string,
  frame: number,
  color = "#f7d56b"
): TimelineMarker {
  return {
    id: `marker_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Marker",
    frame: Math.max(0, Math.round(frame)),
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#f7d56b"
  };
}

export function upsertMarker(
  markers: TimelineMarker[],
  marker: TimelineMarker
): TimelineMarker[] {
  return [
    ...markers.filter((candidate) => candidate.id !== marker.id),
    marker
  ].sort((left, right) => left.frame - right.frame);
}

export function removeMarker(markers: TimelineMarker[], markerId: string): TimelineMarker[] {
  return markers.filter((marker) => marker.id !== markerId);
}

export function serializeMarkers(markers: TimelineMarker[]): string {
  return JSON.stringify(markers);
}

export function parseMarkers(raw: string): TimelineMarker[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const marker = value as Partial<TimelineMarker>;
    return [{
      id: typeof marker.id === "string" ? marker.id : `marker_${index}`,
      name: typeof marker.name === "string" && marker.name.trim() ? marker.name : "Marker",
      frame: Math.max(0, Math.round(Number(marker.frame) || 0)),
      color:
        typeof marker.color === "string" && /^#[0-9a-f]{6}$/i.test(marker.color)
          ? marker.color
          : "#f7d56b"
    }];
  }).sort((left, right) => left.frame - right.frame);
}
