import type {
  ResourcePackAsset,
  ResourcePackTextureAsset
} from "./ResourcePackTypes";

export interface TextureAtlasEntry {
  textureId: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  uv: [number, number, number, number];
}

export interface TextureAtlasLayout {
  width: number;
  height: number;
  tileSize: number;
  columns: number;
  rows: number;
  entries: TextureAtlasEntry[];
}

export interface BuiltTextureAtlas extends TextureAtlasLayout {
  dataUrl: string;
}

export class TextureAtlasBuilder {
  static createLayout(
    textures: ResourcePackTextureAsset[],
    tileSize = 16,
    maxColumns = 16
  ): TextureAtlasLayout {
    const safeTileSize = Math.max(1, Math.trunc(tileSize));
    const columns = Math.max(
      1,
      Math.min(Math.max(1, Math.trunc(maxColumns)), textures.length || 1)
    );
    const rows = Math.max(1, Math.ceil(textures.length / columns));
    const width = columns * safeTileSize;
    const height = rows * safeTileSize;
    const entries = textures.map((texture, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = column * safeTileSize;
      const y = row * safeTileSize;
      return {
        textureId: texture.id,
        path: texture.path,
        x,
        y,
        width: safeTileSize,
        height: safeTileSize,
        uv: [x / width, y / height, (x + safeTileSize) / width, (y + safeTileSize) / height]
      } satisfies TextureAtlasEntry;
    });

    return { width, height, tileSize: safeTileSize, columns, rows, entries };
  }

  static async build(pack: ResourcePackAsset, tileSize = 16): Promise<BuiltTextureAtlas> {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      throw new Error("Texture atlas rendering requires a browser canvas runtime.");
    }
    const layout = TextureAtlasBuilder.createLayout(pack.textures, tileSize);
    const canvas = document.createElement("canvas");
    canvas.width = layout.width;
    canvas.height = layout.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create a 2D texture atlas context.");
    context.imageSmoothingEnabled = false;

    await Promise.all(
      layout.entries.map(async (entry) => {
        const texture = pack.textures.find((candidate) => candidate.id === entry.textureId);
        if (!texture) return;
        const image = await loadImage(texture.dataUrl);
        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(
          image,
          0,
          0,
          sourceSize,
          sourceSize,
          entry.x,
          entry.y,
          entry.width,
          entry.height
        );
      })
    );

    return {
      ...layout,
      dataUrl: canvas.toDataURL("image/png")
    };
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A resource pack texture could not be decoded."));
    image.src = dataUrl;
  });
}
