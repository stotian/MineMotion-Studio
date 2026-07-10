export class ResourcePackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourcePackError";
  }
}

export class ResourcePackFormatError extends ResourcePackError {
  constructor(message: string) {
    super(message);
    this.name = "ResourcePackFormatError";
  }
}

export class ResourcePackValidationError extends ResourcePackError {
  constructor(message: string) {
    super(message);
    this.name = "ResourcePackValidationError";
  }
}
