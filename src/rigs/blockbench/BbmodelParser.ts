import type {
  BlockbenchElement,
  BlockbenchModelJson,
  ParsedBlockbenchModel
} from "./BlockbenchTypes";

export class BbmodelParser {
  static parse(raw: string): ParsedBlockbenchModel {
    let parsed: BlockbenchModelJson;
    try {
      parsed = JSON.parse(raw) as BlockbenchModelJson;
    } catch {
      throw new Error("Blockbench .bbmodel file is not valid JSON.");
    }

    return BbmodelParser.fromJson(parsed);
  }

  static fromJson(parsed: BlockbenchModelJson): ParsedBlockbenchModel {
    const warnings: string[] = [];
    const elements = Array.isArray(parsed.elements)
      ? parsed.elements.filter(isElement)
      : [];
    if (!Array.isArray(parsed.elements)) {
      warnings.push("No elements array found; imported model will be empty.");
    }
    if (parsed.elements && elements.length !== parsed.elements.length) {
      warnings.push("Some Blockbench elements were skipped because they had invalid from/to vectors.");
    }

    return {
      name: parsed.name || "Blockbench Model",
      formatVersion: parsed.meta?.format_version || "unknown",
      modelFormat: parsed.meta?.model_format || "unknown",
      elements,
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      textures: Array.isArray(parsed.textures) ? parsed.textures : [],
      warnings
    };
  }
}

function isElement(element: BlockbenchElement): element is BlockbenchElement {
  return isVector(element?.from) && isVector(element?.to);
}

function isVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}
