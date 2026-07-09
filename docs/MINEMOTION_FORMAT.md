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
- audio data URLs under `assets.audio`
- asset library metadata under `assets.metadata.assetLibrary`

World data is currently stored as summary metadata only. Real chunk payload
packaging is future work.

## Compatibility

Legacy `.mmsproj` JSON files remain importable. The Export panel can still
download a legacy `.mmsproj` file for compatibility.
