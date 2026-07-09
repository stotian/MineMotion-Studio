import type { BuiltinSfxDefinition } from "./AudioTypes";

export const BUILTIN_SFX: BuiltinSfxDefinition[] = [
  {
    id: "lightning-crack",
    name: "Lightning Crack",
    description: "Placeholder metadata for a sharp lightning crack.",
    suggestedDurationFrames: 18,
    toneHz: 160
  },
  {
    id: "impact-hit",
    name: "Impact Hit",
    description: "Placeholder metadata for a cinematic hit.",
    suggestedDurationFrames: 12,
    toneHz: 92
  },
  {
    id: "whoosh",
    name: "Whoosh",
    description: "Placeholder metadata for camera or speed movement.",
    suggestedDurationFrames: 24,
    toneHz: 220
  },
  {
    id: "deep-boom",
    name: "Deep Boom",
    description: "Placeholder metadata for a low explosion boom.",
    suggestedDurationFrames: 30,
    toneHz: 58
  },
  {
    id: "camera-rumble",
    name: "Camera Rumble",
    description: "Placeholder metadata for shake-heavy moments.",
    suggestedDurationFrames: 36,
    toneHz: 74
  },
  {
    id: "magic-pulse",
    name: "Magic Pulse",
    description: "Placeholder metadata for glowing magical effects.",
    suggestedDurationFrames: 28,
    toneHz: 330
  },
  {
    id: "glitch-pop",
    name: "Glitch Pop",
    description: "Placeholder metadata for digital cuts.",
    suggestedDurationFrames: 10,
    toneHz: 440
  }
];

export function getBuiltinSfx(id: string): BuiltinSfxDefinition | null {
  return BUILTIN_SFX.find((sfx) => sfx.id === id) ?? null;
}
