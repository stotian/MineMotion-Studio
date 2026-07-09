import type { MineMotionProject } from "../ProjectFile";
import { createMineMotionPackageData } from "./MineMotionPackage";

export class PackageWriter {
  static write(project: MineMotionProject): Blob {
    const data = createMineMotionPackageData(project);
    return new Blob([JSON.stringify(data, null, 2)], {
      type: "application/vnd.minemotion.package+json"
    });
  }
}
