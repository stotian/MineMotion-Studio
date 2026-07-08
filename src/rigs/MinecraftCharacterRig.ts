import type { CharacterEntity } from "../project/ProjectFile";
import type { RigBone } from "./Bone";

export interface MinecraftCharacterRig {
  id: string;
  characterId: string;
  name: string;
  bones: RigBone[];
  character: CharacterEntity;
}

