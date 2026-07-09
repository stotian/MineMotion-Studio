import type { ImportedWorldSummary } from "../project/ProjectFile";
import type {
  RegionFileSummary,
  WorldFolderScanResult
} from "./MinecraftWorldTypes";
import { WorldImportManager } from "./import/WorldImportManager";
import { relativePathFor } from "./import/DimensionScanner";

export class WorldImporter {
  static async importFromFileList(
    files: FileList | File[]
  ): Promise<ImportedWorldSummary> {
    const scan = await WorldImportManager.scan(files);
    return WorldImportManager.createSummaryFromScan(scan);
  }

  static scanFileList(files: File[]): WorldFolderScanResult {
    const notes: string[] = [];
    let levelDat: File | null = null;
    const overworldRegions: File[] = [];
    const netherRegions: File[] = [];
    const endRegions: File[] = [];

    for (const file of files) {
      const path = relativePathFor(file);
      const normalized = path.replaceAll("\\", "/").toLowerCase();

      if (normalized.endsWith("/level.dat") || normalized === "level.dat") {
        levelDat = file;
      }

      if (!normalized.endsWith(".mca")) {
        continue;
      }

      if (normalized.includes("/dim-1/region/")) {
        netherRegions.push(file);
      } else if (normalized.includes("/dim1/region/")) {
        endRegions.push(file);
      } else if (normalized.includes("/region/")) {
        overworldRegions.push(file);
      }
    }

    if (!levelDat) {
      notes.push("level.dat was not found in the selected folder.");
    }

    if (
      overworldRegions.length + netherRegions.length + endRegions.length ===
      0
    ) {
      notes.push("No .mca region files were found.");
    }

    const sourceName =
      files[0]?.webkitRelativePath?.split(/[\\/]/)[0] ||
      files[0]?.name ||
      "Selected World";

    return {
      sourceName,
      levelDat,
      overworldRegions,
      netherRegions,
      endRegions,
      notes
    };
  }

  static summarizeRegionFiles(files: File[]): RegionFileSummary[] {
    return files.map((file) => {
      const path = WorldImporter.relativePathFor(file);
      const match = /r\.(-?\d+)\.(-?\d+)\.mca$/i.exec(path);
      const normalized = path.replaceAll("\\", "/").toLowerCase();
      const dimension = normalized.includes("/dim-1/")
        ? "nether"
        : normalized.includes("/dim1/")
          ? "end"
          : "overworld";

      return {
        path,
        dimension,
        regionX: match ? Number(match[1]) : null,
        regionZ: match ? Number(match[2]) : null
      };
    });
  }

  private static relativePathFor(file: File): string {
    return relativePathFor(file);
  }
}
