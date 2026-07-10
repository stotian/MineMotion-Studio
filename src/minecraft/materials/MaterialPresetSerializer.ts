import type { MinecraftMaterialSettings } from "./MinecraftMaterialTypes";
import { withMinecraftMaterialDefaults } from "./MinecraftMaterialPresets";

export class MaterialPresetSerializer {
  static serialize(settings: MinecraftMaterialSettings): string {
    return JSON.stringify(withMinecraftMaterialDefaults(settings), null, 2);
  }

  static parse(raw: string): MinecraftMaterialSettings {
    const parsed = JSON.parse(raw) as Partial<MinecraftMaterialSettings>;
    return withMinecraftMaterialDefaults(parsed);
  }
}
