import type { ImportedObjAsset, MineMotionProject } from "../project/ProjectFile";
import { createId } from "../project/ProjectStore";

export class AssetManager {
  static addObjAsset(
    project: MineMotionProject,
    name: string,
    rawObj: string
  ): { project: MineMotionProject; asset: ImportedObjAsset } {
    const asset: ImportedObjAsset = {
      id: createId("asset_obj"),
      name,
      rawObj,
      importedAt: new Date().toISOString()
    };

    return {
      asset,
      project: {
        ...project,
        assets: {
          ...project.assets,
          obj: [...project.assets.obj, asset]
        }
      }
    };
  }
}

