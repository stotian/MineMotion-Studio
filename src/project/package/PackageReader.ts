import { ProjectSerializer } from "../ProjectSerializer";
import type { MineMotionProject } from "../ProjectFile";
import type { MineMotionPackageData } from "./PackageTypes";
import { validatePackageData } from "./PackageValidator";

export class PackageReader {
  static async read(file: File): Promise<MineMotionProject> {
    const raw = await file.text();
    return PackageReader.parse(raw);
  }

  static parse(raw: string): MineMotionProject {
    const parsed = JSON.parse(raw) as MineMotionPackageData;
    const validation = validatePackageData(parsed);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }
    return ProjectSerializer.parse(JSON.stringify(parsed.project));
  }

  static looksLikePackage(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as Partial<MineMotionPackageData>;
      return parsed.packageFormat === "minemotion-package-json";
    } catch {
      return false;
    }
  }
}
