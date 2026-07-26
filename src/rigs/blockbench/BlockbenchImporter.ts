import type { BlockbenchModelAsset } from "../RigTypes";
import { createDeterministicId } from "../../core/ids/Id";
import { BbmodelParser } from "./BbmodelParser";
import type {
  BlockbenchElement,
  BlockbenchGroup,
  ParsedBlockbenchModel
} from "./BlockbenchTypes";
import * as THREE from "three";

export class BlockbenchImporter {
  static async fromFile(file: File): Promise<{
    asset: BlockbenchModelAsset;
    model: ParsedBlockbenchModel;
    rawObj: string;
  }> {
    const rawJson = await file.text();
    const model = BbmodelParser.parse(rawJson);
    const asset: BlockbenchModelAsset = {
      id: createDeterministicId(
        "bbmodel",
        `${model.name}:${rawJson}`
      ),
      name: model.name || file.name,
      formatVersion: model.formatVersion,
      elementCount: model.elements.length,
      groupCount: countGroups(model.groups),
      textureCount: model.textures.length,
      animationCount: model.animations.length,
      animationNames: model.report.animationNames,
      modelFormat: model.modelFormat,
      supportedFeatures: model.report.supportedFeatures,
      unsupportedFeatures: model.report.unsupportedFeatures,
      importedAt: new Date().toISOString(),
      warnings: model.warnings,
      rawJson
    };

    return {
      asset,
      model,
      rawObj: BlockbenchImporter.toObj(model)
    };
  }

  static toObj(model: ParsedBlockbenchModel): string {
    const lines = [`o ${sanitizeName(model.name)}`];
    const groupBindings = collectGroupBindings(model.groups);
    let vertexOffset = 1;

    for (const [index, element] of model.elements.entries()) {
      const binding = element.uuid
        ? groupBindings.get(element.uuid)
        : undefined;
      const name = sanitizeName([
        ...(binding?.names ?? []),
        element.name || `cube_${index + 1}`
      ].join("_"));
      const inflate = element.inflate ?? 0;
      const from = element.from.map((value) => (value - inflate) / 16);
      const to = element.to.map((value) => (value + inflate) / 16);
      const vertices = cubeVertices(from, to).map((vertex) =>
        transformVertex(vertex, element, binding?.groups ?? [])
      );
      lines.push(`g ${name}`);
      vertices.forEach((vertex) =>
        lines.push(`v ${vertex.map(formatNumber).join(" ")}`)
      );
      cubeFaces(vertexOffset, element.faces).forEach((face) =>
        lines.push(`f ${face.join(" ")}`)
      );
      vertexOffset += vertices.length;
    }

    return `${lines.join("\n")}\n`;
  }
}

function cubeVertices(from: number[], to: number[]) {
  const [x1, y1, z1] = from;
  const [x2, y2, z2] = to;
  return [
    [x1, y1, z1],
    [x2, y1, z1],
    [x2, y2, z1],
    [x1, y2, z1],
    [x1, y1, z2],
    [x2, y1, z2],
    [x2, y2, z2],
    [x1, y2, z2]
  ];
}

function cubeFaces(
  offset: number,
  faces: BlockbenchElement["faces"]
) {
  const definitions = {
    north: [offset, offset + 1, offset + 2, offset + 3],
    south: [offset + 4, offset + 7, offset + 6, offset + 5],
    down: [offset, offset + 4, offset + 5, offset + 1],
    east: [offset + 1, offset + 5, offset + 6, offset + 2],
    up: [offset + 2, offset + 6, offset + 7, offset + 3],
    west: [offset + 3, offset + 7, offset + 4, offset]
  };
  const enabled = Object.keys(faces ?? {}).filter(
    (face): face is keyof typeof definitions => face in definitions
  );
  return enabled.length > 0
    ? enabled.map((face) => definitions[face])
    : Object.values(definitions);
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-z0-9_-]+/gi, "_");
}

interface GroupBinding {
  groups: BlockbenchGroup[];
  names: string[];
}

function collectGroupBindings(
  groups: readonly BlockbenchGroup[]
): Map<string, GroupBinding> {
  const bindings = new Map<string, GroupBinding>();
  const visit = (
    group: BlockbenchGroup,
    ancestors: BlockbenchGroup[],
    names: string[]
  ) => {
    const path = [...ancestors, group];
    const pathNames = [...names, group.name ?? "group"];
    for (const child of group.children ?? []) {
      if (typeof child === "string") {
        bindings.set(child, { groups: path, names: pathNames });
      } else {
        visit(child, path, pathNames);
      }
    }
  };
  groups.forEach((group) => visit(group, [], []));
  return bindings;
}

function transformVertex(
  vertex: number[],
  element: BlockbenchElement,
  groups: readonly BlockbenchGroup[]
): number[] {
  const point = new THREE.Vector3(vertex[0], vertex[1], vertex[2]);
  const elementRotation = elementRotationVector(element);
  if (elementRotation.some((value) => value !== 0)) {
    rotateAround(
      point,
      elementRotation,
      elementRotationOrigin(element)
    );
  }
  for (const group of [...groups].reverse()) {
    if (!group.rotation?.some((value) => value !== 0)) continue;
    rotateAround(point, group.rotation, group.origin ?? [0, 0, 0]);
  }
  return [point.x, point.y, point.z];
}

function elementRotationVector(
  element: BlockbenchElement
): [number, number, number] {
  if (Array.isArray(element.rotation)) return element.rotation;
  if (!element.rotation?.angle || !element.rotation.axis) return [0, 0, 0];
  const rotation: [number, number, number] = [0, 0, 0];
  rotation[{ x: 0, y: 1, z: 2 }[element.rotation.axis]] =
    element.rotation.angle;
  return rotation;
}

function elementRotationOrigin(
  element: BlockbenchElement
): [number, number, number] {
  if (Array.isArray(element.rotation)) {
    return element.origin ?? [0, 0, 0];
  }
  return element.rotation?.origin ?? element.origin ?? [0, 0, 0];
}

function rotateAround(
  point: THREE.Vector3,
  rotation: [number, number, number],
  origin: [number, number, number]
): void {
  const pivot = new THREE.Vector3(
    origin[0] / 16,
    origin[1] / 16,
    origin[2] / 16
  );
  point
    .sub(pivot)
    .applyEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2]),
      "ZYX"
    ))
    .add(pivot);
}

function formatNumber(value: number): string {
  const normalized = Math.abs(value) < 1e-12 ? 0 : value;
  return Number(normalized.toFixed(9)).toString();
}

function countGroups(groups: readonly BlockbenchGroup[]): number {
  return groups.reduce((total, group) =>
    total +
    1 +
    countGroups(
      (group.children ?? []).filter(
        (child): child is BlockbenchGroup => typeof child !== "string"
      )
    ), 0);
}
