export class WorldImportError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly recoverable = true
  ) {
    super(message);
    this.name = "WorldImportError";
  }
}
