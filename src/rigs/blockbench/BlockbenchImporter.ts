import type { BlockbenchModelAsset } from "../RigTypes";
import { BbmodelParser } from "./BbmodelParser";
import type { ParsedBlockbenchModel } from "./BlockbenchTypes";

export class BlockbenchImporter {
  static async fromFile(file: File): Promise<{
    asset: BlockbenchModelAsset;
    model: ParsedBlockbenchModel;
    rawObj: string;
  }> {
    const rawJson = await file.text();
    const model = BbmodelParser.parse(rawJson);
    const asset: BlockbenchModelAsset = {
      id: `bbmodel_${Date.now().toString(36)}`,
      name: model.name || file.name,
      formatVersion: model.formatVersion,
      elementCount: model.elements.length,
      groupCount: model.groups.length,
      textureCount: model.textures.length,
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
    let vertexOffset = 1;

    for (const [index, element] of model.elements.entries()) {
      const name = sanitizeName(element.name || `cube_${index + 1}`);
      const from = element.from.map((value) => value / 16);
      const to = element.to.map((value) => value / 16);
      const vertices = cubeVertices(from, to);
      lines.push(`g ${name}`);
      vertices.forEach((vertex) => lines.push(`v ${vertex.join(" ")}`));
      cubeFaces(vertexOffset).forEach((face) => lines.push(`f ${face.join(" ")}`));
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

function cubeFaces(offset: number) {
  return [
    [offset, offset + 1, offset + 2, offset + 3],
    [offset + 4, offset + 7, offset + 6, offset + 5],
    [offset, offset + 4, offset + 5, offset + 1],
    [offset + 1, offset + 5, offset + 6, offset + 2],
    [offset + 2, offset + 6, offset + 7, offset + 3],
    [offset + 3, offset + 7, offset + 4, offset]
  ];
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-z0-9_-]+/gi, "_");
}
