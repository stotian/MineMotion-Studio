import type { ImportedChunkData } from "./MinecraftChunkTypes";
import type { WorldChunkDecodeRequest } from "./WorldChunkDecode";

export interface WorldChunkDecodeWorkerRequest
  extends Omit<WorldChunkDecodeRequest, "compressedData"> {
  compressedData: ArrayBuffer;
}

export interface WorldChunkDecodeRequestMessage {
  type: "decode-world-chunk";
  requestId: number;
  operationId: number;
  request: WorldChunkDecodeWorkerRequest;
}

export type WorldChunkDecodeResponseMessage =
  | {
      type: "world-chunk-decoded";
      requestId: number;
      operationId: number;
      chunk: ImportedChunkData;
    }
  | {
      type: "world-chunk-decode-error";
      requestId: number;
      operationId: number;
      message: string;
    };
