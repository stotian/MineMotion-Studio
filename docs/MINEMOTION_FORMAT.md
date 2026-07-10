# MineMotion Package Format

`.minemotion` files are Phase 3 project packages. The current implementation is
a JSON payload with MIME type `application/vnd.minemotion.package+json`.

## Top-Level Shape

```json
{
  "packageFormat": "minemotion-package-json",
  "manifest": {},
  "project": {},
  "assets": {
    "models": {},
    "skins": {},
    "blockbench": {},
    "audio": {},
    "thumbnails": {},
    "metadata": {}
  }
}
```

## Manifest

The manifest stores:

- format name
- package schema version
- MineMotion app version
- created and modified timestamps
- project name and author
- asset count
- plugin requirements
- package warnings
- compatibility metadata

## Assets

The package embeds:

- OBJ raw strings under `assets.models`
- skin data URLs under `assets.skins`
- Blockbench raw JSON under `assets.blockbench`
- audio data URLs under `assets.audio`
- asset library metadata under `assets.metadata.assetLibrary`

World import metadata and optional chunk caches are stored in package metadata.
Rig poses, skin references, bone tracks, and Blockbench model metadata are
stored in the embedded project JSON.

## Compatibility

Legacy `.mmsproj` JSON files remain importable. The Export panel can still
download a legacy `.mmsproj` file for compatibility.
