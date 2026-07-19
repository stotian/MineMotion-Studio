import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import {
  MAX_VFX_PARAMETER_ID_LENGTH,
  MAX_VFX_PARAMETER_STRING_LENGTH,
  isSafeVfxColor,
  isVfxParameterValue,
  type VfxParameterValue
} from "../core/VfxParameter";
import type {
  VfxParameterDefinition,
  VfxParameterSchema
} from "../core/VfxParameterSchema";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_SCHEMA_PARAMETERS = 64;
const MAX_LEGACY_PARAMETERS = 256;
const MAX_TEXT_LENGTH = 512;
const MAX_DESCRIPTION_LENGTH = 2_048;
const MAX_ENUM_OPTIONS = 64;

export type VfxParameterRuntimeSupport =
  | "live-preview"
  | "export-only"
  | "stored-only";

export type VfxParameterControlSource =
  | "instance"
  | "default"
  | "invalid-legacy";

interface VfxParameterControlBase {
  id: string;
  displayName: string;
  description?: string;
  category: string;
  animatable: boolean;
  animationAvailable: false;
  runtimeSupport: VfxParameterRuntimeSupport;
  source: VfxParameterControlSource;
  validationMessage?: string;
}

export interface VfxNumberControl extends VfxParameterControlBase {
  kind: "number" | "integer";
  value: number;
  storedValue?: VfxParameterValue;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface VfxBooleanControl extends VfxParameterControlBase {
  kind: "boolean";
  value: boolean;
  storedValue?: VfxParameterValue;
  defaultValue: boolean;
}

export interface VfxColorControl extends VfxParameterControlBase {
  kind: "color";
  value: string;
  storedValue?: VfxParameterValue;
  defaultValue: string;
}

export interface VfxEnumControl extends VfxParameterControlBase {
  kind: "enum";
  value: string;
  storedValue?: VfxParameterValue;
  defaultValue: string;
  options: readonly string[];
}

export type VfxParameterControl =
  | VfxNumberControl
  | VfxBooleanControl
  | VfxColorControl
  | VfxEnumControl;

export interface VfxUnknownParameter {
  id: string;
  value: VfxParameterValue;
}

export interface VfxParameterControlModel {
  controls: readonly VfxParameterControl[];
  unknownParameters: readonly VfxUnknownParameter[];
}

export interface VfxParameterControlModelOptions {
  runtimeSupportById?: Readonly<Record<string, VfxParameterRuntimeSupport>>;
}

type PlainRecord = Record<string, unknown>;

function issue(
  code: string,
  message: string,
  path: string,
  severity: ValidationIssue["severity"] = "error"
): ValidationIssue {
  return { code, message, path, severity };
}

function snapshotPlainRecord(value: unknown): PlainRecord | null {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const entries: Array<[string, unknown]> = [];
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key === "symbol") return null;
      const descriptor = descriptors[key];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return null;
      }
      entries.push([key, descriptor.value]);
    }
    return Object.fromEntries(entries);
  } catch {
    return null;
  }
}

function snapshotDensePlainArray(value: unknown): unknown[] | null {
  try {
    if (!Array.isArray(value)) return null;
    if (Object.getPrototypeOf(value) !== Array.prototype) return null;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length = lengthDescriptor?.value;
    if (!Number.isSafeInteger(length) || length < 0) return null;
    const snapshot: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return null;
      }
      snapshot.push(descriptor.value);
    }
    return snapshot;
  } catch {
    return null;
  }
}

function isIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_VFX_PARAMETER_ID_LENGTH &&
    IDENTIFIER_PATTERN.test(value)
  );
}

function readRequiredText(
  value: unknown,
  path: string,
  errors: ValidationIssue[],
  maxLength = MAX_TEXT_LENGTH
): string | null {
  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    value.length > maxLength
  ) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_TEXT_INVALID",
        "Parameter text must be a bounded non-empty string.",
        path
      )
    );
    return null;
  }
  return value;
}

