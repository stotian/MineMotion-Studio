# User Guide

This guide describes the editor workflow through Phase 8.

## Start The App

```powershell
npm run dev
```

Open the local Vite URL shown by the terminal.

## Add A Cinematic Effect

1. Move the timeline to the desired frame.
2. Use the **Effects** panel.
3. Click an effect such as **Lightning Strike**, **Impact Frame**, **Flash**,
   **Camera Shake**, **Speed Lines**, **Shockwave**, or **Glow Burst**.
4. Select the new timeline block.
5. Edit timing, position, color, alpha, radius, strength, or count in the
   inspector.
6. Press **Play** or scrub the timeline.

## Change Post-Processing

Use the **Post** section in the Effects panel to choose a preset such as
**Cinematic Warm**, **Dark Horror**, **Anime Impact**, **Retro Pixel**, or
**Noir**.

Use the inspector's **Post** section for numeric tuning.

## Edit Animation In The Timeline

Use the view tabs at the bottom of the editor:

- **Timeline** shows the playhead, markers, rig, effect, audio, and lighting lanes.
- **Dopesheet** groups keyframes by target and property.
- **Graph** displays X/Y/Z value curves for the selected property.
- **NLA** stores reusable clip instances on target lanes.

In the Dopesheet, click to select, Ctrl-click to toggle, Shift-click for a
range, and drag selected keys to retime them. The command row supports copy,
paste, duplicate, delete, frame snap, exact nudges, timing scale, and
interpolation changes.

Use **Add Marker** for cuts, beats, and SFX cues. Select keys and choose
**Save Clip** to create a reusable animation clip, then apply it to a compatible
target or add it to the NLA stack.

## Use Lighting Studio

1. Click **Lighting** in the top bar.
2. Apply Clear Day, Golden Hour, Moonlit Night, Horror Fog, Nether Heat, End
   Void, Storm Fight, or Anime Impact Lighting.
3. Tune sun direction/intensity, ambient intensity, shadows, fog, and time of
   day.
4. Tune bloom, vignette, grain, chromatic aberration, exposure, and contrast.
5. Move the playhead and click **Keyframe at <frame>** to animate the current
   environment and post values.

Environment keyframes appear on the **Lighting & Sky** timeline lane.

## Import A Resource Pack

1. Open **Lighting**.
2. Click **Import ZIP** or **Import Folder**.
3. Select a Java Edition resource pack containing `pack.mcmeta` and
   `assets/minecraft/textures/block/`.
4. Review the imported `pack_format`, description, texture count, and warnings.
5. Click **Apply** on a stored pack, or **Reset Textures** for generated colors.

MineMotion embeds selected block textures in current projects. It does not
bundle Minecraft textures.

## Use Render Preview

Click **Render Preview** in the top bar or Effects panel. The viewport switches
to a cinematic preview mode with active camera label, post-processing, effects,
and optional bars.

## Import A Minecraft World

1. Click **Open World**.
2. Select a Minecraft Java Edition world folder.
3. MineMotion scans `level.dat`, Overworld `region/`, Nether `DIM-1/region/`,
   and End `DIM1/region/`.
4. In **World Import**, choose the dimension, center chunk, radius, max chunks,
   max region files, and max vertical sections.
5. Click **Import Chunks**.
6. Use **Focus World** to frame the imported chunks in the viewport.

The importer does not load the whole world by default. It imports a bounded
chunk range around spawn or manual chunk coordinates.

## Work With Minecraft Rigs

1. Select a character in the outliner or viewport.
2. Use the inspector's **Rig And Skin** section to choose Steve, Alex, or a
   prepared placeholder rig.
3. Expand the character in the outliner to select bones such as `head`,
   `rightArm`, or `leftLeg`.
4. Edit **Bone Rotation** in the inspector.
5. Click **Add Bone Keyframe** to add a `bone.rotation.*` timeline track.

