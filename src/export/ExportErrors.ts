export class ExportError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message);
    this.name = "ExportError";
  }
}
