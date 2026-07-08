export interface ObjImportResult {
  name: string;
  rawObj: string;
  warnings: string[];
}

export class ObjImporter {
  static async fromFile(file: File): Promise<ObjImportResult> {
    const rawObj = await file.text();
    const warnings: string[] = [];

    if (!rawObj.includes("\nv ") && !rawObj.startsWith("v ")) {
      warnings.push("OBJ file does not appear to contain vertices.");
    }

    if (rawObj.includes("mtllib")) {
      warnings.push(
        "MTL references are detected but Phase 1 uses a neutral material."
      );
    }

    return {
      name: file.name.replace(/\.obj$/i, ""),
      rawObj,
      warnings
    };
  }
}

