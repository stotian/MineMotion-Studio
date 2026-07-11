export type ValidationSeverity = "warning" | "error";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
}

export type ValidationResult<T> =
  | {
      ok: true;
      value: T;
      warnings: ValidationIssue[];
    }
  | {
      ok: false;
      errors: ValidationIssue[];
      warnings: ValidationIssue[];
    };

export function validResult<T>(
  value: T,
  warnings: ValidationIssue[] = []
): ValidationResult<T> {
  return { ok: true, value, warnings };
}

export function invalidResult<T = never>(
  errors: ValidationIssue[],
  warnings: ValidationIssue[] = []
): ValidationResult<T> {
  if (errors.length === 0) {
    throw new RangeError("An invalid validation result needs at least one error.");
  }
  return { ok: false, errors, warnings };
}
