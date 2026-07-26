import { decodeWorldChunk } from "./WorldChunkDecode";
import type {
  WorldChunkDecodeRequestMessage,
  WorldChunkDecodeResponseMessage
} from "./WorldChunkDecodeWorkerProtocol";

interface WorkerScope {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeRequestMessage>) => void)
    | null;
  postMessage(message: WorldChunkDecodeResponseMessage): void;
}

const workerScope = globalThis as unknown as WorkerScope;

workerScope.onmessage = (event) => {
  const message = event.data;
  if (message.type !== "decode-world-chunk") return;
  void decodeWorldChunk({
    ...message.request,
    compressedData: new Uint8Array(message.request.compressedData)
  }).then(
    (chunk) => {
      workerScope.postMessage({
        type: "world-chunk-decoded",
        requestId: message.requestId,
        operationId: message.operationId,
        chunk
      });
    },
    (error: unknown) => {
      workerScope.postMessage({
        type: "world-chunk-decode-error",
        requestId: message.requestId,
        operationId: message.operationId,
        message:
          error instanceof Error
            ? error.message
            : "World chunk decoding failed."
      });
    }
  );
};
