export interface DisposableLike {
  dispose?: () => void;
}

export function disposeAll(resources: Iterable<DisposableLike | undefined>): void {
  for (const resource of resources) {
    resource?.dispose?.();
  }
}