function readOptionalText(
  value: unknown,
  path: string,
  errors: ValidationIssue[],
  maxLength = MAX_TEXT_LENGTH
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_TEXT_INVALID",
        "Optional parameter text must be a bounded string.",
        path
      )
    );
    return undefined;
  }
  return value;
}

function readOptionalFiniteNumber(
  value: unknown,
  path: string,
  errors: ValidationIssue[],
  requireInteger = false
): number | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (requireInteger && !Number.isSafeInteger(value))
  ) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_NUMBER_INVALID",
        requireInteger
          ? "Integer parameter metadata must be a safe integer."
          : "Numeric parameter metadata must be finite.",
        path
      )
    );
    return undefined;
  }
  return Object.is(value, -0) ? 0 : value;
}

function sanitizeSchemaEntry(
  value: unknown,
  index: number,
  errors: ValidationIssue[]
): VfxParameterDefinition | null {
  const path = `parameterSchema.${index}`;
  const record = snapshotPlainRecord(value);
  if (!record) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_SCHEMA_INVALID",
        "Parameter schema entries must be plain data objects.",
        path
      )
    );
    return null;
  }

  const id = record.id;
  if (!isIdentifier(id)) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_ID_INVALID",
        "Parameter IDs must be bounded identifiers.",
        `${path}.id`
      )
    );
    return null;
  }
  const displayName = readRequiredText(
    record.displayName,
    `${path}.displayName`,
    errors
  );
  const description = readOptionalText(
    record.description,
    `${path}.description`,
    errors,
    MAX_DESCRIPTION_LENGTH
  );
  const category = readOptionalText(record.category, `${path}.category`, errors);
  if (typeof record.animatable !== "boolean") {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_ANIMATABLE_INVALID",
        "Parameter animatable must be a boolean.",
        `${path}.animatable`
      )
    );
  }
  if (!displayName || typeof record.animatable !== "boolean") return null;

  const base = {
    id,
    displayName,
    ...(description === undefined ? {} : { description }),
    ...(category === undefined ? {} : { category }),
    animatable: record.animatable
  };
  if (record.kind === "number" || record.kind === "integer") {
    const integer = record.kind === "integer";
    const defaultValue = readOptionalFiniteNumber(
      record.defaultValue,
      `${path}.defaultValue`,
      errors,
      integer
    );
    const min = readOptionalFiniteNumber(record.min, `${path}.min`, errors, integer);
    const max = readOptionalFiniteNumber(record.max, `${path}.max`, errors, integer);
    const step = readOptionalFiniteNumber(record.step, `${path}.step`, errors, integer);
    const unit = readOptionalText(record.unit, `${path}.unit`, errors);
    if (defaultValue === undefined) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_DEFAULT_INVALID",
          "Numeric parameters require a finite default value.",
          `${path}.defaultValue`
        )
      );
      return null;
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_RANGE_INVALID",
          "Parameter minimum cannot exceed its maximum.",
          path
        )
      );
    }
    if (
      (min !== undefined && defaultValue < min) ||
      (max !== undefined && defaultValue > max)
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_DEFAULT_INVALID",
          "Parameter default must stay inside its declared range.",
          `${path}.defaultValue`
        )
      );
    }
    if (step !== undefined && step <= 0) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_STEP_INVALID",
          "Parameter step must be positive.",
          `${path}.step`
        )
      );
    }
    if (errors.some((error) => error.path?.startsWith(path))) return null;
    return {
      ...base,
      kind: record.kind,
      defaultValue,
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(step === undefined ? {} : { step }),
      ...(unit === undefined ? {} : { unit })
    };
  }

  if (record.kind === "boolean") {
    if (typeof record.defaultValue !== "boolean") {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_DEFAULT_INVALID",
          "Boolean parameters require a boolean default value.",
          `${path}.defaultValue`
        )
      );
      return null;
    }
    return { ...base, kind: "boolean", defaultValue: record.defaultValue };
  }

  if (record.kind === "color") {
    const defaultValue = readRequiredText(
      record.defaultValue,
      `${path}.defaultValue`,
      errors,
      MAX_VFX_PARAMETER_STRING_LENGTH
    );
    if (!defaultValue) return null;
    if (!isSafeVfxColor(defaultValue)) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_DEFAULT_INVALID",
          "Color defaults must be safe hex or named colors.",
          `${path}.defaultValue`
        )
      );
      return null;
    }
    return { ...base, kind: "color", defaultValue };
  }

  if (record.kind === "enum") {
    const defaultValue = readRequiredText(
      record.defaultValue,
      `${path}.defaultValue`,
      errors,
      MAX_VFX_PARAMETER_STRING_LENGTH
    );
    if (!Array.isArray(record.options) || record.options.length === 0) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
          "Enum parameter options must be a non-empty dense array.",
          `${path}.options`
        )
      );
      return null;
    }
    if (record.options.length > MAX_ENUM_OPTIONS) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
          `Enum parameters cannot exceed ${MAX_ENUM_OPTIONS} options.`,
          `${path}.options`
        )
      );
      return null;
    }
    const optionValues = snapshotDensePlainArray(record.options);
    if (!optionValues) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
          "Enum parameter options must be a dense plain array.",
          `${path}.options`
        )
      );
      return null;
    }
    const options = optionValues.map((option, optionIndex) =>
      readRequiredText(
        option,
        `${path}.options.${optionIndex}`,
        errors,
        MAX_VFX_PARAMETER_STRING_LENGTH
      )
    );
    if (
      !defaultValue ||
      options.some((option) => option === null) ||
      new Set(options).size !== options.length ||
      !options.includes(defaultValue)
    ) {
      if (new Set(options).size !== options.length) {
        errors.push(
          issue(
            "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
            "Enum parameter options must be unique.",
            `${path}.options`
          )
        );
      }
      if (defaultValue && !options.includes(defaultValue)) {
        errors.push(
          issue(
            "VFX_PARAMETER_CONTROL_DEFAULT_INVALID",
            "Enum default must be one of its options.",
            `${path}.defaultValue`
          )
        );
      }
      return null;
    }
    return {
      ...base,
      kind: "enum",
      defaultValue,
      options: options as string[]
    };
  }

  errors.push(
    issue(
      "VFX_PARAMETER_CONTROL_KIND_UNSUPPORTED",
      "Parameter kind is not supported by the current Inspector.",
      `${path}.kind`
    )
  );
  return null;
}

