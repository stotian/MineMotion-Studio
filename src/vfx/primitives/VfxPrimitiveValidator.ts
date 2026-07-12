import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import {
  VFX_PRIMITIVE_LIMITS,
  VFX_PRIMITIVE_VERSION,
  type VfxPrimitiveDescriptor,
  type VfxPrimitiveKind
} from "./VfxPrimitiveTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_TEXT_LENGTH = 128;
const PRIMITIVE_KINDS = new Set<VfxPrimitiveKind>([
  "particle-emitter",
  "beam",
  "trail",
  "expanding-ring",
  "light-pulse"
]);
const PARTICLE_SHAPES = new Set(["point", "sphere", "ring", "box"]);
const MISSING_VALUE = Symbol("missing-vfx-primitive-value");

function issue(
  code: string,
  message: string,
  path: string,
  severity: ValidationIssue["severity"] = "error"
): ValidationIssue {
  return { code, message, path, severity };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareIssues(left: ValidationIssue, right: ValidationIssue): number {
  return (
    compareText(left.severity, right.severity) ||
    compareText(left.code, right.code) ||
    compareText(left.path ?? "", right.path ?? "") ||
    compareText(left.message, right.message)
  );
}

export function sortVfxPrimitiveIssues(
  issues: readonly ValidationIssue[]
): ValidationIssue[] {
  return [...issues].sort(compareIssues);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getOwnValue(
  record: Record<string, unknown>,
  key: string
): unknown | typeof MISSING_VALUE {
  const property = Object.getOwnPropertyDescriptor(record, key);
  return property && property.enumerable && "value" in property
    ? property.value
    : MISSING_VALUE;
}

function validateNumber(
  record: Record<string, unknown>,
  key: string,
  errors: ValidationIssue[],
  options: { min: number; max?: number; exclusiveMin?: boolean } = { min: 0 }
): void {
  const value = getOwnValue(record, key);
  const belowMinimum =
    typeof value === "number" &&
    (options.exclusiveMin ? value <= options.min : value < options.min);
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    belowMinimum ||
    (options.max !== undefined && value > options.max)
  ) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_NUMBER_INVALID",
        `${key} must be finite and within its supported range.`,
        key
      )
    );
  }
}

function validateBudget(
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  hardCap: number,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  const value = getOwnValue(record, key);
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_INTEGER_INVALID",
        `${key} must be a safe integer of at least ${minimum}.`,
        key
      )
    );
    return;
  }
  if ((value as number) > hardCap) {
    warnings.push(
      issue(
        "VFX_PRIMITIVE_BUDGET_CLAMPED",
        `${key} will be clamped to the hard limit ${hardCap} before allocation.`,
        key,
        "warning"
      )
    );
  }
}

function isFiniteVector3(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== 3) return false;
  for (let index = 0; index < 3; index += 1) {
    const component = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      !component ||
      !component.enumerable ||
      !("value" in component) ||
      typeof component.value !== "number" ||
      !Number.isFinite(component.value)
    ) {
      return false;
    }
  }
  return true;
}

function validateVector(
  record: Record<string, unknown>,
  key: string,
  errors: ValidationIssue[]
): void {
  if (!isFiniteVector3(getOwnValue(record, key))) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_VECTOR_INVALID",
        `${key} must be a finite vector3 tuple.`,
        key
      )
    );
  }
}

function validateParticle(
  record: Record<string, unknown>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  validateBudget(
    record,
    "count",
    1,
    VFX_PRIMITIVE_LIMITS.particles,
    errors,
    warnings
  );
  if (!PARTICLE_SHAPES.has(getOwnValue(record, "shape") as string)) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_ENUM_INVALID",
        "Particle shape is unsupported.",
        "shape"
      )
    );
  }
  validateNumber(record, "radius", errors);
  validateNumber(record, "speed", errors);
  validateNumber(record, "lifetimeSeconds", errors, {
    min: 0,
    exclusiveMin: true
  });
  validateNumber(record, "startSize", errors);
  validateNumber(record, "endSize", errors);
  validateNumber(record, "startOpacity", errors, { min: 0, max: 1 });
  validateNumber(record, "endOpacity", errors, { min: 0, max: 1 });
}

function validateBeam(
  record: Record<string, unknown>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  validateVector(record, "start", errors);
  validateVector(record, "end", errors);
  validateBudget(
    record,
    "subdivisions",
    1,
    VFX_PRIMITIVE_LIMITS.beamSubdivisions,
    errors,
    warnings
  );
  validateNumber(record, "jitter", errors);
  validateNumber(record, "width", errors, { min: 0, exclusiveMin: true });
  validateNumber(record, "opacity", errors, { min: 0, max: 1 });
}

