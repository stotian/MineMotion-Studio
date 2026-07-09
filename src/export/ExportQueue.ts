export class ExportQueue {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  reset(): void {
    this.cancelled = false;
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error("Export cancelled.");
    }
  }

  get isCancelled(): boolean {
    return this.cancelled;
  }
}