function sanitizeSchema(
  value: unknown
): ValidationResult<VfxParameterSchema> {
  const errors: ValidationIssue[] = [];
  if (!Array.isArray(value)) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_SCHEMA_INVALID",
        "Parameter schema must be a dense plain array.",
        "parameterSchema"
      )
    ]);
  }
  if (value.length > MAX_SCHEMA_PARAMETERS) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_SCHEMA_INVALID",
        `Parameter schema cannot exceed ${MAX_SCHEMA_PARAMETERS} controls.`,
        "parameterSchema"
      )
    ]);
  }
  const schemaEntries = snapshotDensePlainArray(value);
  if (!schemaEntries) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_SCHEMA_INVALID",
        "Parameter schema must be a dense plain array.",
        "parameterSchema"
      )
    ]);
  }
  const entries = schemaEntries.map((entry, index) =>
    sanitizeSchemaEntry(entry, index, errors)
  );
  const identifiers = entries
    .filter((entry): entry is VfxParameterDefinition => entry !== null)
    .map((entry) => entry.id);
  if (new Set(identifiers).size !== identifiers.length) {
    errors.push(
      issue(
        "VFX_PARAMETER_CONTROL_ID_DUPLICATE",
        "Parameter schema IDs must be unique.",
        "parameterSchema"
      )
    );
  }
  if (errors.length > 0 || entries.some((entry) => entry === null)) {
    return invalidResult(errors.length > 0 ? errors : [
      issue(
        "VFX_PARAMETER_CONTROL_SCHEMA_INVALID",
        "Parameter schema contains an invalid entry.",
        "parameterSchema"
      )
    ]);
  }
  return validResult(entries as VfxParameterSchema);
}

