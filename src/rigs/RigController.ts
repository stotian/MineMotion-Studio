import type { Vector3Tuple } from "../project/ProjectFile";
import type { MinecraftCharacterRig } from "./MinecraftCharacterRig";

export class RigController {
  constructor(private readonly rig: MinecraftCharacterRig) {}

  setBoneRotation(boneId: string, rotation: Vector3Tuple): MinecraftCharacterRig {
    return {
      ...this.rig,
      character: {
        ...this.rig.character,
        boneRotations: {
          ...this.rig.character.boneRotations,
          [boneId]: [...rotation]
        }
      }
    };
  }
}

