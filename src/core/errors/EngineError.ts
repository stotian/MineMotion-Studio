import type { ErrorCode } from "./ErrorCode";

export interface EngineErrorOptions {
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
  recoverable?: boolean;
}

export class EngineError extends Error {
  readonly code: ErrorCode;
  readonly details: Readonly<Record<string, unknown>>;
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, options: EngineErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "EngineError";
    this.code = code;
    this.details = Object.freeze({ ...(options.details ?? {}) });
    this.recoverable = options.recoverable ?? false;
  }
}