function sanitizeParameters(
  value: unknown
): ValidationResult<Record<string, VfxParameterValue>> {
  const record = snapshotPlainRecord(value);
  if (!record) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_VALUES_INVALID",
        "Effect parameters must be a plain data object.",
        "parameters"
      )
    ]);
  }
  const entries = Object.entries(record);
  if (entries.length > MAX_LEGACY_PARAMETERS) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_VALUES_INVALID",
        `Effect parameters cannot exceed ${MAX_LEGACY_PARAMETERS} entries in the Inspector.`,
        "parameters"
      )
    ]);
  }
  const errors: ValidationIssue[] = [];
  const sanitizedEntries: Array<[string, VfxParameterValue]> = [];
  for (const [id, parameter] of entries) {
    if (id.length > MAX_TEXT_LENGTH || !isVfxParameterValue(parameter)) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_VALUES_INVALID",
          "Effect parameters must have bounded keys and finite primitive values.",
          `parameters.${id}`
        )
      );
      continue;
    }
    if (
      typeof parameter === "string" &&
      parameter.length > MAX_VFX_PARAMETER_STRING_LENGTH
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_VALUES_INVALID",
          "String parameter values are too long for the Inspector.",
          `parameters.${id}`
        )
      );
      continue;
    }
    sanitizedEntries.push([
      id,
      Object.is(parameter, -0) ? 0 : parameter
    ]);
  }
  return errors.length > 0
    ? invalidResult(errors)
    : validResult(Object.fromEntries(sanitizedEntries));
}

function valueError(
  definition: VfxParameterDefinition,
  value: unknown,
  path: string
): ValidationIssue | null {
  if (!isVfxParameterValue(value)) {
    return issue(
      "VFX_PARAMETER_CONTROL_VALUE_INVALID",
      "Parameter values must be finite primitive values.",
      path
    );
  }
  if (definition.kind === "number" || definition.kind === "integer") {
    if (typeof value !== "number") {
      return issue("VFX_PARAMETER_CONTROL_TYPE_INVALID", "Expected a number.", path);
    }
    if (definition.kind === "integer" && !Number.isSafeInteger(value)) {
      return issue("VFX_PARAMETER_CONTROL_INTEGER_INVALID", "Expected a safe integer.", path);
    }
    if (definition.min !== undefined && value < definition.min) {
      return issue(
        "VFX_PARAMETER_CONTROL_RANGE_INVALID",
        `Value must be at least ${definition.min}.`,
        path
      );
    }
    if (definition.max !== undefined && value > definition.max) {
      return issue(
        "VFX_PARAMETER_CONTROL_RANGE_INVALID",
        `Value must be at most ${definition.max}.`,
        path
      );
    }
    return null;
  }
  if (definition.kind === "boolean") {
    return typeof value === "boolean"
      ? null
      : issue("VFX_PARAMETER_CONTROL_TYPE_INVALID", "Expected a boolean.", path);
  }
  if (definition.kind === "color") {
    return isSafeVfxColor(value)
      ? null
      : issue(
          "VFX_PARAMETER_CONTROL_COLOR_INVALID",
          "Expected a safe hex or named color.",
          path
        );
  }
  return typeof value === "string" && definition.options.includes(value)
    ? null
    : issue(
        "VFX_PARAMETER_CONTROL_ENUM_INVALID",
        "Expected one of the declared enum options.",
        path
      );
}

function runtimeSupportFor(
  id: string,
  runtimeSupportById: Readonly<Record<string, VfxParameterRuntimeSupport>>
): VfxParameterRuntimeSupport {
  const support = runtimeSupportById[id];
  return support === "live-preview" ||
    support === "export-only" ||
    support === "stored-only"
    ? support
    : "stored-only";
}