function validateTrail(
  record: Record<string, unknown>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  const points = getOwnValue(record, "points");
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.length > VFX_PRIMITIVE_LIMITS.trailControlPoints
  ) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_POINTS_INVALID",
        `Trail points must contain 2-${VFX_PRIMITIVE_LIMITS.trailControlPoints} finite tuples.`,
        "points"
      )
    );
  } else {
    for (let index = 0; index < points.length; index += 1) {
      if (!isFiniteVector3(points[index])) {
        errors.push(
          issue(
            "VFX_PRIMITIVE_VECTOR_INVALID",
            "Trail control point must be a finite vector3 tuple.",
            `points.${index}`
          )
        );
      }
    }
  }
  validateBudget(
    record,
    "segments",
    1,
    VFX_PRIMITIVE_LIMITS.trailSegments,
    errors,
    warnings
  );
  validateNumber(record, "startWidth", errors);
  validateNumber(record, "endWidth", errors);
  validateNumber(record, "startOpacity", errors, { min: 0, max: 1 });
  validateNumber(record, "endOpacity", errors, { min: 0, max: 1 });
}

function validateRing(
  record: Record<string, unknown>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  validateVector(record, "center", errors);
  validateNumber(record, "startRadius", errors);
  validateNumber(record, "endRadius", errors);
  validateNumber(record, "thickness", errors, {
    min: 0,
    exclusiveMin: true
  });
  validateBudget(
    record,
    "segments",
    3,
    VFX_PRIMITIVE_LIMITS.ringSegments,
    errors,
    warnings
  );
  validateNumber(record, "startOpacity", errors, { min: 0, max: 1 });
  validateNumber(record, "endOpacity", errors, { min: 0, max: 1 });
}

function validateLight(
  record: Record<string, unknown>,
  errors: ValidationIssue[]
): void {
  validateVector(record, "center", errors);
  validateNumber(record, "startRadius", errors);
  validateNumber(record, "endRadius", errors);
  validateNumber(record, "baseIntensity", errors);
  validateNumber(record, "peakIntensity", errors);
  const baseIntensity = getOwnValue(record, "baseIntensity");
  const peakIntensity = getOwnValue(record, "peakIntensity");
  if (
    typeof baseIntensity === "number" &&
    Number.isFinite(baseIntensity) &&
    typeof peakIntensity === "number" &&
    Number.isFinite(peakIntensity) &&
    peakIntensity < baseIntensity
  ) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_RANGE_INVALID",
        "Peak intensity cannot be lower than base intensity.",
        "peakIntensity"
      )
    );
  }
}

export function validateVfxPrimitiveDescriptor(
  descriptor: VfxPrimitiveDescriptor
): ValidationResult<VfxPrimitiveDescriptor> {
  if (!isPlainRecord(descriptor)) {
    return invalidResult([
      issue(
        "VFX_PRIMITIVE_DESCRIPTOR_INVALID",
        "VFX primitive descriptor must be an object.",
        "descriptor"
      )
    ]);
  }

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const version = getOwnValue(descriptor, "version");
  const id = getOwnValue(descriptor, "id");
  const kind = getOwnValue(descriptor, "kind");
  const color = getOwnValue(descriptor, "color");
  if (version !== VFX_PRIMITIVE_VERSION) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_VERSION_UNSUPPORTED",
        "VFX primitive descriptor version is unsupported.",
        "version"
      )
    );
  }
  if (
    typeof id !== "string" ||
    id.length > MAX_TEXT_LENGTH ||
    !IDENTIFIER_PATTERN.test(id)
  ) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_ID_INVALID",
        "VFX primitive ID is invalid.",
        "id"
      )
    );
  }
  if (
    typeof color !== "string" ||
    color.length > MAX_TEXT_LENGTH ||
    color.trim() === ""
  ) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_COLOR_INVALID",
        "VFX primitive color must be a non-empty bounded string.",
        "color"
      )
    );
  }
  if (!PRIMITIVE_KINDS.has(kind as VfxPrimitiveKind)) {
    errors.push(
      issue(
        "VFX_PRIMITIVE_KIND_UNSUPPORTED",
        "VFX primitive kind is unsupported.",
        "kind"
      )
    );
  } else if (kind === "particle-emitter") {
    validateParticle(descriptor, errors, warnings);
  } else if (kind === "beam") {
    validateBeam(descriptor, errors, warnings);
  } else if (kind === "trail") {
    validateTrail(descriptor, errors, warnings);
  } else if (kind === "expanding-ring") {
    validateRing(descriptor, errors, warnings);
  } else if (kind === "light-pulse") {
    validateLight(descriptor, errors);
  }

  return errors.length > 0
    ? invalidResult(sortVfxPrimitiveIssues(errors), sortVfxPrimitiveIssues(warnings))
    : validResult(descriptor, sortVfxPrimitiveIssues(warnings));
}
