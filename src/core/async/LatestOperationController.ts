export interface OperationContext {
  operationId: number;
  signal: AbortSignal;
}

export class OperationAbortedError extends Error {
  constructor(
    message = "Operation cancelled.",
    readonly operationId: number | null = null
  ) {
    super(message);
    this.name = "AbortError";
  }
}

interface ActiveOperation {
  operationId: number;
  controller: AbortController;
}

export class LatestOperationController {
  private nextOperationId = 1;
  private active: ActiveOperation | null = null;

  start(): OperationContext {
    this.abortActive("Operation superseded.");
    const controller = new AbortController();
    const operationId = this.nextOperationId;
    this.nextOperationId += 1;
    this.active = { operationId, controller };
    return { operationId, signal: controller.signal };
  }

  isCurrent(operationId: number): boolean {
    return (
      this.active?.operationId === operationId &&
      !this.active.controller.signal.aborted
    );
  }

  finish(operationId: number): boolean {
    if (this.active?.operationId !== operationId) return false;
    this.active = null;
    return true;
  }

  cancel(message = "Operation cancelled."): number | null {
    return this.abortActive(message);
  }

  private abortActive(message: string): number | null {
    const active = this.active;
    if (!active) return null;
    this.active = null;
    active.controller.abort(
      new OperationAbortedError(message, active.operationId)
    );
    return active.operationId;
  }
}

export function throwIfOperationAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw operationAbortReason(signal);
}

export function operationAbortReason(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  return new OperationAbortedError();
}

export function isOperationAborted(error: unknown): boolean {
  return (
    error instanceof OperationAbortedError ||
    (error instanceof Error && error.name === "AbortError")
  );
}
