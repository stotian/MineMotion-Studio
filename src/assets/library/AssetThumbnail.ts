import type { AssetRecord, AssetThumbnail } from "./AssetRecord";

export interface AssetThumbnailRequest {
  assetId: string;
  name: string;
  type: AssetRecord["type"];
  sourceDataUrl?: string;
}

export async function generateAssetThumbnail(request: AssetThumbnailRequest): Promise<AssetThumbnail> {
  await Promise.resolve();
  try {
    if (request.sourceDataUrl?.startsWith("data:image/")) {
      return {
        status: "ready",
        dataUrl: request.sourceDataUrl,
        generatedAt: new Date().toISOString()
      };
    }
    const label = escapeXml(request.name.slice(0, 24));
    const kind = escapeXml(request.type);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="144" viewBox="0 0 240 144"><rect width="240" height="144" rx="12" fill="#20242b"/><path d="M24 106 76 54l34 34 25-25 81 81H24Z" fill="#495263"/><text x="20" y="28" fill="#f4f7fb" font-family="system-ui" font-size="14">${label}</text><text x="20" y="128" fill="#9eb0c8" font-family="system-ui" font-size="11">${kind}</text></svg>`;
    return {
      status: "ready",
      dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Thumbnail generation failed."
    };
  }
}

export async function generateThumbnailsBounded(
  requests: readonly AssetThumbnailRequest[],
  concurrency = 4
): Promise<Map<string, AssetThumbnail>> {
  const result = new Map<string, AssetThumbnail>();
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(8, concurrency)) }, async () => {
    while (cursor < requests.length) {
      const request = requests[cursor++];
      result.set(request.assetId, await generateAssetThumbnail(request));
    }
  });
  await Promise.all(workers);
  return result;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}
