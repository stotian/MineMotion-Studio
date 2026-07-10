export interface BlockbenchElement {
  name?: string;
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    angle?: number;
    axis?: "x" | "y" | "z";
    origin?: [number, number, number];
  };
  faces?: Record<string, unknown>;
}

export interface BlockbenchGroup {
  name: string;
  origin?: [number, number, number];
  rotation?: [number, number, number];
  children?: Array<string | BlockbenchGroup>;
}

export interface BlockbenchTexture {
  id?: string;
  name?: string;
  source?: string;
  relative_path?: string;
}

export interface BlockbenchModelJson {
  meta?: {
    format_version?: string;
    model_format?: string;
    box_uv?: boolean;
  };
  name?: string;
  elements?: BlockbenchElement[];
  groups?: BlockbenchGroup[];
  textures?: BlockbenchTexture[];
}

export interface ParsedBlockbenchModel {
  name: string;
  formatVersion: string;
  modelFormat: string;
  elements: BlockbenchElement[];
  groups: BlockbenchGroup[];
  textures: BlockbenchTexture[];
  warnings: string[];
}
