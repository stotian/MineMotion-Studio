import type {
  MinecraftDimensionId,
  MinecraftDimensionScan,
  MinecraftRegionFileRef
} from "./MinecraftChunkTypes";
import { McaFileReader } from "./McaFileReader";

export class DimensionScanner {
  static scan(files: File[]): MinecraftDimensionScan[] {
    const dimensions: Record<MinecraftDimensionId, MinecraftRegionFileRef[]> = {
      overworld: [],
      nether: [],
      end: []
    };

    for (const file of files) {
      const path = relativePathFor(file);
      const normalized = path.replaceAll("\\", "/").toLowerCase();
      if (!normalized.endsWith(".mca")) continue;

      const dimension = dimensionForPath(normalized);
      const coordinates = McaFileReader.parseRegionCoordinates(path);
      dimensions[dimension].push({
        path,
        file,
        dimension,
        regionX: coordinates?.regionX ?? null,
        regionZ: coordinates?.regionZ ?? null,
        chunkLocations: 0,
        estimatedChunks: 1024
      });
    }

    return [
      createDimension("overworld", "Overworld", dimensions.overworld),
      createDimension("nether", "Nether", dimensions.nether),
      createDimension("end", "End", dimensions.end)
    ];
  }
}

export function relativePathFor(file: File): string {
  const relativePath = (file as File & { webkitRelativePath?: string })
    .webkitRelativePath;
  return relativePath || file.name;
}

function dimensionForPath(path: string): MinecraftDimensionId {
  if (path.includes("/dim-1/region/")) return "nether";
  if (path.includes("/dim1/region/")) return "end";
  return "overworld";
}

function createDimension(
  id: MinecraftDimensionId,
  label: string,
  regionFiles: MinecraftRegionFileRef[]
): MinecraftDimensionScan {
  return {
    id,
    label,
    regionFiles,
    estimatedChunks: regionFiles.length * 1024
  };
}
