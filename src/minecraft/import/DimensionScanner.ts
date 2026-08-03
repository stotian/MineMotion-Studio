import type {
  MinecraftDimensionId,
  MinecraftDimensionScan,
  MinecraftRegionFileRef
} from "./MinecraftChunkTypes";
import { McaFileReader } from "./McaFileReader";

interface DimensionDescriptor {
  readonly id: MinecraftDimensionId;
  readonly label: string;
}

const STANDARD_DIMENSIONS: readonly DimensionDescriptor[] = Object.freeze([
  { id: "overworld", label: "Overworld" },
  { id: "nether", label: "Nether" },
  { id: "end", label: "End" }
]);

export class DimensionScanner {
  static scan(files: File[]): MinecraftDimensionScan[] {
    const dimensions = new Map<
      MinecraftDimensionId,
      { label: string; regionFiles: MinecraftRegionFileRef[] }
    >(
      STANDARD_DIMENSIONS.map((dimension) => [
        dimension.id,
        { label: dimension.label, regionFiles: [] }
      ])
    );

    for (const file of files) {
      const path = relativePathFor(file);
      const normalized = path.replaceAll("\\", "/").toLowerCase();
      if (!isRegionFilePath(normalized)) continue;

      const descriptor = dimensionForPath(normalized);
      const dimension = dimensions.get(descriptor.id) ?? {
        label: descriptor.label,
        regionFiles: []
      };
      const coordinates = McaFileReader.parseRegionCoordinates(path);
      dimension.regionFiles.push({
        path,
        file,
        dimension: descriptor.id,
        regionX: coordinates?.regionX ?? null,
        regionZ: coordinates?.regionZ ?? null,
        chunkLocations: 0,
        estimatedChunks: 1024
      });
      dimensions.set(descriptor.id, dimension);
    }

    return [...dimensions.entries()]
      .map(([id, value]) => createDimension(id, value.label, value.regionFiles))
      .sort(compareDimensions);
  }
}

export function relativePathFor(file: File): string {
  const relativePath = (file as File & { webkitRelativePath?: string })
    .webkitRelativePath;
  return relativePath || file.name;
}

function isRegionFilePath(path: string): boolean {
  return path.endsWith(".mca") && /(?:^|\/)region\/[^/]+\.mca$/.test(path);
}

function dimensionForPath(path: string): DimensionDescriptor {
  if (path.includes("/dim-1/region/")) {
    return { id: "nether", label: "Nether" };
  }
  if (path.includes("/dim1/region/")) {
    return { id: "end", label: "End" };
  }

  const custom = path.match(
    /(?:^|\/)dimensions\/([^/]+)\/(.+?)\/region\/[^/]+\.mca$/
  );
  if (custom) {
    const namespace = custom[1];
    const dimensionPath = custom[2];
    return {
      id: `custom:${namespace}:${dimensionPath.replaceAll("/", ":")}`,
      label: `${namespace}:${dimensionPath}`
    };
  }

  return { id: "overworld", label: "Overworld" };
}

function createDimension(
  id: MinecraftDimensionId,
  label: string,
  regionFiles: MinecraftRegionFileRef[]
): MinecraftDimensionScan {
  const orderedFiles = [...regionFiles].sort((a, b) =>
    a.regionZ === b.regionZ
      ? (a.regionX ?? Number.MAX_SAFE_INTEGER) -
        (b.regionX ?? Number.MAX_SAFE_INTEGER)
      : (a.regionZ ?? Number.MAX_SAFE_INTEGER) -
        (b.regionZ ?? Number.MAX_SAFE_INTEGER)
  );
  return {
    id,
    label,
    regionFiles: orderedFiles,
    estimatedChunks: orderedFiles.length * 1024
  };
}

function compareDimensions(
  left: MinecraftDimensionScan,
  right: MinecraftDimensionScan
): number {
  const standardOrder = new Map<MinecraftDimensionId, number>([
    ["overworld", 0],
    ["nether", 1],
    ["end", 2]
  ]);
  const leftOrder = standardOrder.get(left.id) ?? 3;
  const rightOrder = standardOrder.get(right.id) ?? 3;
  return leftOrder === rightOrder
    ? left.label.localeCompare(right.label)
    : leftOrder - rightOrder;
}
