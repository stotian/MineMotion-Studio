# MineMotion package format

`.minemotion` is a versioned **stored ZIP** package. The archive is deliberately
simple and bounded so MineMotion can verify every entry before hydrating a
project.

## Required entries

```text
package-index.json
manifest.json
project.json
assets/metadata.json
```

The index identifies package format `minemotion-zip`, schema version `1`, the
three metadata entries, and every asset category/path pair. Asset data uses
reviewed prefixes such as `assets/models/`, `assets/skins/`, `audio/`, and
`world/cache/`.

## Safety rules

The reader rejects unsupported compression, encryption, data descriptors,
unsafe or traversal paths, duplicate names, duplicate indexed assets, CRC
failures, missing entries, category/path mismatches, excessive entry counts,
oversized entries, and oversized total extraction. The writer enforces the
same count and size ceilings before creating the archive.

## Project and assets

`project.json` contains the schema-10 serializable project. Assets are stored as
separate ZIP entries and referenced through the package index. Portable world
chunks are stored once as a versioned palette cache when embedding is enabled.
Reference-only saves omit runtime chunks and record that the read-only source
must be selected again.

The project document may contain an `ultra` schema-1 subdocument. It stores
bounded plain-data records and capability contracts for Phases 36–600 and never embeds video references,
GPU resources, processes or executable graph code. Historical schema-10
projects without this field open with an empty default Ultra document.

## Compatibility

Historical JSON `.minemotion` packages with package format
`minemotion-package-json` still open and migrate. Legacy `.mmsproj` JSON remains
importable/exportable for compatibility. New saves use the ZIP format.
