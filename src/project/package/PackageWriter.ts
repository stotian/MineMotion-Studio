import { createStoredZip, type ZipEntry } from "../../export/ZipWriter";
import type { MineMotionProject } from "../ProjectFile";
import { createMineMotionPackageData } from "./MineMotionPackage";
import { MINEMOTION_ZIP_FORMAT, MINEMOTION_ZIP_SCHEMA_VERSION, type PackageAssetCategory, type ZipPackageIndex } from "./ZipPackageFormat";

const encoder = new TextEncoder();
const MAX_PACKAGE_ENTRIES = 4096;
const MAX_PACKAGE_ENTRY_BYTES = 64 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 256 * 1024 * 1024;
export class PackageWriter {
  static write(project: MineMotionProject): Blob {
    const data = createMineMotionPackageData(project);
    const entries: ZipEntry[] = [];
    const assets: ZipPackageIndex["assets"] = [];
    for (const [category, records] of Object.entries(data.assets) as [PackageAssetCategory, unknown][]) {
      if (category === "metadata" || !records || typeof records !== "object") continue;
      for (const [path, value] of Object.entries(records as Record<string, string>)) {
        assets.push({ category, path });
        entries.push({ filename: path, data: encoder.encode(value) });
      }
    }
    const index: ZipPackageIndex = {
      format: MINEMOTION_ZIP_FORMAT,
      schemaVersion: MINEMOTION_ZIP_SCHEMA_VERSION,
      projectEntry: "project.json",
      manifestEntry: "manifest.json",
      metadataEntry: "assets/metadata.json",
      assets
    };
    const packageEntries = [
      { filename: "package-index.json", data: encoder.encode(JSON.stringify(index, null, 2)) },
      { filename: "manifest.json", data: encoder.encode(JSON.stringify(data.manifest, null, 2)) },
      { filename: "project.json", data: encoder.encode(JSON.stringify(data.project, null, 2)) },
      { filename: "assets/metadata.json", data: encoder.encode(JSON.stringify(data.assets.metadata, null, 2)) },
      ...entries
    ];
    validateWritablePackage(packageEntries);
    return createStoredZip(packageEntries);
  }
}


function validateWritablePackage(entries: ZipEntry[]): void {
  if (entries.length > MAX_PACKAGE_ENTRIES) throw new Error("Project package contains too many entries.");
  const names = new Set<string>();
  let totalBytes = 0;
  for (const entry of entries) {
    if (names.has(entry.filename)) throw new Error(`Project package contains a duplicate entry: ${entry.filename}.`);
    names.add(entry.filename);
    if (entry.data.byteLength > MAX_PACKAGE_ENTRY_BYTES) throw new Error(`Project package entry exceeds 64 MiB: ${entry.filename}.`);
    totalBytes += entry.data.byteLength;
    if (totalBytes > MAX_PACKAGE_BYTES) throw new Error("Project package exceeds the 256 MiB safety limit.");
  }
}
