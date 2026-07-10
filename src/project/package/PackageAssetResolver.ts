import type { MineMotionPackageData } from "./PackageTypes";

export function resolvePackagedTextAsset(
  data: MineMotionPackageData,
  packagePath: string
): string | null {
  return (
    data.assets.models[packagePath] ??
    data.assets.audio[packagePath] ??
    data.assets.resourcePacks?.[packagePath] ??
    null
  );
}
