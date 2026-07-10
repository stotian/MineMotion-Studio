import type { ImportedObjAsset, MineMotionProject } from "../project/ProjectFile";
import type { BlockbenchModelAsset, MinecraftSkinAsset } from "../rigs/RigTypes";
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

  static addSkinAsset(
    project: MineMotionProject,
    skin: MinecraftSkinAsset
  ): MineMotionProject {
    return {
      ...project,
      assets: {
        ...project.assets,
        skins: [
          ...project.assets.skins.filter((candidate) => candidate.id !== skin.id),
          skin
        ]
      }
    };
  }

  static addBlockbenchAsset(
    project: MineMotionProject,
    asset: BlockbenchModelAsset
  ): MineMotionProject {
    return {
      ...project,
      assets: {
        ...project.assets,
        blockbench: [
          ...project.assets.blockbench.filter((candidate) => candidate.id !== asset.id),
          asset
        ]
      },
      rigs: {
        ...project.rigs,
        blockbenchModels: [
          ...project.rigs.blockbenchModels.filter((candidate) => candidate.id !== asset.id),
          asset
        ]
      }
    };
  }
}
