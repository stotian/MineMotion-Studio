import type { VfxParameterValue } from "./VfxParameter";

interface VfxParameterDefinitionBase {
  id: string;
  displayName: string;
  description?: string;
  category?: string;
  animatable: boolean;
}

export interface VfxNumberParameterDefinition
  extends VfxParameterDefinitionBase {
  kind: "number";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface VfxIntegerParameterDefinition
  extends VfxParameterDefinitionBase {
  kind: "integer";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface VfxBooleanParameterDefinition
  extends VfxParameterDefinitionBase {
  kind: "boolean";
  defaultValue: boolean;
}

export interface VfxColorParameterDefinition
  extends VfxParameterDefinitionBase {
  kind: "color";
  defaultValue: string;
}

export interface VfxEnumParameterDefinition
  extends VfxParameterDefinitionBase {
  kind: "enum";
  defaultValue: string;
  options: readonly string[];
}

export type VfxParameterDefinition =
  | VfxNumberParameterDefinition
  | VfxIntegerParameterDefinition
  | VfxBooleanParameterDefinition
  | VfxColorParameterDefinition
  | VfxEnumParameterDefinition;

export type VfxParameterSchema = readonly VfxParameterDefinition[];

export function getVfxParameterDefault(
  definition: VfxParameterDefinition
): VfxParameterValue {
  return definition.defaultValue;
}