function sanitizeRuntimeSupportOptions(
  value: unknown
): ValidationResult<Readonly<Record<string, VfxParameterRuntimeSupport>>> {
  const options = snapshotPlainRecord(value);
  if (!options) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
        "Parameter control options must be a plain data object.",
        "options"
      )
    ]);
  }
  if (options.runtimeSupportById === undefined) return validResult({});
  const supportRecord = snapshotPlainRecord(options.runtimeSupportById);
  if (!supportRecord) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
        "Runtime support metadata must be a plain data object.",
        "options.runtimeSupportById"
      )
    ]);
  }
  const entries = Object.entries(supportRecord);
  if (entries.length > MAX_SCHEMA_PARAMETERS) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
        `Runtime support metadata cannot exceed ${MAX_SCHEMA_PARAMETERS} entries.`,
        "options.runtimeSupportById"
      )
    ]);
  }
  const errors: ValidationIssue[] = [];
  const sanitizedEntries: Array<[string, VfxParameterRuntimeSupport]> = [];
  for (const [id, support] of entries) {
    if (!isIdentifier(id)) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
          "Runtime support keys must be bounded parameter identifiers.",
          `options.runtimeSupportById.${id}`
        )
      );
      continue;
    }
    if (
      support !== "live-preview" &&
      support !== "export-only" &&
      support !== "stored-only"
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_CONTROL_OPTIONS_INVALID",
          "Runtime support metadata is invalid.",
          `options.runtimeSupportById.${id}`
        )
      );
      continue;
    }
    sanitizedEntries.push([id, support]);
  }
  return errors.length > 0
    ? invalidResult(errors)
    : validResult(Object.fromEntries(sanitizedEntries));
}

function controlFor(
  definition: VfxParameterDefinition,
  parameters: Record<string, VfxParameterValue>,
  runtimeSupportById: Readonly<Record<string, VfxParameterRuntimeSupport>>,
  warnings: ValidationIssue[]
): VfxParameterControl {
  const hasStoredValue = Object.hasOwn(parameters, definition.id);
  const storedValue = hasStoredValue ? parameters[definition.id] : undefined;
  const validation = hasStoredValue
    ? valueError(definition, storedValue, `parameters.${definition.id}`)
    : null;
  const source: VfxParameterControlSource = validation
    ? "invalid-legacy"
    : hasStoredValue
      ? "instance"
      : "default";
  if (validation) {
    warnings.push({ ...validation, severity: "warning" });
  }
  const base = {
    id: definition.id,
    displayName: definition.displayName,
    ...(definition.description === undefined
      ? {}
      : { description: definition.description }),
    category: definition.category ?? "General",
    animatable: definition.animatable,
    animationAvailable: false as const,
    runtimeSupport: runtimeSupportFor(definition.id, runtimeSupportById),
    source,
    ...(validation === null ? {} : { validationMessage: validation.message }),
    ...(validation === null || storedValue === undefined
      ? {}
      : { storedValue })
  };

  if (definition.kind === "number" || definition.kind === "integer") {
    const value =
      typeof storedValue === "number" ? storedValue : definition.defaultValue;
    return {
      ...base,
      kind: definition.kind,
      value,
      defaultValue: definition.defaultValue,
      ...(definition.min === undefined ? {} : { min: definition.min }),
      ...(definition.max === undefined ? {} : { max: definition.max }),
      ...(definition.step === undefined ? {} : { step: definition.step }),
      ...(definition.unit === undefined ? {} : { unit: definition.unit })
    };
  }
  if (definition.kind === "boolean") {
    return {
      ...base,
      kind: "boolean",
      value:
        typeof storedValue === "boolean" ? storedValue : definition.defaultValue,
      defaultValue: definition.defaultValue
    };
  }
  if (definition.kind === "color") {
    return {
      ...base,
      kind: "color",
      value: typeof storedValue === "string" ? storedValue : definition.defaultValue,
      defaultValue: definition.defaultValue
    };
  }
  return {
    ...base,
    kind: "enum",
    value: typeof storedValue === "string" ? storedValue : definition.defaultValue,
    defaultValue: definition.defaultValue,
    options: [...definition.options]
  };
}

