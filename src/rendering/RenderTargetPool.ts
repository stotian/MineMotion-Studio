export interface DisposableRenderTarget { width: number; height: number; dispose(): void; }
export interface RenderTargetFactory<T extends DisposableRenderTarget> { create(width: number, height: number): T; }

export class RenderTargetPool<T extends DisposableRenderTarget> {
  private readonly available = new Map<string, T[]>();
  private readonly leased = new Set<T>();
  constructor(private readonly factory: RenderTargetFactory<T>, private readonly maximumAvailable = 8) {}
  acquire(width: number, height: number): T {
    const key = `${width}x${height}`; const bucket = this.available.get(key); const target = bucket?.pop() ?? this.factory.create(width, height);
    this.leased.add(target); return target;
  }
  release(target: T): void {
    if (!this.leased.delete(target)) return;
    const key = `${target.width}x${target.height}`; const bucket = this.available.get(key) ?? [];
    if (this.availableCount() >= this.maximumAvailable) target.dispose(); else { bucket.push(target); this.available.set(key, bucket); }
  }
  dispose(): void {
    for (const target of this.leased) target.dispose();
    for (const bucket of this.available.values()) for (const target of bucket) target.dispose();
    this.leased.clear(); this.available.clear();
  }
  snapshot(): { leased: number; available: number } { return { leased: this.leased.size, available: this.availableCount() }; }
  private availableCount(): number { return [...this.available.values()].reduce((sum, bucket) => sum + bucket.length, 0); }
}
