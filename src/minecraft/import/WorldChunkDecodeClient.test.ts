import { describe, expect, it, vi } from "vitest";
import {
  WorldChunkDecodeClient,
  type WorldChunkWorker
} from "./WorldChunkDecodeClient";
import {
  decodeWorldChunk,
  type WorldChunkDecodeRequest
} from "./WorldChunkDecode";
import type {
  WorldChunkDecodeRequestMessage,
  WorldChunkDecodeResponseMessage
} from "./WorldChunkDecodeWorkerProtocol";

function createMinimalWorldChunkDecodeRequest(): WorldChunkDecodeRequest {
  return {
    compressedData: new Uint8Array([10, 0, 0, 0]),
    compressionType: 3,
    dimension: "overworld",
    fallbackChunkX: 4,
    fallbackChunkZ: -2,
    regionX: 0,
    regionZ: -1,
    maxVerticalSections: 24
  };
}

class SuccessfulWorker implements WorldChunkWorker {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeResponseMessage>) => void)
    | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn(
    (
      message: WorldChunkDecodeRequestMessage,
      transfer: Transferable[]
    ): void => {
      expect(transfer).toEqual([message.request.compressedData]);
      void decodeWorldChunk({
        ...message.request,
        compressedData: new Uint8Array(message.request.compressedData)
      }).then((chunk) => {
        this.onmessage?.({
          data: {
            type: "world-chunk-decoded",
            requestId: message.requestId,
            chunk
          }
        } as MessageEvent<WorldChunkDecodeResponseMessage>);
      });
    }
  );
  readonly terminate = vi.fn();
}

class FailingWorker implements WorldChunkWorker {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeResponseMessage>) => void)
    | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn(() => {
    queueMicrotask(() => this.onerror?.({} as ErrorEvent));
  });
  readonly terminate = vi.fn();
}

class PendingWorker implements WorldChunkWorker {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeResponseMessage>) => void)
    | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn();
  readonly terminate = vi.fn();
}

class DecodeErrorWorker implements WorldChunkWorker {
  onmessage:
    | ((event: MessageEvent<WorldChunkDecodeResponseMessage>) => void)
    | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn(
    (message: WorldChunkDecodeRequestMessage): void => {
      queueMicrotask(() => {
        this.onmessage?.({
          data: {
            type: "world-chunk-decode-error",
            requestId: message.requestId,
            message: "Invalid worker NBT."
          }
        } as MessageEvent<WorldChunkDecodeResponseMessage>);
      });
    }
  );
  readonly terminate = vi.fn();
}

describe("WorldChunkDecodeClient", () => {
  it("transfers a copy to one reusable worker and preserves source bytes", async () => {
    const worker = new SuccessfulWorker();
    const client = new WorldChunkDecodeClient(() => worker);
    const request = createMinimalWorldChunkDecodeRequest();
    const sourceBuffer = request.compressedData.buffer;

    const first = await client.decode(request);
    const second = await client.decode(request);

    expect(second).toEqual(first);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(request.compressedData.buffer).toBe(sourceBuffer);
    expect(request.compressedData).toEqual(new Uint8Array([10, 0, 0, 0]));
    const sent = worker.postMessage.mock.calls[0][0];
    expect(sent.request.compressedData).not.toBe(sourceBuffer);
    client.dispose();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("uses the deterministic main-thread fallback when workers are unavailable", async () => {
    const factory = vi.fn(() => null);
    const client = new WorldChunkDecodeClient(factory);

    await expect(
      client.decode(createMinimalWorldChunkDecodeRequest())
    ).resolves.toMatchObject({ id: "overworld:4,-2" });
    await expect(
      client.decode(createMinimalWorldChunkDecodeRequest())
    ).resolves.toMatchObject({ id: "overworld:4,-2" });
    expect(factory).toHaveBeenCalledOnce();
    client.dispose();
  });

  it("retries pending work through the fallback after worker bootstrap failure", async () => {
    const worker = new FailingWorker();
    const client = new WorldChunkDecodeClient(() => worker);

    await expect(
      client.decode(createMinimalWorldChunkDecodeRequest())
    ).resolves.toMatchObject({ id: "overworld:4,-2" });
    expect(worker.terminate).toHaveBeenCalledOnce();
    client.dispose();
  });

  it("preserves a worker decoder error without retrying invalid data", async () => {
    const worker = new DecodeErrorWorker();
    const client = new WorldChunkDecodeClient(() => worker);

    await expect(
      client.decode(createMinimalWorldChunkDecodeRequest())
    ).rejects.toThrow("Invalid worker NBT.");
    expect(worker.terminate).not.toHaveBeenCalled();
    client.dispose();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("rejects pending work and terminates on disposal", async () => {
    const worker = new PendingWorker();
    const client = new WorldChunkDecodeClient(() => worker);
    const pending = client.decode(createMinimalWorldChunkDecodeRequest());

    client.dispose();

    await expect(pending).rejects.toThrow("was disposed");
    expect(worker.terminate).toHaveBeenCalledOnce();
    await expect(
      client.decode(createMinimalWorldChunkDecodeRequest())
    ).rejects.toThrow("is disposed");
  });
});
