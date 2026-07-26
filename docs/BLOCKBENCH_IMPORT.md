# Blockbench Import

MineMotion provides a bounded `.bbmodel` static geometry and rig-animation
workflow.

## Supported

- Read `.bbmodel` JSON files.
- Parse metadata:
  - name
  - format version
  - model format
- Parse cube `elements`.
- Parse current outliners and legacy groups.
- Preserve texture and animation metadata.
- Bake cube/group pivots and rotations into a deterministic OBJ preview.
- Store Blockbench metadata in the project/package.
- Automatically map unique exact names and reviewed aliases to MineMotion bones.
- Persist manual mappings or explicit exclusions per rig preset.
- Convert supported numeric bone-rotation clips to editable timeline keys.

## UI Workflow

1. Open **Rig Studio**.
2. Click **Import Blockbench Model**.
3. Choose a `.bbmodel` or JSON file.
4. MineMotion adds a static OBJ preview object to the scene.
5. The model appears in the Rig Studio Blockbench asset list.
6. Select a character, review automatic mappings, and map remaining groups.
7. Select a reported clip and click **Apply mapped clip**.

## What Is Not Implemented Yet

- Texture image import from Blockbench projects.
- Position/scale animation channels and Blockbench expressions.
- Advanced interpolation and non-bone animators.
- Full parity for every Blockbench model/plugin feature.

The importer never executes source expressions or plugin data. Unsupported
features remain in the raw asset and are disclosed in reports and diagnostics.
