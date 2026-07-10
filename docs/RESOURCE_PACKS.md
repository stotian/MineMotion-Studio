# Resource Packs

MineMotion Studio imports user-provided Java Edition resource packs. It does not
ship Minecraft textures.

## Import

1. Open **Lighting** from the top bar.
2. In **Resource Packs**, choose **Import ZIP** or **Import Folder**.
3. Select the pack.
4. Review its description, `pack_format`, texture count, and warnings.
5. Click **Apply** to activate a stored pack or **Reset Textures** to use the
   generated color palette.

The scanner looks for:

```text
pack.mcmeta
assets/minecraft/textures/block/*.png
assets/minecraft/textures/block/*.png.mcmeta
```

Nested block texture folders are retained. Texture names are matched through
the block texture map, including special candidates for grass, logs, water, and
ore placeholders.

## ZIP Support

The browser importer reads ZIP central-directory records and supports:

- stored entries (compression method 0)
- deflate entries (compression method 8) when `DecompressionStream` is available
- root folders inside the archive

The importer rejects encrypted archives, ZIP64 archives, unsafe paths, unknown
compression methods, more than 8,192 entries, or more than 512 MB expanded
content.

## Project Portability

Imported block textures are stored as PNG data URLs in schema v7 projects. The
`.minemotion` package also indexes them under:

```text
assets/resource-packs/<pack-id>/pack.mcmeta
assets/resource-packs/<pack-id>/assets/minecraft/textures/block/...
```

This keeps a project usable when the original ZIP or folder is unavailable.

## Fallbacks

- No active pack: use the generated block palette.
- Missing mapped texture: use that block's generated palette color.
- Missing `pack.mcmeta`: import textures and display a warning.
- No block textures: store the pack metadata, mark the asset incomplete, and
  continue using palette colors.

## Texture Atlas

`TextureAtlasBuilder` creates deterministic tile positions and normalized UVs.
In a browser it can also decode the imported PNG data and produce a nearest-
neighbor canvas atlas. The current instanced block renderer uses individual
texture maps; per-face atlas meshing is prepared for a later renderer upgrade.
