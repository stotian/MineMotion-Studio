export function chooseChunkLod(chunkCount: number): "full" | "reduced" {
  return chunkCount > 64 ? "reduced" : "full";
}
