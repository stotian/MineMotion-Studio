export interface SandboxRequest { id: string; type: "invoke"; capability: string; payload: unknown; }
export interface SandboxResponse { id: string; ok: boolean; payload?: unknown; error?: string; }

export class PluginMessageSandbox {
  private readonly pending = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor(private readonly worker: Pick<Worker, "postMessage" | "addEventListener" | "removeEventListener" | "terminate">, private readonly allowedCapabilities: ReadonlySet<string>, private readonly timeoutMs = 3000) {
    this.worker.addEventListener("message", this.onMessage as EventListener);
  }
  invoke(capability: string, payload: unknown): Promise<unknown> {
    if (!this.allowedCapabilities.has(capability)) return Promise.reject(new Error(`Capability ${capability} is not granted.`));
    const id = `sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("Plugin sandbox request timed out.")); }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type: "invoke", capability, payload } satisfies SandboxRequest);
    });
  }
  dispose(): void {
    this.worker.removeEventListener("message", this.onMessage as EventListener);
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Plugin sandbox closed.")); }
    this.pending.clear();
    this.worker.terminate();
  }
  private readonly onMessage = (event: MessageEvent<SandboxResponse>) => {
    const response = event.data;
    if (!response || typeof response.id !== "string") return;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    clearTimeout(pending.timer); this.pending.delete(response.id);
    if (response.ok) pending.resolve(response.payload); else pending.reject(new Error(response.error || "Plugin sandbox failed."));
  };
}
