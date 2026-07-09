# Settings

MineMotion Studio now has app-level settings and project-level settings.

## App Settings

App settings are stored locally in the runtime and use settings schema version
`1`.

### General

- autosave enabled
- autosave interval
- default project FPS
- default project duration
- default project name
- recent projects list

### Viewport

- background color
- grid enabled
- grid size
- camera helpers enabled
- orbit speed
- pan speed
- zoom speed
- render quality

### Editor

- theme
- UI scale
- snap enabled
- position snap
- rotation snap
- scale snap
- default interpolation

### Minecraft

- default sky preset
- default terrain size
- default block palette style
- resource pack path placeholder

### Plugins

- plugins enabled
- plugin folder path placeholder
- disabled plugin IDs

## Project Settings

Project settings are saved inside `.mmsproj` files and use project settings
schema version `1`.

- project name
- FPS
- duration frames
- default sky preset
- world source path
- render resolution preset
- author
- notes
- terrain preset
- block palette style

## Migration

Phase 1 projects used project schema version `1`; Phase 1.5 used schema version
`2`. Phase 2 opens both and migrates them to schema version `3` by adding
missing project settings, object metadata, cinematic effects, audio clips,
post-processing settings, render settings, active camera data, and timeline
lanes.