export function buildVfxParameterControlModel(
  schema: unknown,
  parameters: unknown,
  options: VfxParameterControlModelOptions = {}
): ValidationResult<VfxParameterControlModel> {
  try {
    const schemaResult = sanitizeSchema(schema);
    if (!schemaResult.ok) return schemaResult;
    const parametersResult = sanitizeParameters(parameters);
    if (!parametersResult.ok) return parametersResult;
    const optionsResult = sanitizeRuntimeSupportOptions(options);
    if (!optionsResult.ok) return optionsResult;

    const warnings: ValidationIssue[] = [];
    const controls = schemaResult.value.map((definition) =>
      controlFor(
        definition,
        parametersResult.value,
        optionsResult.value,
        warnings
      )
    );
    const knownIds = new Set(
      schemaResult.value.map((definition) => definition.id)
    );
    const unknownParameters = Object.entries(parametersResult.value)
      .filter(([id]) => !knownIds.has(id))
      .map(([id, value]) => ({ id, value }))
      .sort((left, right) => left.id.localeCompare(right.id));

    for (const parameter of unknownParameters) {
      warnings.push(
        issue(
          "VFX_PARAMETER_CONTROL_UNKNOWN_PRESERVED",
          `Legacy parameter ${parameter.id} is preserved without a generated control.`,
          `parameters.${parameter.id}`,
          "warning"
        )
      );
    }
    return validResult({ controls, unknownParameters }, warnings);
  } catch (error) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_INPUT_INVALID",
        error instanceof Error
          ? error.message
          : "Parameter control input could not be inspected safely.",
        "parameterSchema"
      )
    ]);
  }
}

function sanitizedDefinitionFromControl(
  control: unknown
): ValidationResult<VfxParameterDefinition> {
  const schemaResult = sanitizeSchema([control]);
  if (!schemaResult.ok) return schemaResult;
  const definition = schemaResult.value[0];
  return definition
    ? validResult(definition, schemaResult.warnings)
    : invalidResult([
        issue(
          "VFX_PARAMETER_CONTROL_INPUT_INVALID",
          "Parameter control is missing a schema definition.",
          "control"
        )
      ]);
}

function parseDraftForDefinition(
  definition: VfxParameterDefinition,
  draft: unknown
): ValidationResult<VfxParameterValue> {
  if (
    typeof draft === "string" &&
    draft.length > MAX_VFX_PARAMETER_STRING_LENGTH
  ) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_VALUE_INVALID",
        `Parameter text cannot exceed ${MAX_VFX_PARAMETER_STRING_LENGTH} characters.`,
        `parameters.${definition.id}`
      )
    ]);
  }
  let value: unknown = draft;
  if (definition.kind === "number" || definition.kind === "integer") {
    if (typeof draft === "string") {
      if (draft.trim() === "") {
        return invalidResult([
          issue(
            "VFX_PARAMETER_CONTROL_VALUE_INVALID",
            "A numeric parameter cannot be blank.",
            `parameters.${definition.id}`
          )
        ]);
      }
      value = Number(draft);
    }
  }
  const validation = valueError(
    definition,
    value,
    `parameters.${definition.id}`
  );
  return validation
    ? invalidResult([validation])
    : validResult(value as VfxParameterValue);
}

export function parseVfxParameterControlDraft(
  control: VfxParameterControl,
  draft: unknown
): ValidationResult<VfxParameterValue> {
  try {
    const definitionResult = sanitizedDefinitionFromControl(control);
    if (!definitionResult.ok) return definitionResult;
    return parseDraftForDefinition(definitionResult.value, draft);
  } catch (error) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_INPUT_INVALID",
        error instanceof Error
          ? error.message
          : "Parameter control could not be inspected safely.",
        "control"
      )
    ]);
  }
}

export function createVfxParameterPatch(
  control: VfxParameterControl,
  value: unknown
): ValidationResult<Record<string, VfxParameterValue>> {
  try {
    const definitionResult = sanitizedDefinitionFromControl(control);
    if (!definitionResult.ok) return definitionResult;
    const parsed = parseDraftForDefinition(definitionResult.value, value);
    if (!parsed.ok) return parsed;
    return validResult(
      Object.fromEntries([[definitionResult.value.id, parsed.value]])
    );
  } catch (error) {
    return invalidResult([
      issue(
        "VFX_PARAMETER_CONTROL_INPUT_INVALID",
        error instanceof Error
          ? error.message
          : "Parameter control could not be inspected safely.",
        "control"
      )
    ]);
  }
}
