# Minecraft Skins

MineMotion Studio supports importing user-provided Minecraft skin PNG files.
It does not bundle Minecraft skins.

## Supported Inputs

- Modern 64x64 PNG skins.
- Legacy 64x32 PNG skins.

Invalid dimensions are kept as project metadata but the renderer falls back to
generated character colors.

## UI Workflow

1. Select a character.
2. Open the inspector or Rig Studio.
3. Click **Import Skin**.
4. Choose a PNG file.
5. Check the displayed metadata:
   - resolution
   - guessed model type
   - valid/invalid status
6. Use **Reset Skin** to return to fallback colors.

## UV Mapping

The mapper assigns Minecraft skin atlas regions to these bones:

- head
- body
- leftArm
- rightArm
- leftLeg
- rightLeg

Alex uses 3px arm UV width. Steve uses 4px arm UV width. Legacy 64x32 skins
reuse mirrored right arm/leg regions for the left limbs.

## Limits

- Hat/jacket/sleeve/pants overlay layers are not fully separated yet.
- Fine alpha heuristics for automatic slim/classic detection are planned.
- Resource pack textures are not part of Phase 5.
