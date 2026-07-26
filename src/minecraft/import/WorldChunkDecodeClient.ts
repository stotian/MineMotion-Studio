import {
  decodeWorldChunk,
  type WorldChunkDecodeRequest
} from "./WorldChunkDecode";
import type {
  WorldChunkDecodeRequestMessage,
  WorldChunkDecodeResponseMessage
} from "./WorldChunkDecodeWorkerProtocol";
import type { ImportedChunkData } from "./MinecraftChunkTypes";

export interface WorldChunkWorker {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeResponseMessage>) => void)
    | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(
    message: WorldChunkDecodeRequestMessage,
    transfer: Transferable[]
  ): void;
  terminate(): void;
}

export type WorldChunkWorkerFactory = () => WorldChunkWorker | null;

interface PendingDecode {
  request: WorldChunkDecodeRequest;
  resolve: (value: ImportedChunkData) => void;
  reject: (reason: Error) => void;
}

function createDefaultWorker(): WorldChunkWorker | null {
  if (typeof Worker === "undefined") return null;
  return new Worker(
    new URL("./WorldChunkDecode.worker.ts", import.meta.url),
    { type: "module", name: "minemotion-world-chunk-decoder" }
  );
}

export class WorldChunkDecodeClient {
  private worker: WorldChunkWorker | null = null;
  private workerUnavailable = false;
  private disposed = false;
  private nextRequestId = 1;
  private readonly pending = new Map<number, PendingDecode>();

  constructor(
    private readonly workerFactory: WorldChunkWorkerFactory =
      createDefaultWorker
  ) {}

  async decode(
    request: WorldChunkDecodeRequest
  ): ReturnType<typeof decodeWorldChunk> {
    if (this.disposed) {
      throw new Error("World chunk decoder is disposed.");
    }
    const worker = this.getWorker();
    if (!worker) return await decodeWorldChunk(request);

    const requestId = this.nextRequestId;
    this.nextRequestId += 1;
    const compressedData = request.compressedData.slice().buffer;
    return await new Promise((resolve, reject) => {
      this.pending.set(requestId, { request, resolve, reject });
      try {
        worker.postMessage(
          {
            type: "decode-world-chunk",
            requestId,
            request: {
              ...request,
              compressedData
            }
          },
          [compressedData]
        );
      } catch {
        this.disableWorkerAndFallback();
      }
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
    for (const pending of this.pending.values()) {
      pending.reject(new Error("World chunk decoder was disposed."));
    }
    this.pending.clear();
  }

  private getWorker(): WorldChunkWorker | null {
    if (this.workerUnavailable) return null;
    if (this.worker) return this.worker;
    try {
      this.worker = this.workerFactory();
    } catch {
      this.workerUnavailable = true;
      return null;
    }
    if (!this.worker) {
      this.workerUnavailable = true;
      return null;
    }
    this.worker.onmessage = this.handleMessage;
    this.worker.onerror = this.handleWorkerError;
    return this.worker;
  }

  private handleMessage = (
    event: MessageEvent<WorldChunkDecodeResponseMessage>
  ): void => {
    const message = event.data;
    const pending = this.pending.get(message.requestId);
    if (!pending) return;
    this.pending.delete(message.requestId);
    if (message.type === "world-chunk-decoded") {
      pending.resolve(message.chunk);
    } else {
      pending.reject(new Error(message.message));
    }
  };

  private handleWorkerError = (): void => {
    this.disableWorkerAndFallback();
  };

  private disableWorkerAndFallback(): void {
    this.worker?.terminate();
    this.worker = null;
    this.workerUnavailable = true;
    const pending = [...this.pending.entries()];
    for (const [requestId, item] of pending) {
      void decodeWorldChunk(item.request).then(
        (chunk) => {
          if (!this.pending.delete(requestId)) return;
          item.resolve(chunk);
        },
        (error: unknown) => {
          if (!this.pending.delete(requestId)) return;
          item.reject(
            error instanceof Error
              ? error
              : new Error("World chunk decoding failed.")
          );
        }
      );
    }
  }
}
