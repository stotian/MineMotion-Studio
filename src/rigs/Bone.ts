import type { Vector3Tuple } from "../project/ProjectFile";

export interface RigBone {
  id: string;
  label: string;
  parentId: string | null;
  size: Vector3Tuple;
  pivot: Vector3Tuple;
  offset: Vector3Tuple;
}

export const DEFAULT_STEVE_BONES: RigBone[] = [
  {
    id: "root",
    label: "Root",
    parentId: null,
    size: [0.2, 0.2, 0.2],
    pivot: [0, 0, 0],
    offset: [0, 0, 0]
  },
  {
    id: "body",
    label: "Body",
    parentId: "root",
    size: [0.8, 1.2, 0.35],
    pivot: [0, 0.6, 0],
    offset: [0, 1.2, 0]
  },
  {
    id: "head",
    label: "Head",
    parentId: "body",
    size: [0.75, 0.75, 0.75],
    pivot: [0, -0.35, 0],
    offset: [0, 0.95, 0]
  },
  {
    id: "leftArm",
    label: "Left Arm",
    parentId: "body",
    size: [0.3, 1.1, 0.3],
    pivot: [0, 0.45, 0],
    offset: [-0.62, 0.12, 0]
  },
  {
    id: "rightArm",
    label: "Right Arm",
    parentId: "body",
    size: [0.3, 1.1, 0.3],
    pivot: [0, 0.45, 0],
    offset: [0.62, 0.12, 0]
  },
  {
    id: "leftLeg",
    label: "Left Leg",
    parentId: "root",
    size: [0.34, 1.15, 0.34],
    pivot: [0, 0.5, 0],
    offset: [-0.21, 0.05, 0]
  },
  {
    id: "rightLeg",
    label: "Right Leg",
    parentId: "root",
    size: [0.34, 1.15, 0.34],
    pivot: [0, 0.5, 0],
    offset: [0.21, 0.05, 0]
  }
];

