# Presets And Templates

Templates create whole starter projects. Presets apply reusable changes to
objects, animation tracks, palettes, or skies.

## Templates

Built-in templates:

- Empty Scene
- Flat World
- Character Animation
- Cinematic Camera
- Sunset Scene
- Nether Mood

Templates are registered through `TemplateRegistry` and create full
`MineMotionProject` objects.

## Camera Presets

Camera presets define transform values for scene cameras:

- wide shot
- close-up
- low angle
- top-down
- orbit setup

## Rig Pose Presets

Rig pose presets store basic pose values for character rigs:

- idle
- walk pose A
- walk pose B
- look left
- look right
- early placeholder action poses

The current rig UI is still coarse. Detailed per-bone editing is planned for a
future phase.

## Animation Presets

Animation presets add starter transform tracks:

- walk cycle
- camera push-in
- camera orbit
- head look-around placeholder

## Block Palette Presets

Palette presets describe style direction for generated materials:

- classic
- lush
- nether

Real Minecraft texture loading is planned later through resource-pack support.
