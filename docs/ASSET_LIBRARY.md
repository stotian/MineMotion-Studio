# Asset Library

The Phase 3 asset library indexes assets that belong to a project package.

## Indexed Types

- OBJ models
- audio clips
- world summary metadata

Each record stores:

- id
- name
- type
- source path/name
- package path
- size
- MIME type
- import timestamp
- simple content hash
- missing flag

## Package Use

The `.minemotion` writer regenerates the asset library during packaging so the
package manifest can report asset count and warnings.
