import type { IKJoint, IKTarget } from "./IKTypes";

export interface IKChain {
  id: string;
  label: string;
  rootBoneId: string;
  endBoneId: string;
  joints: IKJoint[];
  target?: IKTarget;
}

export function createIKChain(
  id: string,
  label: string,
  rootBoneId: string,
  endBoneId: string,
  joints: IKJoint[]
): IKChain {
  return {
    id,
    label,
    rootBoneId,
    endBoneId,
    joints
  };
}
