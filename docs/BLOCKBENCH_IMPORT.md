# Blockbench Import

Phase 5 adds a clean `.bbmodel` import MVP.

## Supported

- Read `.bbmodel` JSON files.
- Parse metadata:
  - name
  - format version
  - model format
- Parse cube `elements`.
- Parse `groups`.
- Parse texture references.
- Convert static cubes to an OBJ preview object.
- Store Blockbench metadata in the project/package.

## UI Workflow

1. Open **Rig Studio**.
2. Click **Import Blockbench Model**.
3. Choose a `.bbmodel` or JSON file.
4. MineMotion adds a static OBJ preview object to the scene.
5. The model appears in the Rig Studio Blockbench asset list.

## What Is Not Implemented Yet

- Automatic mapping from Blockbench groups to MineMotion bones.
- Texture image import from Blockbench projects.
- Animation import from Blockbench.
- Full pivot/rotation parity for all Blockbench model features.

The importer is intentionally honest: it previews static cube geometry now and
keeps enough metadata to support rig mapping later.
