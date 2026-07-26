import { DimensionScanner, relativePathFor } from "./DimensionScanner";
import { LevelDatReader } from "./LevelDatReader";
import type { MinecraftWorldScan } from "./MinecraftChunkTypes";
import { throwIfOperationAborted } from "../../core/async/LatestOperationController";

export class MinecraftWorldScanner {
  static async scan(
    files: FileList | File[],
    signal?: AbortSignal
  ): Promise<MinecraftWorldScan> {
    if (signal) throwIfOperationAborted(signal);
    const fileArray = Array.from(files);
    const warnings: string[] = [];
    const levelDat =
      fileArray.find((file) => {
        const path = relativePathFor(file).replaceAll("\\", "/").toLowerCase();
        return path === "level.dat" || path.endsWith("/level.dat");
      }) ?? null;
    const dimensions = DimensionScanner.scan(fileArray);
    if (signal) throwIfOperationAborted(signal);
    const level = await LevelDatReader.read(levelDat, signal);
    if (signal) throwIfOperationAborted(signal);
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
