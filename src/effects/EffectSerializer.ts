import { effectRegistry } from "./EffectRegistry";
import type {
  EffectInstance,
  EffectParameters,
  EffectType
} from "./EffectTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_ID_LENGTH = 128;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Reflect.ownKeys(descriptors).every((key) => {
      if (typeof key === "symbol") return false;
      const descriptor = descriptors[key];
      return Boolean(
        descriptor && "value" in descriptor && descriptor.enumerable
      );
    });
  } catch {
    return false;
  }
}

function normalizeNumber(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function sanitizeFrame(
  value: unknown,
  fallback: number,
  minimum: number,
  path: string
): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number.`);
  }
  const rounded = Math.round(value);
  if (!Number.isSafeInteger(rounded)) {
    throw new Error(`${path} must round to a safe integer.`);
  }
  return normalizeNumber(Math.max(minimum, rounded));
}

function sanitizePosition(
  value: unknown,
  path: string
): [number, number, number] {
  if (value === undefined) return [0, 2, 0];
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${path} must be a plain vector3 tuple.`);
  }
  const values = [0, 1, 2].map((index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      value.length !== 3 ||
      !descriptor ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "number" ||
      !Number.isFinite(descriptor.value)
    ) {
      throw new Error(`${path} must contain three finite numbers.`);
    }
    return normalizeNumber(descriptor.value);
  });
  return [values[0], values[1], values[2]];
}

function sanitizeParameters(value: unknown, path: string): EffectParameters {
  if (value === undefined) return {};
  if (!isPlainRecord(value)) {
    throw new Error(`${path} must be a plain object.`);
  }
  const parameters: Record<string, string | number | boolean> = {};
  for (const [key, parameter] of Object.entries(value)) {
    if (
      typeof parameter !== "string" &&
      typeof parameter !== "boolean" &&
      !(typeof parameter === "number" && Number.isFinite(parameter))
    ) {
      throw new Error(`${path}.${key} must be a finite primitive value.`);
    }
    parameters[key] =
      typeof parameter === "number" ? normalizeNumber(parameter) : parameter;
  }
  return parameters as EffectParameters;
}

export function withEffectDefaults(
  value: unknown,
  fallbackId = "effect_legacy"
): EffectInstance {
  if (!isPlainRecord(value)) {
    throw new Error("Effect data must be a plain object.");
  }

  const id = value.id === undefined ? fallbackId : value.id;
  if (
    typeof id !== "string" ||
    id.length > MAX_ID_LENGTH ||
    !IDENTIFIER_PATTERN.test(id)
  ) {
    throw new Error("Effect ID is invalid.");
  }

  const type = (value.type ?? "flash") as EffectType;
  if (typeof type !== "string" || !effectRegistry.get(type)) {
    throw new Error(`Effect type is not registered: ${String(type)}.`);
  }

  const name = value.name === undefined ? "Effect" : value.name;
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Effect name must be a non-empty string.");
  }

  const startFrame = sanitizeFrame(value.startFrame, 0, 0, "startFrame");
  const durationFrames = sanitizeFrame(
    value.durationFrames,
    12,
    1,
    "durationFrames"
  );
  if (!Number.isSafeInteger(startFrame + durationFrames)) {
    throw new Error("Effect inclusive frame range must be a safe integer.");
  }

  const targetObjectId = value.targetObjectId ?? "";
  if (typeof targetObjectId !== "string") {
    throw new Error("Effect targetObjectId must be a string.");
  }
  const enabled = value.enabled ?? true;
  if (typeof enabled !== "boolean") {
    throw new Error("Effect enabled state must be a boolean.");
  }

  const effect: EffectInstance = {
    id,
    type,
    name,
    startFrame,
    durationFrames,
    position: sanitizePosition(value.position, "position"),
    targetObjectId,
    parameters: sanitizeParameters(value.parameters, "parameters"),
    enabled
  };
  return effect;
}

export function sanitizeEffects(effects: unknown): EffectInstance[] {
  if (effects === undefined) return [];
  if (!Array.isArray(effects)) {
    throw new Error("Project effects.instances must be an array.");
  }
  for (let index = 0; index < effects.length; index += 1) {
    if (!Object.hasOwn(effects, index)) {
      throw new Error("Project effects.instances must be dense.");
    }
  }

  const seen = new Set<string>();
  return effects.map((effect, index) => {
    let sanitized: EffectInstance;
    try {
      sanitized = withEffectDefaults(effect, `effect_legacy_${index + 1}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Effect is invalid.";
      throw new Error(`effects.instances[${index}]: ${message}`);
    }
    if (seen.has(sanitized.id)) {
      throw new Error(
        `effects.instances[${index}]: duplicate effect ID ${sanitized.id}.`
      );
    }
    seen.add(sanitized.id);
    return sanitized;
  });
}
