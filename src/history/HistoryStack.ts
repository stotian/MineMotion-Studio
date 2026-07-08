import type { HistoryEntry, HistoryState } from "./HistoryTypes";

export class HistoryStack<T> {
  private state: HistoryState<T> = {
    past: [],
    future: []
  };

  constructor(private readonly limit = 50) {}

  push(value: T, label: string): void {
    const entry: HistoryEntry<T> = {
      label,
      value: structuredClone(value),
      createdAt: new Date().toISOString()
    };
    this.state = {
      past: [...this.state.past, entry].slice(-this.limit),
      future: []
    };
  }

  undo(currentValue: T): T | null {
    const entry = this.state.past.at(-1);
    if (!entry) return null;

    this.state = {
      past: this.state.past.slice(0, -1),
      future: [
        {
          label: "Redo checkpoint",
          value: structuredClone(currentValue),
          createdAt: new Date().toISOString()
        },
        ...this.state.future
      ].slice(0, this.limit)
    };
    return structuredClone(entry.value);
  }

  redo(currentValue: T): T | null {
    const entry = this.state.future[0];
    if (!entry) return null;

    this.state = {
      past: [
        ...this.state.past,
        {
          label: "Undo checkpoint",
          value: structuredClone(currentValue),
          createdAt: new Date().toISOString()
        }
      ].slice(-this.limit),
      future: this.state.future.slice(1)
    };
    return structuredClone(entry.value);
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  clear(): void {
    this.state = { past: [], future: [] };
  }
}

