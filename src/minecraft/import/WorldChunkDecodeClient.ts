import {
  decodeWorldChunk,
  type WorldChunkDecodeRequest
} from "./WorldChunkDecode";
import {
  operationAbortReason,
  throwIfOperationAborted,
  type OperationContext
} from "../../core/async/LatestOperationController";
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
  operation: OperationContext;
  onAbort: () => void;
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
    request: WorldChunkDecodeRequest,
    operation: OperationContext
  ): ReturnType<typeof decodeWorldChunk> {
    if (this.disposed) {
      throw new Error("World chunk decoder is disposed.");
    }
    throwIfOperationAborted(operation.signal);
    const worker = this.getWorker();
    if (!worker) {
      const chunk = await decodeWorldChunk(request);
      throwIfOperationAborted(operation.signal);
      return chunk;
    }

    const requestId = this.nextRequestId;
    this.nextRequestId += 1;
    const compressedData = request.compressedData.slice().buffer;
    return await new Promise((resolve, reject) => {
      const onAbort = () => {
        const pending = this.takePending(requestId);
        if (!pending) return;
        pending.reject(operationAbortReason(operation.signal));
        this.disableWorkerAndFallback();
      };
      this.pending.set(requestId, {
        request,
        operation,
        onAbort,
        resolve,
        reject
      });
      operation.signal.addEventListener("abort", onAbort, { once: true });
      try {
        worker.postMessage(
          {
            type: "decode-world-chunk",
            requestId,
            operationId: operation.operationId,
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
    for (const requestId of [...this.pending.keys()]) {
      this.takePending(requestId)?.reject(
        new Error("World chunk decoder was disposed.")
      );
    }
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
    if (
      !pending ||
      message.operationId !== pending.operation.operationId
    ) {
      return;
    }
    this.takePending(message.requestId);
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
      void decodeWithAbortChecks(item.request, item.operation.signal).then(
        (chunk) => {
          const current = this.takePending(requestId);
          if (current !== item) return;
          current.resolve(chunk);
        },
        (error: unknown) => {
          const current = this.takePending(requestId);
          if (current !== item) return;
          current.reject(
            error instanceof Error
              ? error
              : new Error("World chunk decoding failed.")
          );
        }
      );
    }
  }

  private takePending(requestId: number): PendingDecode | null {
    const pending = this.pending.get(requestId);
    if (!pending) return null;
    this.pending.delete(requestId);
    pending.operation.signal.removeEventListener("abort", pending.onAbort);
    return pending;
  }
}

async function decodeWithAbortChecks(
  request: WorldChunkDecodeRequest,
  signal: AbortSignal
): ReturnType<typeof decodeWorldChunk> {
  throwIfOperationAborted(signal);
  const chunk = await decodeWorldChunk(request);
  throwIfOperationAborted(signal);
  return chunk;
}
