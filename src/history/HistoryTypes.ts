export interface HistoryEntry<T> {
  label: string;
  value: T;
  createdAt: string;
}

export interface HistoryState<T> {
  past: HistoryEntry<T>[];
  future: HistoryEntry<T>[];
}

