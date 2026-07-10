import type {
  MinecraftSkinAsset,
  MinecraftSkinMetadata,
  MinecraftSkinModelType
} from "./RigTypes";

export class MinecraftSkinImporter {
  static validateDimensions(
    width: number,
    height: number,
    fileName = ""
  ): MinecraftSkinMetadata {
    const warnings: string[] = [];
    const valid = width === 64 && (height === 64 || height === 32);
    const legacy = width === 64 && height === 32;

    if (!valid) {
      warnings.push("Minecraft skins must be 64x64 or legacy 64x32 PNG images.");
    }
    if (legacy) {
      warnings.push("Legacy 64x32 skin detected; left limbs reuse right limb UVs.");
    }

    return {
      width,
      height,
      valid,
      legacy,
      modelType: guessModelTypeFromName(fileName),
      warnings
    };
  }

  static async fromFile(file: File): Promise<MinecraftSkinAsset> {
    if (file.type && file.type !== "image/png") {
      throw new Error("Skin import expects a PNG file.");
    }

    const dataUrl = await readFileAsDataUrl(file);
    const size = await readImageSize(dataUrl);
    const metadata = MinecraftSkinImporter.validateDimensions(
      size.width,
      size.height,
      file.name
    );

    return {
      id: `skin_${Date.now().toString(36)}`,
      name: file.name,
      dataUrl,
      importedAt: new Date().toISOString(),
      metadata
    };
  }
}

export function guessModelTypeFromName(name: string): MinecraftSkinModelType {
  const normalized = name.toLowerCase();
  if (normalized.includes("alex") || normalized.includes("slim")) {
    return "alex";
  }
  if (normalized.includes("steve") || normalized.includes("classic")) {
    return "steve";
  }
  return "steve";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read skin PNG."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function readImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("Could not decode skin PNG."));
    image.onload = () =>
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    image.src = dataUrl;
  });
}
