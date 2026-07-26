export interface BlockbenchElement {
  uuid?: string;
  type?: string;
  name?: string;
  from: [number, number, number];
  to: [number, number, number];
  origin?: [number, number, number];
  rotation?: [number, number, number] | {
    angle?: number;
    axis?: "x" | "y" | "z";
    origin?: [number, number, number];
  };
  inflate?: number;
  faces?: Record<string, unknown>;
}

export interface BlockbenchGroup {
  uuid?: string;
  name?: string;
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

export interface BlockbenchAnimation {
  uuid?: string;
  name?: string;
  loop?: string | boolean;
  length?: number;
  snapping?: number;
  animators?: Record<string, unknown>;
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
  outliner?: Array<string | BlockbenchGroup>;
  textures?: BlockbenchTexture[];
  animations?: BlockbenchAnimation[];
  resolution?: {
    width?: number;
    height?: number;
  };
}

export interface BlockbenchImportReport {
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  rotatedElementCount: number;
  rotatedGroupCount: number;
  animationNames: string[];
}

export interface ParsedBlockbenchModel {
  name: string;
  formatVersion: string;
  modelFormat: string;
  elements: BlockbenchElement[];
  groups: BlockbenchGroup[];
  textures: BlockbenchTexture[];
  animations: BlockbenchAnimation[];
  report: BlockbenchImportReport;
  warnings: string[];
}
