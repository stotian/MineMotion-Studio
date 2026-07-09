import { createId } from "../project/ProjectStore";
import type { AudioClip } from "./AudioTypes";
import type { BuiltinSfxDefinition } from "./AudioTypes";

export async function createImportedAudioClip(
  file: File,
  startFrame: number
): Promise<AudioClip> {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: createId("audio"),
    name: file.name.replace(/\.[^.]+$/, "") || "Imported SFX",
    sourceKind: "imported",
    sourceName: file.name,
    mimeType: file.type,
    dataUrl,
    startFrame,
    durationFrames: 48,
    volume: 0.8,
    loop: false,
    importedAt: new Date().toISOString()
  };
}

export function createBuiltinAudioClip(
  sfx: BuiltinSfxDefinition,
  startFrame: number
): AudioClip {
  return {
    id: createId("audio"),
    name: sfx.name,
    sourceKind: "builtin-placeholder",
    sourceName: sfx.id,
    mimeType: "generated/oscillator-placeholder",
    dataUrl: "",
    startFrame,
    durationFrames: sfx.suggestedDurationFrames,
    volume: 0.65,
    loop: false,
    importedAt: new Date().toISOString()
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