The same controls are grouped in **Rig Studio** from the top bar.

## Import A Skin

1. Select a character.
2. Click **Import Skin** in the inspector or Rig Studio.
3. Choose a PNG skin.
4. MineMotion validates 64x64 and legacy 64x32 skins and shows metadata.
5. Use **Reset Skin** to return to generated fallback colors.

MineMotion does not bundle Minecraft skins.

## Apply Poses And Rig Animations

Use the inspector or **Rig Studio** to apply:

- Idle
- Walk A / Walk B
- Run A / Run B
- Jump / Land
- Attack Windup / Attack Swing
- Block/Defend
- Look Left / Look Right
- Sitting
- Crouch
- Fear/Back Away
- Hero Pose

Animation presets create bone keyframes for idle breathing, walk, run, sword
swing, hit reaction, camera-ready turn-around, head look around, and jump/land.

## Import A Blockbench Model

1. Open **Rig Studio**.
2. Click **Import Blockbench Model**.
3. Select a `.bbmodel` or JSON file.
4. MineMotion parses cube elements/groups/textures and creates a static OBJ
   preview object.

Automatic rig mapping is prepared but not implemented yet.

## Export

Click **Export** in the top bar.

Available output:

- **Save .minemotion**: saves the full package payload.
- **Export .mmsproj**: exports legacy-compatible schema v8 project JSON.
- **PNG Frame**: captures the current viewport frame.
- **PNG ZIP**: captures the selected frame range as numbered PNG files inside a
  ZIP archive.
- **WebM**: records the live viewport canvas when browser `MediaRecorder`
  support is available.
- **WAV**: mixes imported audio and generated placeholder SFX when
  `OfflineAudioContext` support is available.

Export settings include output name, format, frame range, FPS, width, height,
quality, camera target, transparency, post-processing, VFX overlays, cinematic
bars, and audio inclusion flags.

## Add SFX

Use **Import SFX** in the Effects panel for `.wav`, `.mp3`, or `.ogg` files.
You can also add built-in placeholder SFX such as Lightning Crack, Impact Hit,
Whoosh, Deep Boom, Camera Rumble, Magic Pulse, or Glitch Pop.

Audio clips appear on the timeline and trigger during playback. WAV export mixes
these clips into a single output file when the browser supports offline audio
rendering.

## Select And Edit Objects

Use the outliner or viewport to select an object. The inspector can edit:

- name
- visibility
- locked state
- position
- rotation
- scale

Locked objects cannot be transformed, duplicated, or deleted.

## Use Presets

When a compatible object is selected, the inspector exposes:

- camera presets
- rig pose presets
- animation presets

Camera presets include wide, close-up, low angle, top-down, orbit, Dutch angle,
chase, over-shoulder, and dramatic zoom setups.

## Keyboard Shortcuts

- `Ctrl+P`: command palette
- `Ctrl+S`: save `.minemotion`
- `Ctrl+Z`: undo
- `Ctrl+Y`: redo
- `Ctrl+Shift+Z`: redo
- `Space`: play/pause
- `Ctrl+D`: duplicate selected object
- `Delete`: delete selected object or selected effect

## Save And Load

Use the top toolbar or `Ctrl+S` to download a `.minemotion` package. Legacy
`.mmsproj` and JSON project files can still be opened. Phase 1, Phase 1.5, and
Projects using schemas v1 through v7 are migrated to schema v8 when opened.

## Current Limits

- Animated resource-pack textures are detected but not played yet.
- Per-face atlas meshing is prepared but the MVP uses one texture per block
  material.
- Blockbench rig mapping is not automatic yet.
- IK solver math is not implemented yet.
- Older non-palette chunk formats are not fully decoded.
- Browser decompression support is required for real compressed `level.dat` and
  `.mca` payloads.
- External plugin scripts are not executed yet.
- Native Tauri file dialogs are not wired yet.
- MP4 export is planned for a future FFmpeg/native pipeline.
