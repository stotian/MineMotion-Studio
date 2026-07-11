export type Vector3Tuple = [number, number, number];

export interface TransformData {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type SceneObjectType =
  | "world"
  | "chunkMesh"
  | "character"
  | "rigBone"
  | "camera"
  | "obj"
  | "light"
  | "empty"
  | "helper";

export interface SceneEntity {
  id: string;
  type: SceneObjectType;
  name: string;
  transform: TransformData;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, unknown>;
}

export const DEFAULT_TRANSFORM: TransformData = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export function cloneTransform(transform: TransformData): TransformData {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

export function createTransform(
  partial: Partial<TransformData> = {}
): TransformData {
  return {
    position: partial.position ? [...partial.position] : [0, 0, 0],
    rotation: partial.rotation ? [...partial.rotation] : [0, 0, 0],
    scale: partial.scale ? [...partial.scale] : [1, 1, 1]
  };
}
