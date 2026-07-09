import { DimensionScanner, relativePathFor } from "./DimensionScanner";
import { LevelDatReader } from "./LevelDatReader";
import type { MinecraftWorldScan } from "./MinecraftChunkTypes";

export class MinecraftWorldScanner {
  static async scan(files: FileList | File[]): Promise<MinecraftWorldScan> {
    const fileArray = Array.from(files);
    const warnings: string[] = [];
    const levelDat =
      fileArray.find((file) => {
        const path = relativePathFor(file).replaceAll("\\", "/").toLowerCase();
        return path === "level.dat" || path.endsWith("/level.dat");
      }) ?? null;
    const dimensions = DimensionScanner.scan(fileArray);
    const level = await LevelDatReader.read(levelDat);
    warnings.push(...level.warnings);

    if (!levelDat) {
      warnings.push("level.dat was not found in the selected folder.");
    }
    if (dimensions.every((dimension) => dimension.regionFiles.length === 0)) {
      warnings.push("No .mca region files were found.");
    }

    return {
      sourceName:
        fileArray[0]?.webkitRelativePath?.split(/[\\/]/)[0] ||
        fileArray[0]?.name ||
        "Selected World",
      levelDat,
      level,
      dimensions,
      warnings
    };
  }
}
