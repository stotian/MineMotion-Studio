import type { ErrorCode } from "./ErrorCode";
import { EngineError, type EngineErrorOptions } from "./EngineError";

export interface UserFacingErrorOptions extends EngineErrorOptions {
  title?: string;
  suggestedAction?: string;
}

export class UserFacingError extends EngineError {
  readonly title: string;
  readonly suggestedAction?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options: UserFacingErrorOptions = {}
  ) {
    super(code, message, options);
    this.name = "UserFacingError";
    this.title = options.title ?? "MineMotion Studio";
    this.suggestedAction = options.suggestedAction;
  }
}
